import {
  CircleHelp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Snowflake,
  Sun,
  SunSnow,
} from 'lucide-react'
import { CONDITION_LABEL, rankConditions, type Condition } from '@/condition'
import type { DayStats } from '@/types'
import { cn } from '@/lib/utils'

export const CONDITION_ICON: Record<Condition, typeof Sun> = {
  'clear-sky': Sun,
  'mainly-clear': Sun,
  'partly-cloudy': CloudSun,
  overcast: Cloud,
  fog: CloudFog,
  'rime-fog': CloudFog,
  'drizzle-light': CloudDrizzle,
  'drizzle-moderate': CloudDrizzle,
  'drizzle-dense': CloudDrizzle,
  'freezing-drizzle-light': CloudHail,
  'freezing-drizzle-dense': CloudHail,
  'rain-slight': CloudRain,
  'rain-moderate': CloudRain,
  'rain-heavy': CloudRainWind,
  'freezing-rain-light': CloudHail,
  'freezing-rain-heavy': CloudHail,
  'snow-slight': CloudSnow,
  'snow-moderate': CloudSnow,
  'snow-heavy': Snowflake,
  'snow-grains': Snowflake,
  // Showers get their own icon at every intensity (never reusing the
  // continuous-precipitation icons above) so a rain <-> rain-showers or
  // snow <-> snow-showers transition is still visible at a glance — see
  // condition.ts's CONDITION_FAMILY comment on why these are distinct
  // phenomena, not just intensity tiers of "rain"/"snow".
  'rain-showers-slight': CloudSunRain,
  'rain-showers-moderate': CloudSunRain,
  'rain-showers-violent': CloudSunRain,
  'snow-showers-slight': SunSnow,
  'snow-showers-heavy': SunSnow,
  thunderstorm: CloudLightning,
  'thunderstorm-hail-slight': CloudLightning,
  'thunderstorm-hail-heavy': CloudLightning,
  unknown: CircleHelp,
}

export function ConditionIcon({
  condition,
  className,
  title,
}: {
  condition: Condition
  className?: string
  title?: string
}) {
  const Icon = CONDITION_ICON[condition]
  return (
    <span title={title} aria-label={title} aria-hidden={title ? undefined : true}>
      <Icon className={cn('size-4 text-muted-foreground', className)} />
    </span>
  )
}

/**
 * Top weather icons for a set of days, ranked separately for actual (past)
 * nights and the rest so what happened isn't blended with what's predicted.
 * Actual icons are teal; a divider separates the groups. Mixed sets get 2
 * icons per group, single-source sets get the usual 3.
 */
export function ConditionIconGroups({ days }: { days: DayStats[] }) {
  const past = days.filter((d) => d.source === 'observed')
  const other = days.filter((d) => d.source !== 'observed')
  const limit = past.length > 0 && other.length > 0 ? 2 : 3
  const pastConditions = rankConditions(past, limit)
  const otherConditions = rankConditions(other, limit)

  return (
    <span className="flex items-center gap-1">
      {pastConditions.map(({ condition, frequency }) => (
        <ConditionIcon
          key={`actual-${condition}`}
          condition={condition}
          className="text-primary"
          title={`Actual: ${CONDITION_LABEL[condition]} · ${Math.round(frequency * 100)}% of past nights`}
        />
      ))}
      {pastConditions.length > 0 && otherConditions.length > 0 && <span className="mx-0.5 h-3.5 w-px bg-border" />}
      {otherConditions.map(({ condition, frequency }) => (
        <ConditionIcon
          key={condition}
          condition={condition}
          title={`${CONDITION_LABEL[condition]} · ${Math.round(frequency * 100)}%`}
        />
      ))}
    </span>
  )
}
