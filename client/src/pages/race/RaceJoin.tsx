import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card, Field, Input, useToast } from '@/components/ui'

/**
 * Race entry for students: a 6-character code, nothing else.
 *
 * The code is validated with a REST lookup before navigating — a
 * typed-in code usually fails for a boring reason (typo, finished
 * race, quiz not shared), and saying so here beats an error frame
 * from a socket that opens and instantly closes.
 */
export function RaceJoin() {
  const navigate = useNavigate()
  const toast = useToast()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  const join = async () => {
    const clean = code.trim().toUpperCase()
    if (clean.length < 4) {
      toast('Enter the race code your teacher shows', 'error')
      return
    }
    setChecking(true)
    try {
      await api.races.get(clean)
      void navigate(`/race/${clean}/play`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No race with that code', 'error')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-2xl shadow-lg shadow-brand-600/30">
          <Radio size={26} className="text-white" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Join a live race
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Your teacher picks the mode — Classic Sprint, Asymmetric Squad Sync,
          or Classroom Siege. No coins, no XP: just live teamwork and fast recall.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <Field
          label="Race code"
          hint="6 characters, shown on your teacher's screen"
        >
          <Input
            value={code}
            onChange={(event) =>
              setCode(event.target.value.toUpperCase().slice(0, 6))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') void join()
            }}
            placeholder="e.g. K7QM2X"
            autoFocus
            className="text-center font-display text-2xl font-extrabold tracking-[0.3em]"
          />
        </Field>
        <Button loading={checking} onClick={join} className="w-full">
          Join race
        </Button>
      </Card>
    </div>
  )
}
