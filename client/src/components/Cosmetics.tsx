import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { fontStack, paintToCss, paintToTextStyle } from '@shared/economy'
import type { Nameplate, Paint } from '@shared/economy'

/**
 * A student's name, painted with their purchased colour/gradient and font.
 * Falls back to plain text when nothing is equipped.
 */
export function StyledName({
  name,
  paint,
  font,
  className,
}: {
  name: string
  paint: Paint | null
  font?: string | null
  className?: string
}) {
  const style = { ...paintToTextStyle(paint), fontFamily: fontStack(font) }
  return (
    <span className={className} style={Object.keys(style).length > 0 ? style : undefined}>
      {name}
    </span>
  )
}

/** Leaderboard nameplate: solid, gradient, or an uploaded image. */
export function NameplateBadge({
  nameplate,
  children,
  className,
}: {
  nameplate: Nameplate | null
  children: ReactNode
  className?: string
}) {
  if (!nameplate) return <>{children}</>

  if (nameplate.type === 'image') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-lg border border-white/20 px-2 py-0.5',
          className,
        )}
        style={{
          backgroundImage: `url(${nameplate.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {children}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        className,
      )}
      style={{
        backgroundImage: paintToCss(nameplate),
        backgroundColor: nameplate.type === 'solid' ? nameplate.color : undefined,
      }}
    >
      {children}
    </span>
  )
}
