import { useLocale } from '../i18n/LocaleContext'

function FirefoxBadge() {
  return (
    <a
      href="/hattrick2shopping-0.6.1.xpi"
      className="inline-flex items-center gap-3 bg-[#202023] hover:bg-[#2a2a2e] text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-black/10 no-underline"
    >
      <img
        src="/images/firefox-logo-symbol-onecolor-white-rgb.svg"
        alt="Firefox"
        className="w-8 h-8"
      />
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
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step3.1') }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">2.</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step3.2') }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">3.</span>
              <span>{t('colabora.step3.3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">4.</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step3.4') }} />
            </li>
          </ol>
          <figure className="mt-4">
            <img
              src="/images/example_search.png"
              alt="Ejemplo de búsqueda en Transferencias de Hattrick"
              className="w-full rounded-lg border border-gray-200"
            />
            <figcaption className="text-xs text-gray-400 mt-1 text-center">
              {t('colabora.step3.exampleSearch')}
            </figcaption>
          </figure>
          <figure className="mt-3">
            <img
              src="/images/extension_example.png"
              alt="Ejemplo del popup de la extensión"
              className="w-full rounded-lg border border-gray-200"
            />
            <figcaption className="text-xs text-gray-400 mt-1 text-center">
              {t('colabora.step3.exampleExtension')}
            </figcaption>
          </figure>
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
