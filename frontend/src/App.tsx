import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useLocale } from './i18n/LocaleContext'
import { LOCALES } from './i18n/translations'
import RandomBanner from './components/RandomBanner'
import Dashboard from './pages/Dashboard'
import Transfers from './pages/Transfers'
import Predictor from './pages/Predictor'
import ModelInfo from './pages/ModelInfo'
import Colabora from './pages/Colabora'
import ExportPage from './pages/Export'

const LANG_ICON = '🌐'

function App() {
  const location = useLocation()
  const { t, locale, setLocale } = useLocale()
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const NAV_ITEMS = [
    { path: '/', label: t('nav.dashboard'), icon: '▦' },
    { path: '/transfers', label: t('nav.latest'), icon: '⟳' },
    { path: '/predictor', label: t('nav.predictor'), icon: '◎' },
    { path: '/modelo', label: t('nav.model'), icon: '⚙' },
    { path: '/colabora', label: t('nav.colabora'), icon: '♡' },
    { path: '/export', label: t('nav.export'), icon: '⬇' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-green-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo/isotipo.webp" alt="Hattrick2Shopping" className="h-8 sm:hidden" />
              <img src="/logo/logo.webp" alt="Hattrick2Shopping" className="h-8 hidden sm:block" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2.5 py-2 rounded-lg flex items-center gap-1.5 text-sm ${
                      active
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-green-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              <div className="relative ml-2" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="text-base leading-none">{LANG_ICON}</span>
                  <span className="text-xs font-medium">{locale.toUpperCase()}</span>
                  <svg className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {langOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    {LOCALES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLocale(l.code); setLangOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                          l.code === locale
                            ? 'bg-green-50 text-green-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{l.label}</span>
                        {l.code === locale && <span className="ml-auto text-green-500 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: language + hamburger */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-green-100"
              >
                <span className="text-base leading-none">{LANG_ICON}</span>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  {LOCALES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLocale(l.code); setLangOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                        l.code === locale
                          ? 'bg-green-50 text-green-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{l.label}</span>
                      {l.code === locale && <span className="ml-auto text-green-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setMenuOpen(true)} className="p-2 rounded-lg text-green-100 hover:text-white hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Menú</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(item => {
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg w-6 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                    {active && <span className="ml-auto text-green-500 text-xs">●</span>}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400 mb-2">{t('footer.text')}</p>
              <div className="flex flex-wrap gap-1.5">
                {LOCALES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLocale(l.code); setMenuOpen(false) }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      l.code === locale
                        ? 'bg-green-50 text-green-700 font-semibold'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <RandomBanner key={location.pathname} />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/predictor" element={<Predictor />} />
          <Route path="/modelo" element={<ModelInfo />} />
          <Route path="/colabora" element={<Colabora />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </main>

      <footer className="border-t border-green-600 bg-green-700 sm:block hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 text-center text-xs text-green-200">
          {t('footer.text')}
        </div>
      </footer>
    </div>
  )
}

export default App
