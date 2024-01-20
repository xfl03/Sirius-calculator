import type { DataProvider } from '../data-provider/data-provider'
import { DataProviderFactory } from '../data-provider/data-provider-factory'
import { CharacterBaseService } from './character-base-service'
import { type BloomBonusDetail, CharacterBloomService } from './character-bloom-service'
import { type SenseDetail, SenseService } from './sense-service'
import { type StarActDetail, StarActService } from './star-act-service'
import { type Character } from '../master/character'
import { siriusTimestampToDate } from '../util/time-util'
import { CharacterCalculator, type CharacterStatusDetail } from '../character-calculator/character-calculator'

export class CharacterService {
  private readonly characterBaseService: CharacterBaseService
  private readonly starActService: StarActService
  private readonly senseService: SenseService
  private readonly characterBloomService: CharacterBloomService

  private readonly characterCalculator: CharacterCalculator
  public constructor (private readonly dataProvider: DataProvider = DataProviderFactory.defaultDataProvider()) {
    this.characterBaseService = new CharacterBaseService(dataProvider)
    this.starActService = new StarActService(dataProvider)
    this.senseService = new SenseService(dataProvider)
    this.characterBloomService = new CharacterBloomService(dataProvider)

    this.characterCalculator = new CharacterCalculator(dataProvider)
  }

  private async getCharacter (id: number): Promise<Character> {
    return await this.dataProvider.getMasterDataById<Character>('character', id)
  }

  /**
   * 获得角色（卡牌）详情信息
   * @param id
   */
  public async getCharacterDetail (id: number): Promise<CharacterDetail> {
    const character = await this.getCharacter(id)
    return {
      name: character.name,
      rarity: character.rarity,
      attribute: character.attribute,
      status: [await this.characterCalculator.getMinCharacterStatus(character),
        await this.characterCalculator.getMaxCharacterStatus(character)],
      characterBase: await this.characterBaseService.getCharacterBaseName(character.characterBaseMasterId),
      starAct: await this.starActService.getStarActDetail(character.starActMasterId, character.bloomBonusGroupMasterId),
      sense: await this.senseService.getSenseDetail(character.senseMasterId, character.bloomBonusGroupMasterId),
      bloomBonuses: await this.characterBloomService.getBloomBonusDetails(character.bloomBonusGroupMasterId),
      displayStartAt: siriusTimestampToDate(character.displayStartAt)
    }
  }
}

interface CharacterDetail {
  name: string
  rarity: string
  attribute: string
  status: CharacterStatusDetail[]
  characterBase: string
  starAct: StarActDetail
  sense: SenseDetail
  bloomBonuses: BloomBonusDetail[]
  displayStartAt: Date
}
