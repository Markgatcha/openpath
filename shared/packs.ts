import { STEM_MATH_PACKS } from './packs/stem-math'
import { STEM_SCIENCE_PACKS } from './packs/stem-science'
import { TIER1_STEM_PACKS } from './packs/tier1-math-science'
import { TECH_BUSINESS_PACKS } from './packs/tech-business'
import { HUMANITIES_PACKS } from './packs/humanities'
import { TIER1_APPLIED_PACKS } from './packs/tier1-tech-humanities'
import { PHYSICS_FOUNDATIONS_PACK } from './packs/physics-foundations'
import type { ContentPack, PackQuiz, SubjectGroup } from './packs/types'

export type { ContentPack, PackQuiz, SubjectGroup }

export const SUBJECT_GROUPS: readonly SubjectGroup[] = [
  'Math',
  'Science',
  'CS',
  'Economics',
  'History',
  'Languages',
] as const

/**
 * Curriculum-aligned multi-tier Content Packs (Easy, Medium, Hard quizzes
 * mixing mcq, truefalse, fill, order, and parametric figure questions)
 * plus structured Lesson Tracks.
 */
export const CONTENT_PACKS: ContentPack[] = [
  ...STEM_MATH_PACKS,
  ...STEM_SCIENCE_PACKS,
  ...TIER1_STEM_PACKS,
  ...TECH_BUSINESS_PACKS,
  ...HUMANITIES_PACKS,
  ...TIER1_APPLIED_PACKS,
  PHYSICS_FOUNDATIONS_PACK,
]

export function findPack(id: string): ContentPack | undefined {
  return CONTENT_PACKS.find((pack) => pack.id === id)
}

export function packsByCategory(category: SubjectGroup | 'All'): ContentPack[] {
  if (category === 'All') return CONTENT_PACKS
  return CONTENT_PACKS.filter((pack) => pack.category === category)
}

export function packsForModel(modelId: string): ContentPack[] {
  return CONTENT_PACKS.filter(
    (pack) => pack.modelId === modelId || pack.relatedModelIds?.includes(modelId),
  )
}
