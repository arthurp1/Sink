import { type DateValue, fromAbsolute, toCalendarDate } from '@internationalized/date'

export function getTimeZone() {
  if (typeof Intl === 'undefined')
    return 'Etc/UTC'

  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getLocale() {
  if (typeof Intl === 'undefined')
    return navigator.language

  return Intl.DateTimeFormat().resolvedOptions().locale
}

export function shortDate(unix = 0) {
  const date = new Date(unix * 1000)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 14) {
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' })
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0)
      return rtf.format(-days, 'day')
    if (hours > 0)
      return rtf.format(-hours, 'hour')
    if (minutes > 0)
      return rtf.format(-minutes, 'minute')
    return rtf.format(-seconds, 'second')
  }

  // Check if date is from current year
  const currentYear = now.getFullYear()
  const dateYear = date.getFullYear()
  const isCurrentYear = currentYear === dateYear

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    ...(isCurrentYear ? {} : { year: '2-digit' }),
  })
  return dateFormatter.format(date)
}

export function longDate(unix = 0) {
  return new Date(unix * 1000).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function date2unix(dateValue: DateValue | Date, type: string) {
  const date = dateValue instanceof Date ? dateValue : dateValue.toDate(getTimeZone())
  if (type === 'start')
    return Math.floor(date.setHours(0, 0, 0) / 1000)

  if (type === 'end')
    return Math.floor(date.setHours(23, 59, 59) / 1000)

  return Math.floor(date.getTime() / 1000)
}

export function unix2date(unix: number) {
  return toCalendarDate(fromAbsolute(unix * 1000, getTimeZone()))
}
