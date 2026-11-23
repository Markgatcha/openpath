import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import type { Role } from '@shared/schemas'
import { AppLayout } from '@/components/Layout'
import { Spinner } from '@/components/ui'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { NotFound } from '@/pages/NotFound'
import { StudentDashboard } from '@/pages/student/Dashboard'
import { QuizBrowser } from '@/pages/student/QuizBrowser'
import { QuizPlayer } from '@/pages/student/QuizPlayer'
import { Results } from '@/pages/student/Results'
import { Badges } from '@/pages/student/Badges'
import { Leaderboard } from '@/pages/student/Leaderboard'
import { Flashcards } from '@/pages/student/Flashcards'
import { Shop } from '@/pages/student/Shop'
import { ModelLab } from '@/pages/student/ModelLab'
import { ArcadeHub } from '@/pages/student/arcade/ArcadeHub'
import { StreakSiegeGame } from '@/pages/student/arcade/StreakSiegeGame'
import { SpeedMatchGame } from '@/pages/student/arcade/SpeedMatchGame'
import { StepDetectiveGame } from '@/pages/student/arcade/StepDetectiveGame'
import { SimulationSandboxGame } from '@/pages/student/arcade/SimulationSandboxGame'
import { SequenceArchitectGame } from '@/pages/student/arcade/SequenceArchitectGame'
import { BossRaidGame } from '@/pages/student/arcade/BossRaidGame'
import { RaceJoin } from '@/pages/race/RaceJoin'
import { RacePlay } from '@/pages/race/RacePlay'
import { RaceHost } from '@/pages/race/RaceHost'
import { TeacherDashboard } from '@/pages/teacher/Dashboard'
import { QuizList } from '@/pages/teacher/QuizList'
import { QuizBuilder } from '@/pages/teacher/QuizBuilder'
import { Classrooms } from '@/pages/teacher/Classrooms'
import { Assignments } from '@/pages/teacher/Assignments'
import { ContentPacks } from '@/pages/teacher/ContentPacks'
import { Economy } from '@/pages/teacher/Economy'
import { Analytics } from '@/pages/teacher/Analytics'
import { ParentDashboard } from '@/pages/parent/Dashboard'
import { ChildDetail } from '@/pages/parent/ChildDetail'
import { AttemptReview } from '@/pages/AttemptReview'
import { Notifications } from '@/pages/Notifications'
import { Settings } from '@/pages/Settings'

const CertaintyVaultGame = lazy(() => import('@/pages/student/arcade/CertaintyVaultGame'))
const DiagramScoutGame = lazy(() => import('@/pages/student/arcade/DiagramScoutGame'))
const ClozeWorkbenchGame = lazy(() => import('@/pages/student/arcade/ClozeWorkbenchGame'))
const KnowledgeBastionGame = lazy(() => import('@/pages/student/arcade/KnowledgeBastionGame'))
const OrbitPilotGame = lazy(() => import('@/pages/student/arcade/OrbitPilotGame'))
const Lessons = lazy(() => import('@/pages/student/Lessons'))
const LessonPlayer = lazy(() => import('@/pages/student/LessonPlayer'))

/** Loads the current user once on boot if we have a stored token. */
function AuthBootstrap() {
  const { token, user, setUser, logout } = useAuth()

  useEffect(() => {
    if (!token || user) return
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => logout())
  }, [token, user, setUser, logout])

  return null
}

function RequireAuth({ role }: { role?: Role }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (role && user.role !== role) {
    const home =
      user.role === 'student'
        ? '/student'
        : user.role === 'teacher'
          ? '/teacher'
          : '/parent'
    return <Navigate to={home} replace />
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

function RedirectHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const home =
    user.role === 'student'
      ? '/student'
      : user.role === 'teacher'
        ? '/teacher'
        : '/parent'
  return <Navigate to={home} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <Toaster position="top-center" richColors />
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/home" element={<RedirectHome />} />

          <Route element={<RequireAuth role="student" />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/lessons" element={<Lessons />} />
            <Route path="/student/lessons/:lessonId" element={<LessonPlayer />} />
            <Route path="/student/quizzes" element={<QuizBrowser />} />
            <Route path="/student/play/:quizId" element={<QuizPlayer />} />
            <Route path="/student/results/:attemptId" element={<Results />} />
            <Route path="/student/badges" element={<Badges />} />
            <Route path="/student/leaderboard" element={<Leaderboard />} />
            <Route path="/student/flashcards" element={<Flashcards />} />
            <Route path="/student/arcade" element={<ArcadeHub />} />
            <Route path="/student/arcade/siege" element={<StreakSiegeGame />} />
            <Route path="/student/arcade/match" element={<SpeedMatchGame />} />
            <Route path="/student/arcade/detective" element={<StepDetectiveGame />} />
            <Route path="/student/arcade/sandbox" element={<SimulationSandboxGame />} />
            <Route path="/student/arcade/sequence" element={<SequenceArchitectGame />} />
            <Route path="/student/arcade/boss" element={<BossRaidGame />} />
            <Route path="/student/arcade/vault" element={<CertaintyVaultGame />} />
            <Route path="/student/arcade/scout" element={<DiagramScoutGame />} />
            <Route path="/student/arcade/cloze" element={<ClozeWorkbenchGame />} />
            <Route path="/student/arcade/bastion" element={<KnowledgeBastionGame />} />
            <Route path="/student/arcade/orbit-pilot" element={<OrbitPilotGame />} />
            <Route path="/student/lab" element={<ModelLab />} />
            <Route path="/student/lab/:modelId" element={<ModelLab />} />
            <Route path="/student/shop" element={<Shop />} />
            {/* Live race mode: students join with a room code and play
                together; the API verifies quiz access either way. */}
            <Route path="/race/join" element={<RaceJoin />} />
            <Route path="/race/:code/play" element={<RacePlay />} />
          </Route>

          <Route element={<RequireAuth role="teacher" />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/quizzes" element={<QuizList />} />
            <Route path="/teacher/quizzes/:quizId" element={<QuizBuilder />} />
            <Route
              path="/teacher/quizzes/:quizId/analytics"
              element={<Analytics />}
            />
            {/* Host console for a live race (created from the quiz list). */}
            <Route path="/race/:code/host" element={<RaceHost />} />
            <Route path="/teacher/classrooms" element={<Classrooms />} />
            <Route path="/teacher/assignments" element={<Assignments />} />
            <Route path="/teacher/packs" element={<ContentPacks />} />
            <Route path="/teacher/economy" element={<Economy />} />
          </Route>

          <Route element={<RequireAuth role="parent" />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/child/:studentId" element={<ChildDetail />} />
          </Route>

          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* Attempt review: students revisit their runs, teachers review
              a student's work — the API itself enforces who may look. */}
          <Route path="/attempts/:attemptId/review" element={<AttemptReview />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
