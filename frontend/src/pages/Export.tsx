import { useLocale } from '../i18n/LocaleContext'

export default function Export() {
  const { t } = useLocale()

  const API_BASE = import.meta.env.VITE_API_URL || 'https://hattrick2shopping-production.up.railway.app'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('export.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('export.subtitle')}</p>
      </div>

      <div className="card p-6 max-w-xl">
        <p className="text-sm text-gray-600 mb-5">{t('export.desc')}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`${API_BASE}/api/data/export`}
            download
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('export.json')}
          </a>
          <a
            href={`${API_BASE}/api/data/export/binary`}
            download
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('export.binary')}
          </a>
        </div>
      </div>
    </div>
  )
}