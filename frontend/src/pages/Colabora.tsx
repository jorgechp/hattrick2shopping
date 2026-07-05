import { useLocale } from '../i18n/LocaleContext'

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
        <div className="card p-6">
          <h2 className="section-title">{t('colabora.step1.title')}</h2>
          <ol className="space-y-3 text-sm text-gray-700 mt-3">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">1.</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step1.1', { url: '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">about:debugging#/runtime/this-firefox</code>' }) }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">2.</span>
              <span>{t('colabora.step1.2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">3.</span>
              <span dangerouslySetInnerHTML={{ __html: t('colabora.step1.3', { file: '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">extensions/firefox/manifest.json</code>' }) }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">4.</span>
              <span>{t('colabora.step1.4')}</span>
            </li>
          </ol>
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
