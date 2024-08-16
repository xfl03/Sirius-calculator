import type { DataProvider } from '../data-provider/data-provider'
import { DataProviderFactory } from '../data-provider/data-provider-factory'
import { type Category } from '../master/category'

export class CategoryService {
  public constructor (private readonly dataProvider: DataProvider = DataProviderFactory.defaultDataProvider()) {
  }

  private async getCategory (id: number): Promise<Category> {
    return await this.dataProvider.getMasterDataById<Category>('category', id)
  }

  /**
   * 批量获取分类名
   */
  public async batchGetCategoryName (ids: number[]): Promise<string[]> {
    return await Promise.all(ids.map(async it => (await this.getCategory(it)).name))
  }
}
