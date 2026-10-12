import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, Layers, RotateCcw, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, EmptyState, ProgressBar, Spinner, useToast } from '@/components/ui'
import { subjectEmoji } from '@/lib/utils'

interface Card_ {
  questionId: string
  front: string
  back: string
  explanation: string
}

function drillCards(
  questions: {
    id: string
    type: string
    prompt: string
    correct: unknown
    explanation: string
  }[],
): Card_[] {
  return questions.map((question) => {
    let back: string
    if (Array.isArray(question.correct)) {
      const order = question.correct as number[]
      back = (question as unknown as { options?: string[] }).options
        ? order.map((index) => (question as unknown as { options: string[] }).options[index]).join(' → ')
        : order.join(' → ')
    } else if (typeof question.correct === 'boolean') {
      back = question.correct ? 'True' : 'False'
    } else {
      back = String(question.correct)
    }
    return {
      questionId: question.id,
      front: question.prompt,
      back,
      explanation: question.explanation,
    }
  })
}

export function Flashcards() {
  const { quizId } = useParams()
  const toast = useToast()
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const [known, setKnown] = useState<string[]>([])
  const [learning, setLearning] = useState<string[]>([])

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: api.quizzes.list,
  })

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => api.quizzes.get(quizId!),
    enabled: Boolean(quizId),
  })

  if (!quizId) {
    // Deck picker
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Flashcard training
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pick a quiz deck and drill the questions until they stick.
          </p>
        </div>
        {loadingQuizzes ? (
          <div className="grid place-items-center py-24">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(quizzes?.quizzes ?? []).map((quiz) => (
              <Link
                key={quiz.id}
                to={`/student/flashcards/${quiz.id}`}
                className="card card-hover flex items-center gap-4 p-5"
              >
                <span className="text-3xl">{subjectEmoji(quiz.subject)}</span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {quiz.questionCount} cards · {quiz.subject}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loadingDetail) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const detailQuiz = detail?.quiz
  // Students don't receive answers; if this is a teacher/admin view we may have
  // full questions. For students we fall back to a friendly notice.
  const questions = (detail?.questions ?? []) as unknown as {
    id: string
    type: string
    prompt: string
    correct: unknown
    explanation: string
  }[]
  const hasAnswers = questions.some((question) => question.correct !== undefined)

  if (!hasAnswers) {
    return (
      <EmptyState
        icon="🃏"
        title="Deck answers are hidden"
        description="Flashcard answers come from the quiz maker’s answer key. Take the quiz first — then the cards unlock for spaced practice."
        action={
          <Link to={`/student/play/${quizId}`} className="btn-primary">
            Play the quiz
          </Link>
        }
      />
    )
  }

  const cards = drillCards(questions)
  const card = cards[index]

  const mark = (isKnown: boolean) => {
    if (!card) return
    if (isKnown) {
      setKnown((current) => [...current, card.questionId])
    } else {
      setLearning((current) => [...current, card.questionId])
    }
    setFlipped(false)
    if (index + 1 < cards.length) {
      setIndex(index + 1)
    } else {
      const knownCount = isKnown ? known.length + 1 : known.length
      toast(
        knownCount === cards.length
          ? 'Perfect drill — every card mastered! 🏆'
          : `Drill complete: ${knownCount}/${cards.length} cards solid.`,
        'success',
      )
      setIndex(cards.length)
    }
  }

  const restart = () => {
    setIndex(0)
    setKnown([])
    setLearning([])
    setFlipped(false)
  }

  if (index >= cards.length) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 pt-10 text-center">
        <span className="text-5xl">🎴</span>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Drill complete
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {known.length} known · {learning.length} to review from{' '}
          <span className="font-semibold">{detailQuiz?.title}</span>
        </p>
        <div className="flex gap-3">
          <Button onClick={restart}>
            <RotateCcw size={16} /> Drill again
          </Button>
          <Link to="/student/flashcards" className="btn-ghost">
            Other decks
          </Link>
        </div>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          to="/student/flashcards"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
        >
          <ChevronLeft size={15} /> Decks
        </Link>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {index + 1} / {cards.length}
        </span>
      </div>

      <ProgressBar value={index / cards.length} className="h-2" />

      <div className="perspective-[1200px]">
        <AnimatePresence mode="wait">
          <motion.button
            key={card.questionId}
            onClick={() => setFlipped((value) => !value)}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="card flex min-h-64 w-full flex-col items-center justify-center gap-4 p-8 text-center"
          >
            <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">
              <Layers size={12} />
              {flipped ? 'answer' : 'prompt'} — tap to flip
            </span>
            <p className="font-display text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
              {flipped ? card.back : card.front}
            </p>
            {flipped && card.explanation && (
              <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                💡 {card.explanation}
              </p>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="danger" onClick={() => mark(false)}>
          <X size={16} /> Still learning
        </Button>
        <Button onClick={() => mark(true)}>
          <Check size={16} /> Got it
        </Button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Cards you mark “Still learning” are worth another pass tomorrow.
      </p>
    </div>
  )
}
