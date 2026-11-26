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
  weatherCode: number
  recordHigh: number
  recordLow: number
  source: 'forecast' | 'historical' | 'observed'
  elevationM: number
  // Only on source === 'observed': what actually happened that day. The avg*
  // / precipMean / wetDayProbability fields then hold the 1991-2020 normal
  // so the two can be compared.
  actualHigh?: number
  actualLow?: number
  actualPrecip?: number
}

export type Units = 'C' | 'F'
