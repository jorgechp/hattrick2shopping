import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { apiUrl } from '../api'

const CATEGORY_LABELS: Record<string, string> = {
  POR: 'POR', DC: 'DC', DL: 'DL', W: 'W',
  IM: 'IM', MC: 'MC', EXT: 'EXT', DEL: 'DEL',
}

interface QualityReport {
  samples: number; diversity_score: number
  categories: Record<string, number>
  specialties: Record<string, number>
  age_buckets: Record<string, number>
  price: Record<string, number>
  correlations: Record<string, { corr: number; p_value: number }>
  gaps: string[]
  has_data: boolean
  skills: Record<string, { min: number; max: number; avg: number; median: number; std: number }>
}

interface ModelInfo {
  trained: boolean
  algorithm?: string
  n_estimators?: number
  max_depth?: number
  feature_importance?: Record<string, number>
  samples?: number
  rmse_log?: number
  rmse_euro?: number
  trained_at?: string
}

export default function ModelInfoPage() {
  const { t } = useLocale()
  const [quality, setQuality] = useState<QualityReport | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(apiUrl('/api/data/quality')).then(r => r.json()),
      fetch(apiUrl('/api/predict/info')).then(r => r.json()).catch(() => null),
    ]).then(([q, info]) => {
      if (q.has_data) setQuality(q)
      if (info?.trained) setModelInfo(info)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="text-center py-20">
      <div className="animate-spin text-4xl mb-3 inline-block">◎</div>
      <p className="text-gray-400">{t('model.empty')}</p>
    </div>
  )

  if (!quality && !modelInfo) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-3">📊</p>
      <p className="text-gray-500 text-lg">{t('model.empty')}</p>
      <p className="text-gray-400 text-sm mt-1">{t('model.empty.desc')}</p>
    </div>
  )

  const sortedCats = Object.entries(quality?.categories || {}).sort((a, b) => b[1] - a[1])
  const maxCat = sortedCats.length > 0 ? sortedCats[0][1] : 1
  const sortedSpecs = Object.entries(quality?.specialties || {}).sort((a, b) => b[1] - a[1])
  const maxSpec = sortedSpecs.length > 0 ? sortedSpecs[0][1] : 1
  const correlations = Object.entries(quality?.correlations || {})
  const topCorr = correlations.filter(([_, c]) => Math.abs(c.corr) > 0.2).sort((a, b) => Math.abs(b[1].corr) - Math.abs(a[1].corr))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('model.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('model.subtitle')}</p>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="section-title">{t('model.explanation.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('model.explanation.algorithm')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('model.explanation.p1') }} />
            <p className="text-sm text-gray-600 leading-relaxed mt-2" dangerouslySetInnerHTML={{ __html: t('model.explanation.p2') }} />
            {modelInfo && (
              <ul className="text-xs text-gray-500 mt-3 space-y-1">
                <li>▸ {t('model.explanation.trees', { n: modelInfo.n_estimators || 0 })}</li>
                <li>▸ {t('model.explanation.maxDepth', { n: modelInfo.max_depth || 0 })}</li>
                <li>▸ {t('model.explanation.samples', { n: modelInfo.samples || 0 })}</li>
                {modelInfo.trained_at && (
                  <li>▸ {t('model.explanation.lastTrain', { d: new Date(modelInfo.trained_at).toLocaleString() })}</li>
                )}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('model.explanation.variables')}</h3>
            <p className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('model.explanation.varsDesc') }} />
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span>{t('model.explanation.skills')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span>{t('model.explanation.ageTsi')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span>{t('model.explanation.specialties')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>{t('model.explanation.categories')}</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">{t('model.explanation.logPrice')}</p>
          </div>
        </div>
      </div>

      {quality && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('model.stat.samples')}</p>
              <p className="stat-value text-green-600 mt-1">{quality.samples}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('model.stat.diversity')}</p>
              <p className="stat-value text-indigo-600 mt-1">{quality.diversity_score}%</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('model.stat.avgPrice')}</p>
              <p className="stat-value text-emerald-600 mt-1">{quality.price?.avg?.toLocaleString() || '-'} €</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('model.stat.maxPrice')}</p>
              <p className="stat-value text-amber-600 mt-1">{quality.price?.max?.toLocaleString() || '-'} €</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card p-5">
              <h2 className="section-title">{t('model.category.title')}</h2>
              <p className="section-desc">{t('model.category.desc')}</p>
              <div className="space-y-2">
                {sortedCats.map(([cat, count]) => {
                  const pct = (count / maxCat) * 100
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-700">{CATEGORY_LABELS[cat] || cat}</span>
                        <span className="text-gray-500 font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-5">
                <h2 className="section-title">{t('model.specialty.title')}</h2>
                <p className="section-desc">{t('model.specialty.desc')}</p>
                <div className="space-y-2">
                  {sortedSpecs.map(([spec, count]) => {
                    const pct = (count / maxSpec) * 100
                    return (
                      <div key={spec}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-gray-700">{spec}</span>
                          <span className="text-gray-500 font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="card p-5">
                <h2 className="section-title">{t('model.age.title')}</h2>
                <p className="section-desc">{t('model.age.desc')}</p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {Object.entries(quality.age_buckets).map(([bucket, count]) => {
                    const pct = quality.samples > 0 ? Math.round((count / quality.samples) * 100) : 0
                    return (
                      <div key={bucket}>
                        <div className="text-xs text-gray-500">{bucket}</div>
                        <div className="text-lg font-bold text-gray-800">{pct}%</div>
                        <div className="text-xs text-gray-400">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {topCorr.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="section-title">{t('model.corr.title')}</h2>
              <p className="section-desc">{t('model.corr.desc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {topCorr.map(([name, c]) => {
                  const strength = Math.abs(c.corr)
                  const color = strength > 0.5 ? 'bg-green-100 text-green-800 border-green-200'
                    : strength > 0.3 ? 'bg-teal-50 text-teal-700 border-teal-100'
                    : 'bg-gray-50 text-gray-600 border-gray-100'
                  return (
                    <div key={name} className={`rounded-lg p-3 text-center border ${color}`}>
                      <p className="text-xs font-medium">{name}</p>
                      <p className="text-lg font-bold mt-0.5">{(c.corr).toFixed(2)}</p>
                      <p className="text-xs opacity-60">{c.p_value < 0.05 ? t('model.corr.significant') : t('model.corr.notSignificant')}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {quality.gaps.length > 0 && (
            <div className="card p-5 mb-6 border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-500 text-lg">⚠</span>
                <h2 className="section-title mb-0">{t('model.gaps.title')}</h2>
              </div>
              <p className="section-desc">{t('model.gaps.desc')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {quality.gaps.slice(0, 12).map((g, i) => (
                  <div key={i} className="flex items-start gap-2 text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                    <span className="text-amber-400 mt-0.5">▸</span>
                    <span>{g}</span>
                  </div>
                ))}
                {quality.gaps.length > 12 && (
                  <p className="text-xs text-gray-400 col-span-full text-center mt-1">
                    {t('model.gaps.more', { n: quality.gaps.length - 12 })}
                  </p>
                )}
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800">
              {t('model.gaps.help')} <Link to="/colabora" className="underline font-medium">{t('model.gaps.helpLink')}</Link>
              </div>
            </div>
          )}

          {quality.skills && (
            <div className="card p-5 mb-6">
              <h2 className="section-title">{t('model.skills.title')}</h2>
              <p className="section-desc">{t('model.skills.desc')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{t('model.skills.skill')}</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{t('model.skills.min')}</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{t('model.skills.avg')}</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{t('model.skills.median')}</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{t('model.skills.max')}</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{t('model.skills.std')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(quality.skills).map(([name, s]) => (
                      <tr key={name} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium text-gray-700">{name}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{s.min}</td>
                        <td className="px-3 py-2 text-center font-medium text-gray-800">{s.avg}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{s.median}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{s.max}</td>
                        <td className="px-3 py-2 text-center text-gray-400">{s.std}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
