import { useLocale } from '../i18n/LocaleContext'

function FirefoxBadge() {
  return (
    <a
      href="/hattrick2shopping-0.6.1.xpi"
      className="inline-flex items-center gap-3 bg-[#202023] hover:bg-[#2a2a2e] text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-black/10 no-underline"
    >
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
        <circle cx="16" cy="16" r="15" fill="url(#ff-logo)" />
        <defs>
          <radialGradient id="ff-logo" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFEA9F" />
            <stop offset="20%" stopColor="#FFB347" />
            <stop offset="60%" stopColor="#FF6611" />
            <stop offset="100%" stopColor="#D70022" />
          </radialGradient>
        </defs>
        <path
          d="M8.5 16C8.5 11.86 11.86 8.5 16 8.5c2.5 0 4.7 1.18 6.1 3H20.5a5.5 5.5 0 0 0 0 11h1.6c-1.4 1.82-3.6 3-6.1 3-4.14 0-7.5-3.36-7.5-7.5z"
          fill="#fff"
          opacity="0.9"
        />
        <path
          d="M16 6.5C10.75 6.5 6.5 10.75 6.5 16S10.75 25.5 16 25.5 25.5 21.25 25.5 16 21.25 6.5 16 6.5zm5.5 13h-1.6a5.5 5.5 0 0 1-5.4-4.5H18l-3-5h1c3.31 0 6 2.69 6 6v3.5z"
          fill="#fff"
          opacity="0.95"
        />
        <path
          d="M12 19.5c0-1.66 1.34-3 3-3s2 .5 2.5 1.5c.5 1-.3 1.5-1.5 1.5h-4z"
          fill="#FF7139"
        />
      </svg>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-normal opacity-80">Descargar para</span>
        <span className="text-base">Firefox</span>
      </span>
    </a>
  )
}

const DEFAULT_BACKEND = import.meta.env.VITE_API_URL || 'https://hattrick2shopping-production.up.railway.app'

export default function Colabora() {
  const { t } = useLocale()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('colabora.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('colabora.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 border-green-200 bg-green-50/40">
          <h2 className="section-title text-green-800">{t('colabora.download.title')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('colabora.download.desc')}</p>
          <div className="mt-4">
            <FirefoxBadge />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {t('colabora.download.note')}
          </p>
        </div>

        <div className="card p-6">
          <h2 className="section-title">{t('colabora.step2.title')}</h2>
          <ol className="space-y-3 text-sm text-gray-700 mt-3">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">1.</span>
              <span>{t('colabora.step2.1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">2.</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step2.2', { url: `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">${DEFAULT_BACKEND}</code>` }) }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">3.</span>
              <span>{t('colabora.step2.3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">4.</span>
              <span>{t('colabora.step2.4')}</span>
            </li>
          </ol>
        </div>

        <div className="card p-6">
          <h2 className="section-title">{t('colabora.step3.title')}</h2>
          <ol className="space-y-3 text-sm text-gray-700 mt-3">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">1.</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step3.1', { url: '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">*://*.hattrick.org/*/Transfer*</code>' }) }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">2.</span>
              <span>{t('colabora.step3.2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">3.</span>
              <span>{t('colabora.step3.3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">4.</span>
              <span>{t('colabora.step3.4')}</span>
            </li>
          </ol>
        </div>

        <div className="card p-6 border-green-100 bg-green-50/30">
          <h2 className="section-title text-green-800">{t('colabora.why.title')}</h2>
          <ul className="space-y-2 text-sm text-gray-700 mt-3">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">▸</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.why.1') }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">▸</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.why.2') }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">▸</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.why.3') }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">▸</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.why.4') }} />
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
