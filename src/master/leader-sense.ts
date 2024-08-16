export interface LeaderSense {
  id: number
  description: string
  details: Array<{
    effectMasterId: number
    conditions: Array<{
      categoryMasterId1: number
      categoryMasterId2?: number
      categoryMasterId3?: number
      categoryMasterId4?: number
      categoryMasterId5?: number
    }>
  }>
}
