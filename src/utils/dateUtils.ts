// src/utils/dateUtils.ts

/**
 * Formatea una fecha a string YYYY-MM-DD en la zona horaria local
 * (no en UTC como lo hace toISOString())
 *
 * @param date - La fecha a formatear
 * @returns String en formato YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (zona horaria local)
 *
 * @returns String en formato YYYY-MM-DD
 */
export function getTodayLocal(): string {
  return formatLocalDate(new Date());
}

/**
 * Obtiene la hora actual en formato HH:MM
 *
 * @returns String en formato HH:MM
 */
export function getCurrentTimeLocal(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
