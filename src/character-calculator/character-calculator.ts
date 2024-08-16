import type { DataProvider } from '../data-provider/data-provider'
import { DataProviderFactory } from '../data-provider/data-provider-factory'
import { type CharacterLevel } from '../master/character-level'
import { findOrThrow } from '../util/collection-util'
import { type Character } from '../master/character'
import { CharacterBloomService } from '../character-service/character-bloom-service'
import { siriusTimestampToDate } from '../util/time-util'
import { CharacterEpisodeService, CharacterEpisodeStatus } from '../character-service/character-episode-service'

export class CharacterCalculator {
  private readonly characterBloomService: CharacterBloomService
  private readonly characterEpisodeService: CharacterEpisodeService
  public constructor (private readonly dataProvider: DataProvider = DataProviderFactory.defaultDataProvider()) {
    this.characterBloomService = new CharacterBloomService(dataProvider)
    this.characterEpisodeService = new CharacterEpisodeService(dataProvider)
  }

  private async getCharacterLevel (level: number): Promise<CharacterLevel> {
    const levels = await this.dataProvider.getMasterData<CharacterLevel>('characterLevel')
    return findOrThrow(levels, it => it.level === level)
  }

  private async getMaxCharacterLevel (): Promise<number> {
    const levels = await this.dataProvider.getMasterData<CharacterLevel>('characterLevel')
    return levels.filter(it => siriusTimestampToDate(it.startDate).getTime() <= Date.now())
      .reduce((max, it) => Math.max(max, it.level), 0)
  }

  private static getEpisodeBonus (episode: CharacterEpisodeStatus): number {
    switch (episode) {
      case CharacterEpisodeStatus.NONE:
        return 0
      case CharacterEpisodeStatus.FIRST:
        return 2
      case CharacterEpisodeStatus.SECOND:
        return 5
    }
  }

  private static getStatus (
    baseValue: number, storyReadBonus: number, characterLevelFactor: number, awakeningPhase: number = 0,
    baseCorrectionEffectPercent: number = 0, starRankPercent: number = 0
  ): number {
    const status = characterLevelFactor /
        100.0 *
        (storyReadBonus + baseValue) *
        ((baseCorrectionEffectPercent / 100.0 + Math.fround(Math.fround(awakeningPhase) * 10.0) +
                100.0 + starRankPercent) / 100.0)
    return Math.floor(status)
  }

  /**
   * 获得角色三维
   * @param character
   * @param level
   * @param awakening
   * @param episode
   * @param bloom
   */
  public async getCharacterStatus (
    character: Character,
    { level = 1, awakening = false, episode = CharacterEpisodeStatus.NONE, bloom = 0 }: CharacterStatusPreset
  ): Promise<CharacterStatusDetail> {
    const storyReadBonus = CharacterCalculator.getEpisodeBonus(episode)
    const characterLevelFactor = (await this.getCharacterLevel(level)).characterStatusLevel
    const awakenPhase = awakening ? 1 : 0
    const baseCorrectionEffectPercent = await this.characterBloomService
      .getBloomBonusTotal(character.bloomBonusGroupMasterId, 'BaseCorrection', bloom)
    return {
      preset: {
        level,
        awakening,
        episode,
        bloom
      },
      status: {
        vocal: CharacterCalculator.getStatus(character.minLevelStatus.vocal, storyReadBonus, characterLevelFactor,
          awakenPhase, baseCorrectionEffectPercent),
        expression: CharacterCalculator.getStatus(character.minLevelStatus.expression, storyReadBonus,
          characterLevelFactor, awakenPhase, baseCorrectionEffectPercent),
        concentration: CharacterCalculator
          .getStatus(character.minLevelStatus.concentration, storyReadBonus, characterLevelFactor,
            awakenPhase, baseCorrectionEffectPercent)
      }
    }
  }

  /**
   * 获得1级初始状态的三维
   * @param character
   */
  public async getMinCharacterStatus (character: Character): Promise<CharacterStatusDetail> {
    return await this.getCharacterStatus(character, {})
  }

  /**
   * 获得满级、满开花、前后剧情、觉醒的三维
   * @param character
   */
  public async getMaxCharacterStatus (character: Character): Promise<CharacterStatusDetail> {
    return await this.getCharacterStatus(character, {
      level: await this.getMaxCharacterLevel(),
      awakening: character.characterAwakeningItemGroupMasterId !== undefined,
      episode: await this.characterEpisodeService.getCharacterMaxEpisodeStatus(character.id),
      bloom: character.maxTalentStage
    })
  }
}

export interface CharacterStatusPreset {
  level?: number
  awakening?: boolean
  episode?: CharacterEpisodeStatus
  bloom?: number
}

export interface CharacterStatusDetail {
  preset: CharacterStatusPreset
  status: {
    vocal: number
    expression: number
    concentration: number
  }
}
