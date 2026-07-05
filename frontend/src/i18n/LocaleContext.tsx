import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, type Locale } from './translations'

function detectBrowserLocale(): Locale {
  const langs = navigator.languages || [navigator.language]
  for (const l of langs) {
    const code = l.split('-')[0] as Locale
    if (translations[code]) return code
  }
  return 'es'
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'es',
  setLocale: () => {},
  t: (k: string) => k,
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale')
    if (saved && translations[saved as Locale]) return saved as Locale
    return detectBrowserLocale()
  })

  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale
  }, [locale])

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] ?? translations.es[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
