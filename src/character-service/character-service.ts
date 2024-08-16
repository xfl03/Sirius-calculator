import type { DataProvider } from '../data-provider/data-provider'
import { DataProviderFactory } from '../data-provider/data-provider-factory'
import { CharacterBaseService } from './character-base-service'
import { type BloomBonusDetail, CharacterBloomService } from './character-bloom-service'
import { type SenseDetail, SenseService } from './sense-service'
import { type StarActDetail, StarActService } from './star-act-service'
import { type Character } from '../master/character'
import { siriusTimestampToDate } from '../util/time-util'
import { CharacterCalculator, type CharacterStatusDetail } from '../character-calculator/character-calculator'
import { GachaService } from '../gacha-service/gacha-service'
import { StoryEventService } from '../event-service/story-event-service'
import { characterBaseChineseNames } from '../translation-service/character-translation'
import { type CharacterEpisodeDetail, CharacterEpisodeService } from './character-episode-service'
import { type CharacterOrPosterType, getCharacterPosterType } from '../common/character-or-poster-type'
import { type LeaderSenseDetail, LeaderSenseService } from './leader-sense-service'
import { CategoryService } from './category-service'

export class CharacterService {
  private readonly characterBaseService: CharacterBaseService
  private readonly starActService: StarActService
  private readonly senseService: SenseService
  private readonly characterBloomService: CharacterBloomService
  private readonly storyEventService: StoryEventService
  private readonly gachaService: GachaService
  private readonly characterEpisodeService: CharacterEpisodeService
  private readonly leaderSenseService: LeaderSenseService
  private readonly categoryService: CategoryService

  private readonly characterCalculator: CharacterCalculator
  public constructor (private readonly dataProvider: DataProvider = DataProviderFactory.defaultDataProvider()) {
    this.characterBaseService = new CharacterBaseService(dataProvider)
    this.starActService = new StarActService(dataProvider)
    this.senseService = new SenseService(dataProvider)
    this.characterBloomService = new CharacterBloomService(dataProvider)
    this.storyEventService = new StoryEventService(dataProvider)
    this.gachaService = new GachaService(dataProvider)
    this.characterEpisodeService = new CharacterEpisodeService(dataProvider)
    this.leaderSenseService = new LeaderSenseService(dataProvider)
    this.categoryService = new CategoryService(dataProvider)

    this.characterCalculator = new CharacterCalculator(dataProvider)
  }

  private async getCharacters (): Promise<Character[]> {
    return await this.dataProvider.getMasterData<Character>('character')
  }

  private async getCharacter (id: number): Promise<Character> {
    return await this.dataProvider.getMasterDataById<Character>('character', id)
  }

  private static getCategoryIds (character: Character, isAwaken: boolean): number[] {
    return character.categories.filter(it => it.isAwaken === isAwaken).map(it => it.categoryMasterId)
  }

  /**
   * 获得角色（卡牌）详情信息
   * @param id
   */
  public async getCharacterDetail (id: number): Promise<CharacterDetail> {
    const character = await this.getCharacter(id)
    const event = await this.storyEventService.getFirstAppearStoryEvent(character.displayStartAt)
    const gacha = await this.gachaService.getCharacterFirstAppearGacha(character.id, character.displayStartAt)
    const categoriesDefault = await this.categoryService.batchGetCategoryName(CharacterService.getCategoryIds(character, false))
    const categoriesAwaken = await this.categoryService.batchGetCategoryName(CharacterService.getCategoryIds(character, true))
    return {
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      attribute: character.attribute,
      status: [await this.characterCalculator.getMinCharacterStatus(character),
        await this.characterCalculator.getMaxCharacterStatus(character)],
      characterBase: await this.characterBaseService.getCharacterBaseName(character.characterBaseMasterId),
      characterBaseChinese: characterBaseChineseNames[character.id],
      starAct: await this.starActService.getStarActDetail(character.starActMasterId, character.bloomBonusGroupMasterId),
      sense: await this.senseService.getSenseDetail(character.senseMasterId, character.bloomBonusGroupMasterId),
      bloomBonuses: await this.characterBloomService.getBloomBonusDetails(character.bloomBonusGroupMasterId),
      displayStartAt: siriusTimestampToDate(character.displayStartAt),
      event: event.title,
      gacha: gacha.name,
      type: getCharacterPosterType(character.unlockText),
      episodes: await this.characterEpisodeService.getCharacterEpisodeDetails(character.id),
      leaderSense: await this.leaderSenseService.getLeaderSenseDetail(character.leaderSenseMasterId),
      categoriesDefault,
      categoriesAwaken
    }
  }

  /**
   * 获得所有角色的数据
   */
  public async getAllCharacterDetails (): Promise<CharacterDetail[]> {
    const characters = await this.getCharacters()
    return await Promise.all(characters.map(async it => await this.getCharacterDetail(it.id)))
  }
}

interface CharacterDetail {
  id: number
  name: string
  rarity: string
  attribute: string
  status: CharacterStatusDetail[]
  characterBase: string
  characterBaseChinese: string
  starAct: StarActDetail
  sense: SenseDetail
  bloomBonuses: BloomBonusDetail[]
  displayStartAt: Date
  event: string
  gacha: string
  type: CharacterOrPosterType
  episodes: CharacterEpisodeDetail[]
  leaderSense: LeaderSenseDetail
  categoriesDefault: string[]
  categoriesAwaken: string[]
}
