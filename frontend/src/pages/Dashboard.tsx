import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { apiUrl } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface TransferOut {
  id: number
  player_id: number
  player_name?: string
  price?: number
  tsi?: number
  salary?: number
  category?: string
  specialty?: string
  captured_at: string
}

interface QualityReport {
  samples: number
  diversity_score: number
  price: Record<string, number>
}

export default function Dashboard() {
  const { t, locale } = useLocale()
  const lang = locale || 'es'
  const [transfers, setTransfers] = useState<TransferOut[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [quality, setQuality] = useState<QualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(apiUrl('/api/transfers?limit=500')).then(r => r.json()),
      fetch(apiUrl('/api/transfers/count')).then(r => r.json()),
      fetch(apiUrl('/api/data/quality')).then(r => r.json()).catch(() => null),
    ])
      .then(([data, countData, q]) => {
        setTransfers(data)
        setTotalCount(countData.count ?? data.length)
        if (q?.has_data) setQuality(q)
        setLoading(false)
      })
      .catch(() => { setLoading(false); setError(true) })
  }, [])

  const prices = transfers.filter(t => t.price != null)
  const totalCapture = transfers.length
  const avgPrice = quality?.price?.avg ?? (prices.length > 0 ? prices.reduce((s, t) => s + t.price!, 0) / prices.length : 0)
  const totalTsi = transfers.reduce((s, t) => s + (t.tsi || 0), 0)
  const topPrice = quality?.price?.max ?? (prices.length > 0 ? Math.max(...prices.map(t => t.price!)) : 0)

  const chartData = prices
    .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime())
    .map(t => ({
      date: new Date(t.captured_at).toLocaleDateString(),
      price: t.price!,
      player: t.player_name || `#${t.player_id}`,
    }))

  const catCounts: Record<string, number> = {}
  transfers.forEach(t => {
    const cat = t.category || '?'
    catCounts[cat] = (catCounts[cat] || 0) + 1
  })
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  if (error) return (
    <div className="text-center py-16">
      <p className="text-gray-400 text-lg">{t('dashboard.error')}</p>
      <p className="text-gray-400 text-sm mt-1">{t('dashboard.error.desc')}</p>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-sm text-green-800">
        <p className="font-medium mb-1">{t('dashboard.intro.title')}</p>
        <p>
          {t('dashboard.intro.body')}
          {' '}<Link to="/colabora" className="underline font-medium">{t('dashboard.intro.link')}</Link>
        </p>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap">
        <svg viewBox="0 0 32 32" width="36" height="36" fill="none" className="shrink-0">
          <circle cx="16" cy="16" r="15" fill="url(#ff-logo-d)" />
          <defs>
            <radialGradient id="ff-logo-d" cx="50%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFEA9F" />
              <stop offset="20%" stopColor="#FFB347" />
              <stop offset="60%" stopColor="#FF6611" />
              <stop offset="100%" stopColor="#D70022" />
            </radialGradient>
          </defs>
          <path d="M8.5 16C8.5 11.86 11.86 8.5 16 8.5c2.5 0 4.7 1.18 6.1 3H20.5a5.5 5.5 0 0 0 0 11h1.6c-1.4 1.82-3.6 3-6.1 3-4.14 0-7.5-3.36-7.5-7.5z" fill="#fff" opacity="0.9" />
          <path d="M16 6.5C10.75 6.5 6.5 10.75 6.5 16S10.75 25.5 16 25.5 25.5 21.25 25.5 16 21.25 6.5 16 6.5zm5.5 13h-1.6a5.5 5.5 0 0 1-5.4-4.5H18l-3-5h1c3.31 0 6 2.69 6 6v3.5z" fill="#fff" opacity="0.95" />
          <path d="M12 19.5c0-1.66 1.34-3 3-3s2 .5 2.5 1.5c.5 1-.3 1.5-1.5 1.5h-4z" fill="#FF7139" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-orange-900 text-sm">
            {lang === 'es' ? '¿Aún no tienes la extensión?' : lang === 'fr' ? "Vous n'avez pas encore l'extension ?" : lang === 'de' ? 'Hast du die Erweiterung noch nicht?' : lang === 'ca' ? 'Encara no tens l\'extensió?' : lang === 'eu' ? 'Oraindik ez duzu luzapena?' : lang === 'gl' ? 'Aínda non tes a extensión?' : lang === 'pt' ? 'Ainda não tem a extensão?' : "Don't have the extension yet?"}
          </p>
          <p className="text-orange-700 text-xs mt-0.5">
            {lang === 'es' ? 'Descarga el plugin firmado para Firefox y contribuye con tus datos de Hattrick.' : lang === 'fr' ? 'Téléchargez le plugin signé pour Firefox et contribuez avec vos données Hattrick.' : lang === 'de' ? 'Laden Sie das signierte Plugin für Firefox herunter und tragen Sie Ihre Hattrick-Daten bei.' : lang === 'ca' ? 'Descarrega el plugin signat per a Firefox i contribueix amb les teves dades de Hattrick.' : lang === 'eu' ? 'Deskargatu Firefox-erako plugin sinatua eta lagundu zure Hattrick datuekin.' : lang === 'gl' ? 'Descarga o plugin asinado para Firefox e contribúe cos teus datos de Hattrick.' : lang === 'pt' ? 'Baixe o plugin assinado para Firefox e contribua com seus dados do Hattrick.' : 'Download the signed Firefox plugin and contribute your Hattrick data.'}
          </p>
        </div>
        <a
          href="/hattrick2shopping-0.6.1.xpi"
          className="shrink-0 inline-flex items-center gap-1.5 bg-[#202023] hover:bg-[#2a2a2e] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap no-underline"
        >
          <svg viewBox="0 0 32 32" width="18" height="18" fill="none">
            <circle cx="16" cy="16" r="15" fill="url(#ff-logo-d2)" />
            <defs>
              <radialGradient id="ff-logo-d2" cx="50%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FFEA9F" />
                <stop offset="20%" stopColor="#FFB347" />
                <stop offset="60%" stopColor="#FF6611" />
                <stop offset="100%" stopColor="#D70022" />
              </radialGradient>
            </defs>
            <path d="M8.5 16C8.5 11.86 11.86 8.5 16 8.5c2.5 0 4.7 1.18 6.1 3H20.5a5.5 5.5 0 0 0 0 11h1.6c-1.4 1.82-3.6 3-6.1 3-4.14 0-7.5-3.36-7.5-7.5z" fill="#fff" opacity="0.9" />
            <path d="M16 6.5C10.75 6.5 6.5 10.75 6.5 16S10.75 25.5 16 25.5 25.5 21.25 25.5 16 21.25 6.5 16 6.5zm5.5 13h-1.6a5.5 5.5 0 0 1-5.4-4.5H18l-3-5h1c3.31 0 6 2.69 6 6v3.5z" fill="#fff" opacity="0.95" />
            <path d="M12 19.5c0-1.66 1.34-3 3-3s2 .5 2.5 1.5c.5 1-.3 1.5-1.5 1.5h-4z" fill="#FF7139" />
          </svg>
          {lang === 'es' ? 'Descargar' : lang === 'fr' ? 'Télécharger' : lang === 'de' ? 'Herunterladen' : lang === 'ca' ? 'Descarregar' : lang === 'eu' ? 'Deskargatu' : lang === 'gl' ? 'Descargar' : lang === 'pt' ? 'Baixar' : 'Download'}
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse"><div className="h-10 bg-gray-100 rounded" /></div>
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 text-lg">{t('dashboard.empty')}</p>
          <Link to="/colabora" className="text-green-600 underline text-sm mt-2 inline-block">{t('dashboard.empty.link')}</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.stat.captured')}</p>
              <p className="stat-value text-green-600 mt-1">{totalCount.toLocaleString()}</p>
              {totalCount > 500 && <p className="text-[10px] text-gray-400 mt-0.5">{t('dashboard.stat.showing')}</p>}
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.stat.avgPrice')}</p>
              <p className="stat-value text-emerald-600 mt-1">{avgPrice.toLocaleString()} €</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t('dashboard.stat.over', { n: quality?.samples || prices.length })}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.stat.totalTsi')}</p>
              <p className="stat-value text-indigo-600 mt-1">{totalTsi.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.stat.maxPrice')}</p>
              <p className="stat-value text-amber-600 mt-1">{topPrice.toLocaleString()} €</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 card p-5">
              <h2 className="section-title">{t('dashboard.chart.title')}</h2>
              <p className="section-desc">{t('dashboard.chart.desc')}</p>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: '#9ca3af' }} />
                    <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(v: number) => [`${v.toLocaleString()} €`, '']}
                    />
                    <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={{ r: 2, fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm py-10 text-center">{t('dashboard.chart.empty')}</p>
              )}
            </div>
            <div className="card p-5">
              <h2 className="section-title">{t('dashboard.category.title')}</h2>
              <p className="section-desc">{t('dashboard.category.desc')}</p>
              <div className="space-y-2">
                {topCats.map(([cat, count]) => {
                  const pct = Math.round((count / totalCapture) * 100)
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-700">{cat || '?'}</span>
                        <span className="text-gray-500 font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              {quality && (
                <p className="text-xs text-gray-400 mt-4">
                  {t('dashboard.category.total', { n: quality.samples.toLocaleString(), p: quality.diversity_score })}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
