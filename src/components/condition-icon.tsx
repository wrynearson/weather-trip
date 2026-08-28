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
import type { Condition } from '@/condition'
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
    <span title={title}>
      <Icon className={cn('size-4 text-muted-foreground', className)} />
    </span>
  )
}
