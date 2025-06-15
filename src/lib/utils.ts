// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(dateString: string | null) {
  if (!dateString) return '--:--'
  return format(parseISO(dateString), 'HH:mm')
}

export function formatDate(dateString: string) {
  return format(parseISO(dateString), 'MMM dd, yyyy')
}

export function isCheckedInToday(checkIn: string | null) {
  if (!checkIn) return false
  return isToday(parseISO(checkIn))
}