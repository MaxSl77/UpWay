/**
 * Общие правила валидации ввода (UX-слой).
 *
 * Это зеркало backend/app/core/validators.py. Бэкенд остаётся авторитетным
 * (его обойти нельзя), а здесь мы даём пользователю мгновенную понятную
 * ошибку до отправки. Сообщения локализованы (ru/en).
 */
import type { Language } from '@/store/settingsStore'

// Буквы (лат/кир) + пробел, дефис, апостроф, точка
export const HUMAN_NAME_RE = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё \-'’.]*$/
// Место/команда/школа: то же + цифры, № и пунктуация
export const PLACE_NAME_RE = /^[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9 \-'’.,№/()]*$/
export const URL_RE = /(https?:\/\/|www\.|t\.me\/|[\w-]+\.(?:com|net|org|ru|by|io|ai|app|info|xyz)\b)/i
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Msg = Record<Language, string>
const pick = (m: Msg, lang: Language) => m[lang] ?? m.ru

/** Имя человека. Возвращает текст ошибки или null. */
export function validateHumanName(value: string, lang: Language): string | null {
  const v = value.trim().replace(/\s{2,}/g, ' ')
  if (v.length < 2) return pick({ ru: 'Введите имя (минимум 2 символа)', en: 'Enter a name (min 2 characters)' }, lang)
  if (v.length > 100) return pick({ ru: 'Слишком длинное имя', en: 'Name is too long' }, lang)
  if (URL_RE.test(v)) return pick({ ru: 'Имя не должно содержать ссылок', en: 'Name must not contain links' }, lang)
  if (!HUMAN_NAME_RE.test(v)) return pick({ ru: 'Только буквы, пробел, дефис и апостроф', en: 'Letters, spaces, hyphens and apostrophes only' }, lang)
  return null
}

/** Город/команда/школа (необязательное). Пустое — ок. */
export function validatePlaceName(value: string, lang: Language): string | null {
  const v = value.trim()
  if (!v) return null
  if (v.length > 100) return pick({ ru: 'Слишком длинное значение', en: 'Value is too long' }, lang)
  if (URL_RE.test(v)) return pick({ ru: 'Поле не должно содержать ссылок', en: 'Field must not contain links' }, lang)
  if (!PLACE_NAME_RE.test(v)) return pick({ ru: 'Недопустимые символы', en: 'Invalid characters' }, lang)
  return null
}

export function validateEmail(value: string, lang: Language): string | null {
  const v = value.trim()
  if (!EMAIL_RE.test(v)) return pick({ ru: 'Введите корректный email', en: 'Enter a valid email' }, lang)
  return null
}

export function validatePassword(value: string, lang: Language): string | null {
  if (value.length < 8) return pick({ ru: 'Пароль: минимум 8 символов', en: 'Password: at least 8 characters' }, lang)
  if (value.length > 128) return pick({ ru: 'Пароль слишком длинный', en: 'Password is too long' }, lang)
  return null
}

/** Символы, допустимые в имени — для блокировки ввода на лету (onChange). */
export function isAllowedHumanNameInput(value: string): boolean {
  return value === '' || HUMAN_NAME_RE.test(value)
}
export function isAllowedPlaceNameInput(value: string): boolean {
  return value === '' || PLACE_NAME_RE.test(value)
}
