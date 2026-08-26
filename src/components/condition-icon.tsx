import {
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
  'rain-showers-slight': CloudSunRain,
  'rain-showers-moderate': CloudRain,
  'rain-showers-violent': CloudRainWind,
  'snow-showers-slight': CloudSnow,
  'snow-showers-heavy': Snowflake,
  thunderstorm: CloudLightning,
  'thunderstorm-hail-slight': CloudLightning,
  'thunderstorm-hail-heavy': CloudLightning,
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
