export type Stop = {
  id: string
  city: string
  region: string
  lat: number
  lon: number
  startDate: string // "YYYY-MM-DD"
  nights: number
}

export type DayStats = {
  date: string // "YYYY-MM-DD"
  avgHigh: number
  avgLow: number
  precipMean: number
  wetDayProbability: number
  recordHigh: number
  recordLow: number
  source: 'forecast' | 'historical'
  elevationM: number
}

export type Units = 'C' | 'F'
