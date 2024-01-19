import type { DataProvider } from '../data-provider/data-provider'
import { DataProviderFactory } from '../data-provider/data-provider-factory'
import { EffectService } from '../effect-service/effect-service'
import { type Sense } from '../master/sense'
import { CharacterBloomService } from './character-bloom-service'
import { toRangeString } from '../util/number-util'

export class SenseService {
  private readonly effectService: EffectService
  private readonly characterBloomService: CharacterBloomService

  public constructor (private readonly dataProvider: DataProvider = DataProviderFactory.defaultDataProvider()) {
    this.effectService = new EffectService(dataProvider)
    this.characterBloomService = new CharacterBloomService(dataProvider)
  }

  private async getSense (id: number): Promise<Sense> {
    return await this.dataProvider.getMasterDataById<Sense>('sense', id)
  }

  /**
   * 获得Sense（小技能）详情信息
   * @param id
   * @param bloomBonusGroupId
   */
  public async getSenseDetail (id: number, bloomBonusGroupId: number): Promise<SenseDetail> {
    const sense = await this.getSense(id)
    let description = sense.description

    // [:pre?]
    for (let i = 0; i < sense.preEffects.length; ++i) {
      const effect = sense.preEffects[i]
      description = description.replaceAll(`[:pre${i + 1}]`,
        await this.effectService.getEffectRange(effect.effectMasterId, 1, 5))
    }

    // [:param??] [:sec]
    for (let i = 0; i < sense.branches.length; ++i) {
      const branch = sense.branches[i]
      for (let j = 0; j < branch.branchEffects.length; ++j) {
        const effect = branch.branchEffects[i]
        description = description.replaceAll(`[:param${i + 1}${j + 1}]`,
          await this.effectService.getEffectRange(effect.effectMasterId, 1, 5))
        const durationSecond = await this.effectService.getEffectDurationSecond(effect.effectMasterId)
        if (durationSecond > 0) {
          description = description.replaceAll('[:sec]', durationSecond.toString())
        }
      }
    }

    // [:gauge]
    const gauge = sense.acquirableGauge
    if (gauge > 0) {
      description = description.replaceAll('[:gauge]', gauge.toString())
    }

    // [:score]
    const base = sense.acquirableScorePercent / 100
    const level = sense.scoreUpPerLevel / 100
    if (base > 0 || level > 0) {
      description = description.replaceAll('[:score]', toRangeString(base, base + level * 5))
    }

    return {
      // name: sense.name,
      descriptions: description.split('／'),
      type: sense.type,
      lightCount: sense.lightCount,
      coolTime: {
        origin: sense.coolTime,
        bloom: sense.coolTime - await this.characterBloomService
          .getBloomBonusTotal(bloomBonusGroupId, 'SenseRecastDown')
      }
    }
  }
}

export interface SenseDetail {
  // name: string
  descriptions: string[]
  type: string
  lightCount: number
  coolTime: {
    origin: number
    bloom: number
  }
}