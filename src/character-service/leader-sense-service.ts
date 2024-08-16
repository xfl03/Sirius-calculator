import type { DataProvider } from '../data-provider/data-provider'
import { DataProviderFactory } from '../data-provider/data-provider-factory'
import { type LeaderSense } from '../master/leader-sense'

export class LeaderSenseService {
  public constructor (private readonly dataProvider: DataProvider = DataProviderFactory.defaultDataProvider()) {
  }

  private async getLeaderSense (id: number): Promise<LeaderSense> {
    return await this.dataProvider.getMasterDataById<LeaderSense>('leaderSense', id)
  }

  /**
   * 获得Leader Sense详情
   */
  public async getLeaderSenseDetail (leaderSenseId: number): Promise<LeaderSenseDetail> {
    const leaderSense = await this.getLeaderSense(leaderSenseId)
    return {
      descriptions: leaderSense.description.split('、')
    }
  }
}

export interface LeaderSenseDetail {
  descriptions: string[]
}
