import { useState, useEffect } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const SKILLS = [
  { key: 'keeper', max: 20 },
  { key: 'defending', max: 20 },
  { key: 'playmaking', max: 20 },
  { key: 'winger', max: 20 },
  { key: 'passing', max: 20 },
  { key: 'scoring', max: 20 },
  { key: 'setpieces', max: 20 },
]

const SPECIALTIES = [
  { value: '', key: 'specialty.none' },
  { value: 'technical', key: 'specialty.technical' },
  { value: 'quick', key: 'specialty.quick' },
  { value: 'powerful', key: 'specialty.powerful' },
  { value: 'unpredictable', key: 'specialty.unpredictable' },
  { value: 'head', key: 'specialty.head' },
]

const CATEGORIES = [
  { value: '', key: 'cat.unspecified' },
  { value: 'POR', label: 'POR' },
  { value: 'DC', label: 'DC' },
  { value: 'DL', label: 'DL' },
  { value: 'W', label: 'W' },
  { value: 'IM', label: 'IM' },
  { value: 'MC', label: 'MC' },
  { value: 'EXT', label: 'EXT' },
  { value: 'DEL', label: 'DEL' },
]

const EXAMPLES = [
  {
    nameKey: 'example.delantero',
    skills: { keeper: 1, defending: 5, playmaking: 6, winger: 8, passing: 7, scoring: 12, setpieces: 2 },
    age: 18, tsi: 2500, specialty: 'quick', category: 'DEL',
  },
  {
    nameKey: 'example.interior',
    skills: { keeper: 1, defending: 8, playmaking: 14, winger: 7, passing: 12, scoring: 6, setpieces: 3 },
    age: 30, tsi: 1800, specialty: 'powerful', category: 'IM',
  },
  {
    nameKey: 'example.defensa',
    skills: { keeper: 1, defending: 14, playmaking: 5, winger: 4, passing: 6, scoring: 3, setpieces: 5 },
    age: 22, tsi: 3200, specialty: 'head', category: 'DC',
  },
  {
    nameKey: 'example.portero',
    skills: { keeper: 16, defending: 6, playmaking: 2, winger: 2, passing: 3, scoring: 1, setpieces: 4 },
    age: 25, tsi: 1500, specialty: 'technical', category: 'POR',
  },
]

interface PredictResult {
  price: number; ci_lower: number; ci_upper: number; trained: boolean
}
interface ProjectionPoint {
  age: number; price: number; ci_lower: number; ci_upper: number
}
interface ScenarioData {
  scenario: string; label: string; color: string; points: ProjectionPoint[]
}

const LEVEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6']

function skillLevel(t: (k: string) => string, val: number): string {
  const idx = val <= 3 ? 0 : val <= 5 ? 1 : val <= 7 ? 2 : val <= 9 ? 3 : val <= 11 ? 4 : val <= 13 ? 5 : val <= 16 ? 6 : 7
  return t(`level.${idx}`)
}

function skillColor(val: number): string {
  if (val <= 3) return LEVEL_COLORS[0]
  if (val <= 5) return LEVEL_COLORS[1]
  if (val <= 7) return LEVEL_COLORS[2]
  if (val <= 9) return LEVEL_COLORS[3]
  if (val <= 11) return LEVEL_COLORS[4]
  if (val <= 13) return LEVEL_COLORS[5]
  if (val <= 16) return LEVEL_COLORS[6]
  return LEVEL_COLORS[7]
}

export default function Predictor() {
  const { t } = useLocale()
  const [skills, setSkills] = useState<Record<string, number>>(
    Object.fromEntries(SKILLS.map(s => [s.key, 5]))
  )
  const [age, setAge] = useState(17)
  const [tsi, setTsi] = useState(1000)
  const [specialty, setSpecialty] = useState('')
  const [category, setCategory] = useState('')
  const [result, setResult] = useState<PredictResult | null>(null)
  const [projection, setProjection] = useState<ProjectionPoint[]>([])
  const [scenarios, setScenarios] = useState<ScenarioData[]>([])
  const [trainedSkill, setTrainedSkill] = useState('')
  const [skillGrowthRate, setSkillGrowthRate] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ trained: boolean } | null>(null)
  const [showParams, setShowParams] = useState(true)

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setStatus(d.ml)).catch(() => {})
  }, [])

  function loadExample(example: typeof EXAMPLES[number]) {
    setSkills({ ...example.skills })
    setAge(example.age)
    setTsi(example.tsi)
    setSpecialty(example.specialty)
    setCategory(example.category)
    setResult(null)
    setProjection([])
    setScenarios([])
    setTrainedSkill('')
    setSkillGrowthRate(1.0)
  }

  async function handlePredict() {
    setLoading(true)
    setResult(null)
    setProjection([])
    setScenarios([])
    const body = JSON.stringify({
      skills, age, ageDays: 0, tsi, specialty, category,
      trained_skill: trainedSkill || undefined,
      skill_growth_per_year: trainedSkill ? skillGrowthRate : undefined,
    })
    try {
      const [predRes, projRes] = await Promise.all([
        fetch('/api/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }),
        fetch('/api/predict/projection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }),
      ])
      if (predRes.ok) setResult(await predRes.json())
      if (projRes.ok) {
        const d = await projRes.json()
        if (d.scenarios?.length) {
          setScenarios(d.scenarios)
          setProjection(d.projection || [])
        } else {
          setProjection(d.projection || [])
          setScenarios([])
        }
      }
    } catch {} finally { setLoading(false) }
  }

  const formatEuro = (v: number) => `${Math.round(v).toLocaleString()} €`

  if (status && !status.trained) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🧠</p>
        <p className="text-lg text-gray-500">{t('predictor.untrained')}</p>
        <p className="text-gray-400 text-sm mt-1">{t('predictor.untrained.desc')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('predictor.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('predictor.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card p-5">
          <button
            onClick={() => setShowParams(!showParams)}
            className="flex items-center justify-between w-full lg:hidden mb-2"
          >
            <h2 className="section-title mb-0">{t('predictor.params')}</h2>
            <span className="text-gray-400">{showParams ? '▲' : '▼'}</span>
          </button>
          <h2 className={`section-title ${showParams ? 'hidden lg:block' : 'hidden'}`}>{t('predictor.params')}</h2>

          <div className={showParams ? 'mb-4' : 'hidden'}>
            <p className="text-xs font-medium text-gray-500 mb-2">{t('predictor.examples')}</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map(ex => (
                <button
                  key={ex.nameKey}
                  onClick={() => loadExample(ex)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                >
                  {t(ex.nameKey)}
                </button>
              ))}
            </div>
          </div>

          <div className={showParams ? 'space-y-4' : 'hidden'}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('predictor.age')}</label>
                <input type="number" value={age} onChange={e => setAge(Number(e.target.value))}
                  className="input-field" min={15} max={50} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('predictor.tsi')}</label>
                <input type="number" value={tsi} onChange={e => setTsi(Number(e.target.value))}
                  className="input-field" min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('predictor.specialty')}</label>
                <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="input-field">
                  {SPECIALTIES.map(s => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('predictor.category')}</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label || t(c.key || 'cat.unspecified')}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-600 mb-2">{t('predictor.training.title')}</p>
              <p className="text-[10px] text-gray-400 mb-2">{t('predictor.training.desc')}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setTrainedSkill('')}
                  className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                    trainedSkill === ''
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('predictor.training.none')}
                </button>
                {SKILLS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setTrainedSkill(s.key)}
                    className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                      trainedSkill === s.key
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t(`skill.${s.key}`)}
                  </button>
                ))}
              </div>
              {trainedSkill && (
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-xs text-gray-500">{t('predictor.training.rate')}</label>
                  <input
                    type="number"
                    value={skillGrowthRate}
                    onChange={e => setSkillGrowthRate(parseFloat(e.target.value) || 0)}
                    step={0.1}
                    min={0}
                    max={10}
                    className="input-field w-20 text-xs"
                  />
                  <span className="text-xs text-gray-400">{t('predictor.training.perYear')}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">{t('predictor.skills')}</p>
              {SKILLS.map(s => {
                const val = skills[s.key] || 1
                const color = skillColor(val)
                return (
                  <div key={s.key} className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-600">{t(`skill.${s.key}`)}</span>
                      <span className="font-medium" style={{ color }}>{val} — {skillLevel(t, val)}</span>
                    </div>
                    <input type="range" min={1} max={s.max} value={val}
                      onChange={e => setSkills({ ...skills, [s.key]: Number(e.target.value) })}
                      className="w-full accent-current" style={{ accentColor: color }} />
                  </div>
                )
              })}
            </div>

            <button onClick={handlePredict} disabled={loading}
              className="btn-primary w-full">
              {loading ? t('predictor.calculating') : t('predictor.predict')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!result && !loading && !projection.length && (
            <div className="card p-10 text-center">
              <p className="text-5xl mb-4">◎</p>
              <p className="text-gray-400">{t('predictor.placeholder')}</p>
              <p className="text-gray-300 text-sm mt-1">{t('predictor.placeholder.desc')}</p>
            </div>
          )}

          {loading && (
            <div className="card p-10 text-center">
              <div className="animate-spin text-4xl mb-3 inline-block">◎</div>
              <p className="text-gray-400">{t('predictor.loading')}</p>
            </div>
          )}

          {result && (
            <div className="card p-5">
              <h2 className="section-title">{t('predictor.result.title')}</h2>
              <p className="section-desc">{t('predictor.result.desc')}</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">{t('predictor.result.min')}</p>
                  <p className="text-xl font-bold text-orange-700 mt-1">{formatEuro(result.ci_lower)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100 ring-2 ring-green-200">
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wide">{t('predictor.result.est')}</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatEuro(result.price)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">{t('predictor.result.max')}</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{formatEuro(result.ci_upper)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">{t('predictor.result.ci')}</p>
            </div>
          )}

          {projection.length > 0 && scenarios.length === 0 && (
            <div className="card p-5">
              <h2 className="section-title">{t('predictor.projection.title')}</h2>
              <p className="section-desc">{t('predictor.projection.desc')}</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="age" fontSize={11} tick={{ fill: '#9ca3af' }} label={{ value: t('predictor.age'), position: 'insideBottom', offset: -5, style: { fill: '#9ca3af', fontSize: 11 } }} />
                  <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(v: number) => [formatEuro(v), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot name={t('predictor.projection.price')} />
                  <Line type="monotone" dataKey="ci_upper" stroke="#86efac" strokeWidth={1} strokeDasharray="4 4" dot={false} name={t('predictor.projection.upper')} />
                  <Line type="monotone" dataKey="ci_lower" stroke="#86efac" strokeWidth={1} strokeDasharray="4 4" dot={false} name={t('predictor.projection.lower')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {scenarios.length > 0 && projection.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title">{t('predictor.projection.title')}</h2>
              <p className="section-desc">{t('predictor.training.desc')}</p>
              <div className="flex flex-wrap gap-3 mb-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-green-600" />
                  <span className="text-gray-600">{t('predictor.projection.price')}</span>
                </span>
                {scenarios.map(s => (
                  <span key={s.scenario} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600">{t(`skill.${trainedSkill}`)} {s.label}</span>
                  </span>
                ))}
              </div>
              {(() => {
                const merged = projection.map((p, i) => ({
                  age: p.age,
                  price: p.price,
                  ci_upper: p.ci_upper,
                  ci_lower: p.ci_lower,
                  training_price: scenarios[0]?.points[i]?.price ?? p.price,
                }))
                return (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={merged}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="age" fontSize={11} tick={{ fill: '#9ca3af' }} label={{ value: t('predictor.age'), position: 'insideBottom', offset: -5, style: { fill: '#9ca3af', fontSize: 11 } }} />
                      <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        formatter={(v: number) => [formatEuro(v), '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={false} name={t('predictor.projection.price')} />
                      <Line type="monotone" dataKey="ci_upper" stroke="#86efac" strokeWidth={1} strokeDasharray="3 3" dot={false} name={t('predictor.projection.upper')} />
                      <Line type="monotone" dataKey="ci_lower" stroke="#86efac" strokeWidth={1} strokeDasharray="3 3" dot={false} name={t('predictor.projection.lower')} />
                      <Line type="monotone" dataKey="training_price" stroke="#f97316" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name={scenarios[0]?.label || ''} />
                    </LineChart>
                  </ResponsiveContainer>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
