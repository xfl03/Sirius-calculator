export interface Character {
  id: number
  characterBaseMasterId: number
  name: string
  description: string
  rarity: string
  attribute: string
  minLevelStatus: {
    vocal: number
    expression: number
    concentration: number
  }
  starActMasterId: number
  awakenStarActMasterId?: number
  senseMasterId: number
  forbidGenericItemBloom: boolean
  bloomBonusGroupMasterId: number
  senseEnhanceItemGroupMasterId: number
  firstEpisodeReleaseItemGroupId: number
  secondEpisodeReleaseItemGroupId: number
  characterAwakeningItemGroupMasterId?: number
  displayStartAt: number
  displayEndAt: number
  unlockText: string
  categories: Array<{
    categoryMasterId: number
    isAwaken: boolean
  }>
  leaderSenseMasterId: number
  maxTalentStage: number
  maxTalentStageReleaseDate?: number
}
