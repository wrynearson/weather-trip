import { Cloud, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react'
import type { Condition } from '@/condition'
import { cn } from '@/lib/utils'

const ICON: Record<Condition, typeof Sun> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
}

const COLOR: Record<Condition, string> = {
  sunny: 'text-amber-500',
  partly: 'text-amber-500',
  cloudy: 'text-muted-foreground',
  rainy: 'text-sky-600',
  snowy: 'text-sky-500',
}

export function ConditionIcon({
  condition,
  className,
}: {
  condition: Condition
  className?: string
}) {
  const Icon = ICON[condition]
  return <Icon className={cn('size-4', COLOR[condition], className)} />
}
