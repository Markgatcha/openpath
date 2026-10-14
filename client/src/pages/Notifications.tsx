import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, ClipboardCheck, Inbox } from 'lucide-react'
import { api } from '@/lib/api'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { NotificationDTO } from '@shared/types'

function timeAgo(createdAt: string): string {
  // SQLite datetime('now') is UTC "YYYY-MM-DD HH:MM:SS".
  const date = new Date(`${createdAt.replace(' ', 'T')}Z`)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

function iconFor(type: string) {
  if (type === 'work_completed') return <ClipboardCheck size={16} />
  return <Bell size={16} />
}

export function Notifications() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
  }

  const readOne = useMutation({
    mutationFn: (id: string) => api.notifications.read(id),
    onSuccess: invalidate,
  })
  const readAll = useMutation({
    mutationFn: api.notifications.readAll,
    onSuccess: invalidate,
  })

  const notifications = data?.notifications ?? []
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Homework and classwork completions, right here on your machine.
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="ghost"
            loading={readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            <CheckCheck size={15} /> Mark all read
          </Button>
        )}
      </div>

      <Card className="divide-y divide-slate-100 p-0 dark:divide-white/5">
        {isLoading ? (
          <div className="grid place-items-center p-10">
            <Bell className="h-6 w-6 animate-pulse text-slate-300" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox size={28} className="text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              Nothing yet
            </p>
            <p className="max-w-xs text-sm text-slate-400">
              When a linked student finishes their homework or classwork, it
              lands here. Keep this tab open and the bell badge updates itself.
            </p>
          </div>
        ) : (
          notifications.map((notification: NotificationDTO) => (
            <button
              key={notification.id}
              onClick={() => {
                if (!notification.read) readOne.mutate(notification.id)
              }}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5',
                !notification.read && 'bg-brand-500/5',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl',
                  notification.read
                    ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                    : 'bg-brand-500/10 text-brand-500',
                )}
              >
                {iconFor(notification.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm text-slate-800 dark:text-slate-100',
                    !notification.read && 'font-bold',
                  )}
                >
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {notification.body}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {timeAgo(notification.createdAt)}
                </p>
              </div>
              {!notification.read && (
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
              )}
            </button>
          ))
        )}
      </Card>
    </div>
  )
}
