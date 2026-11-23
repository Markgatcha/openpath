import type { Difficulty, QuestionInput } from '../schemas'
import type {
  CurriculumTrack,
  GradeBand,
  OerLicenseCode,
  PackLesson,
  TrackSubjectGroup,
  TrackUnit,
} from '../lessons'

export type SubjectGroup = TrackSubjectGroup

export interface PackQuiz {
  title: string
  description: string
  subject: string
  difficulty: Difficulty
  timeLimitSec: number | null
  /** Optional Model Lab preset ID directly reinforced by this quiz. */
  modelId?: string
  /** Whether FSRS flashcards for this quiz interleave (false for vocab lists). */
  srsInterleave?: boolean
  /** Optional paired interactive lesson ID within this pack. */
  lessonId?: string
  questions: QuestionInput[]
}

export interface ContentPack {
  id: string
  name: string
  description: string
  subject: string
  /** High-level arcade/hub filter bucket. */
  category: SubjectGroup
  icon: string
  /** Optional Model Lab preset ID linked to this pack (`/student/lab/:modelId`). */
  modelId?: string
  /** Additional companion Model Lab presets. */
  relatedModelIds?: string[]
  standards: string
  /** License governing the pack's lessons and assessments (default 'MIT'). */
  license?: OerLicenseCode
  /** Clean provenance/attribution string for OER or MIT-original content. */
  sourceAttribution?: string
  /** Default FSRS interleaving policy for this pack (false keeps vocab blocked). */
  srsInterleave?: boolean
  gradeBand?: GradeBand
  prerequisitePackIds?: string[]
  /** Optional full curriculum track, unit list, or starter lessons attached to this pack. */
  track?: CurriculumTrack
  units?: TrackUnit[]
  lessons?: PackLesson[]
  quizzes: PackQuiz[]
}
