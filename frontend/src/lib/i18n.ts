/**
 * i18next — единая система локализации.
 *
 * Язык — производное от settingsStore (persist в localStorage), поэтому
 * переключатель в настройках продолжает работать как раньше: setLanguage()
 * меняет store, подписка ниже прокидывает язык в i18next.
 *
 * Паттерн миграции компонентов (вместо тернарников language === 'ru' ? … : …):
 *   const { t } = useTranslation()
 *   <span>{t('nav.dashboard')}</span>
 * Новые строки добавляются в src/locales/ru.json и en.json.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ru from '@/locales/ru.json'
import en from '@/locales/en.json'
import { useSettingsStore } from '@/store/settingsStore'

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: useSettingsStore.getState().language,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false }, // React сам экранирует
})

useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language) {
    i18n.changeLanguage(state.language)
  }
})

export default i18n
