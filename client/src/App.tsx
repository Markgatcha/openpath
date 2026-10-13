import { useEffect } from 'react'
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
import { TeacherDashboard } from '@/pages/teacher/Dashboard'
import { QuizList } from '@/pages/teacher/QuizList'
import { QuizBuilder } from '@/pages/teacher/QuizBuilder'
import { Classrooms } from '@/pages/teacher/Classrooms'
import { Analytics } from '@/pages/teacher/Analytics'
import { ParentDashboard } from '@/pages/parent/Dashboard'
import { ChildDetail } from '@/pages/parent/ChildDetail'
import { Settings } from '@/pages/Settings'

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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/home" element={<RedirectHome />} />

          <Route element={<RequireAuth role="student" />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/quizzes" element={<QuizBrowser />} />
            <Route path="/student/play/:quizId" element={<QuizPlayer />} />
            <Route path="/student/results/:attemptId" element={<Results />} />
            <Route path="/student/badges" element={<Badges />} />
            <Route path="/student/leaderboard" element={<Leaderboard />} />
            <Route path="/student/flashcards" element={<Flashcards />} />
          </Route>

          <Route element={<RequireAuth role="teacher" />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/quizzes" element={<QuizList />} />
            <Route path="/teacher/quizzes/:quizId" element={<QuizBuilder />} />
            <Route
              path="/teacher/quizzes/:quizId/analytics"
              element={<Analytics />}
            />
            <Route path="/teacher/classrooms" element={<Classrooms />} />
          </Route>

          <Route element={<RequireAuth role="parent" />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/child/:studentId" element={<ChildDetail />} />
          </Route>

          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
