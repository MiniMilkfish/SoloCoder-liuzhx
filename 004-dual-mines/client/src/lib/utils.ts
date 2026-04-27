import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const GAME_CONFIG = {
  ROWS: 10,
  COLS: 10,
  MINE_COUNT: 15,
  TIME_LIMIT: 30,
  MAX_SPECTATORS: 5,
} as const;

export function getNumberColor(count: number): string {
  const colors: Record<number, string> = {
    1: 'text-blue-600 dark:text-blue-400',
    2: 'text-green-600 dark:text-green-400',
    3: 'text-red-600 dark:text-red-400',
    4: 'text-purple-600 dark:text-purple-400',
    5: 'text-orange-600 dark:text-orange-400',
    6: 'text-cyan-600 dark:text-cyan-400',
    7: 'text-gray-800 dark:text-gray-200',
    8: 'text-gray-500 dark:text-gray-400',
  };
  return colors[count] || '';
}
