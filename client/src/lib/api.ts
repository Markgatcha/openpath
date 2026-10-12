import type {
  AiGenerateInput,
  AiSettingsInput,
  AttemptAnswerInput,
  ClassroomCreateInput,
  JoinClassroomInput,
  LinkChildInput,
  LoginInput,
  ProfileUpdateInput,
  QuestionInput,
  QuizCreateInput,
  QuizUpdateInput,
  RegisterInput,
  StartAttemptInput,
} from '@shared/schemas'
import type {
  AiQuestionDraft,
  AiStatusDTO,
  AttemptFinishDTO,
  AttemptSummaryDTO,
  BadgeDTO,
  ChildDetailDTO,
  ClassroomDTO,
  LeaderboardEntryDTO,
  QuizAnalyticsDTO,
  QuizDTO,
  StudentDashboardDTO,
  StudentQuestionDTO,
  StudentSummaryDTO,
  TeacherQuestionDTO,
  UserDTO,
} from '@shared/types'
import { useAuth } from '../store/auth'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  const token = useAuth.getState().token
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`/api${path}`, { ...options, headers })
  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data as { error?: string }).error ?? 'Request failed',
      (data as { details?: unknown }).details,
    )
  }
  return data as T
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
}

function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) })
}

function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) })
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────
  register: (input: RegisterInput) =>
    post<{ token: string; user: UserDTO }>('/auth/register', input),
  login: (input: LoginInput) =>
    post<{ token: string; user: UserDTO }>('/auth/login', input),
  me: () => request<{ user: UserDTO }>('/auth/me'),
  updateProfile: (input: ProfileUpdateInput) =>
    patch<{ user: UserDTO }>('/auth/me', input),

  // ── Quizzes ─────────────────────────────────────────────────
  quizzes: {
    list: () => request<{ quizzes: QuizDTO[] }>('/quizzes'),
    get: (id: string) =>
      request<{
        quiz: QuizDTO
        questions: TeacherQuestionDTO[] | StudentQuestionDTO[]
      }>(`/quizzes/${id}`),
    create: (input: QuizCreateInput) =>
      post<{ quiz: QuizDTO }>('/quizzes', input),
    update: (id: string, input: QuizUpdateInput) =>
      patch<{ quiz: QuizDTO }>(`/quizzes/${id}`, input),
    remove: (id: string) => del<void>(`/quizzes/${id}`),
    publish: (id: string) => post<{ quiz: QuizDTO }>(`/quizzes/${id}/publish`),
    unpublish: (id: string) =>
      post<{ quiz: QuizDTO }>(`/quizzes/${id}/unpublish`),
    duplicate: (id: string) =>
      post<{ quiz: QuizDTO }>(`/quizzes/${id}/duplicate`),
    addQuestion: (id: string, input: QuestionInput) =>
      post<{ question: TeacherQuestionDTO }>(`/quizzes/${id}/questions`, input),
    updateQuestion: (id: string, qid: string, input: QuestionInput) =>
      patch<{ question: TeacherQuestionDTO }>(
        `/quizzes/${id}/questions/${qid}`,
        input,
      ),
    removeQuestion: (id: string, qid: string) =>
      del<void>(`/quizzes/${id}/questions/${qid}`),
    reorder: (id: string, questionIds: string[]) =>
      post<{ questions: TeacherQuestionDTO[] }>(`/quizzes/${id}/reorder`, {
        questionIds,
      }),
    analytics: (id: string) =>
      request<QuizAnalyticsDTO>(`/quizzes/${id}/analytics`),
  },

  // ── Classrooms ──────────────────────────────────────────────
  classrooms: {
    list: () => request<{ classrooms: ClassroomDTO[] }>('/classrooms/mine'),
    create: (input: ClassroomCreateInput) =>
      post<{ classroom: ClassroomDTO }>('/classrooms', input),
    join: (input: JoinClassroomInput) =>
      post<{ classroom: ClassroomDTO }>('/classrooms/join', input),
    get: (id: string) =>
      request<{
        classroom: ClassroomDTO
        members: {
          id: string
          name: string
          avatarColor: string
          xp: number
          streakDays: number
        }[]
      }>(`/classrooms/${id}`),
    remove: (id: string) => del<void>(`/classrooms/${id}`),
  },

  // ── Attempts ────────────────────────────────────────────────
  attempts: {
    start: (input: StartAttemptInput) =>
      post<{
        attemptId: string
        quiz: QuizDTO
        questions: StudentQuestionDTO[]
        resumed: boolean
      }>('/attempts', input),
    answer: (attemptId: string, input: AttemptAnswerInput) =>
      post<{
        alreadyAnswered: boolean
        correct: boolean
        correctAnswer?: unknown
        explanation?: string
        points?: number
        combo?: number
      }>(`/attempts/${attemptId}/answer`, input),
    finish: (attemptId: string) =>
      post<AttemptFinishDTO>(`/attempts/${attemptId}/finish`),
    mine: () => request<{ attempts: AttemptSummaryDTO[] }>('/attempts/mine'),
    get: (id: string) =>
      request<{
        attempt: AttemptSummaryDTO
        breakdown: {
          questionId: string
          correct: boolean
          correctAnswer: unknown
          explanation: string
          points: number
          earnedPoints: number
          combo: number
        }[]
        answers: {
          questionId: string
          response: unknown
          correct: boolean
          msTaken: number
        }[]
      }>(`/attempts/${id}`),
  },

  // ── Community ────────────────────────────────────────────────
  community: {
    badges: () => request<{ badges: BadgeDTO[] }>('/community/badges'),
    leaderboard: (params?: {
      scope?: 'global' | 'classroom'
      window?: 'all' | 'week'
      classroomId?: string
    }) => {
      const search = new URLSearchParams()
      if (params?.scope) search.set('scope', params.scope)
      if (params?.window) search.set('window', params.window)
      if (params?.classroomId) search.set('classroomId', params.classroomId)
      const qs = search.toString()
      return request<{ entries: LeaderboardEntryDTO[]; myRank: number | null }>(
        `/community/leaderboard${qs ? `?${qs}` : ''}`,
      )
    },
    linkChild: (input: LinkChildInput) =>
      post<{ child: StudentSummaryDTO }>('/community/parent/link', input),
    children: () =>
      request<{ children: StudentSummaryDTO[] }>('/community/parent/children'),
  },

  // ── Stats ───────────────────────────────────────────────────
  stats: {
    studentDashboard: () =>
      request<StudentDashboardDTO>('/stats/student/dashboard'),
    parentChild: (studentId: string) =>
      request<ChildDetailDTO>(`/stats/parent/child/${studentId}`),
  },

  // ── AI ──────────────────────────────────────────────────────
  ai: {
    status: () => request<{ status: AiStatusDTO }>('/ai/status'),
    settings: (input: AiSettingsInput) =>
      put<{ status: AiStatusDTO }>('/ai/settings', input),
    generate: (input: AiGenerateInput) =>
      post<{ questions: AiQuestionDraft[]; provider: string; model: string }>(
        '/ai/generate',
        input,
      ),
  },
}
