import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getDaysUntil(date: string | Date): number {
  const target = new Date(date)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatTimeUntil(date: string | Date): string {
  const days = getDaysUntil(date)
  const formattedDate = formatDate(date)

  // Show date with days count when less than 100 days away
  if (days >= 0 && days < 100) {
    return `${formattedDate} (${days}d)`
  }

  // Just show the date for everything else (past dates or 100+ days away)
  return formattedDate
}

export type DeadlineUrgency = 'normal' | 'warning' | 'urgent';

export function getDeadlineUrgency(date: string | Date): DeadlineUrgency {
  const days = getDaysUntil(date)

  if (days < 30) {
    return 'urgent' // Less than 30 days - red
  }
  if (days < 60) {
    return 'warning' // Less than 60 days - yellow
  }
  return 'normal' // 60+ days - grey
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
