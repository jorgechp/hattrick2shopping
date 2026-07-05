import { useEffect, useState, useMemo } from 'react'
import { useLocale } from '../i18n/LocaleContext'

interface TransferOut {
  id: number
  player_id: number
  player_name?: string
  price?: number
  tsi?: number
  salary?: number
  category?: string
  specialty?: string
  deadline?: string
  views?: number
  bids?: number
  owner?: string
  source_url?: string
  captured_at: string
}

type SortKey = 'player_name' | 'category' | 'price' | 'tsi' | 'bids' | 'captured_at'
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; labelKey: string; align?: string }[] = [
  { key: 'player_name', labelKey: 'transfers.col.player' },
  { key: 'category', labelKey: 'transfers.col.cat' },
  { key: 'price', labelKey: 'transfers.col.price', align: 'right' },
  { key: 'tsi', labelKey: 'transfers.col.tsi', align: 'right' },
  { key: 'bids', labelKey: 'transfers.col.bids', align: 'right' },
  { key: 'captured_at', labelKey: 'transfers.col.captured' },
]

interface Filters {
  text: string
  cat: string
  priceMin: string
  priceMax: string
  tsiMin: string
  tsiMax: string
  bidsMin: string
  bidsMax: string
  dateFrom: string
  dateTo: string
}

const emptyFilters: Filters = {
  text: '', cat: '',
  priceMin: '', priceMax: '',
  tsiMin: '', tsiMax: '',
  bidsMin: '', bidsMax: '',
  dateFrom: '', dateTo: '',
}

export default function Transfers() {
  const { t } = useLocale()
  const [transfers, setTransfers] = useState<TransferOut[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('captured_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [modelInfo, setModelInfo] = useState<{ trained_at?: string } | null>(null)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/transfers?limit=500').then(r => r.json()),
      fetch('/api/predict/info').then(r => r.json()).catch(() => null),
    ]).then(([data, info]) => {
      setTransfers(data)
      setModelInfo(info?.trained ? info : null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeFilterCount = useMemo(() =>
    Object.entries(filters).filter(([_, v]) => v !== '').length, [filters])

  const filtered = useMemo(() => {
    let items = [...transfers]

    if (filters.text.trim()) {
      const q = filters.text.toLowerCase()
      items = items.filter(t =>
        t.player_name?.toLowerCase().includes(q) ||
        t.owner?.toLowerCase().includes(q) ||
        t.specialty?.toLowerCase().includes(q)
      )
    }
    if (filters.cat) {
      items = items.filter(t => t.category === filters.cat)
    }
    if (filters.priceMin) {
      const v = Number(filters.priceMin)
      if (!isNaN(v)) items = items.filter(t => (t.price ?? 0) >= v)
    }
    if (filters.priceMax) {
      const v = Number(filters.priceMax)
      if (!isNaN(v)) items = items.filter(t => (t.price ?? 0) <= v)
    }
    if (filters.tsiMin) {
      const v = Number(filters.tsiMin)
      if (!isNaN(v)) items = items.filter(t => (t.tsi ?? 0) >= v)
    }
    if (filters.tsiMax) {
      const v = Number(filters.tsiMax)
      if (!isNaN(v)) items = items.filter(t => (t.tsi ?? 0) <= v)
    }
    if (filters.bidsMin) {
      const v = Number(filters.bidsMin)
      if (!isNaN(v)) items = items.filter(t => (t.bids ?? 0) >= v)
    }
    if (filters.bidsMax) {
      const v = Number(filters.bidsMax)
      if (!isNaN(v)) items = items.filter(t => (t.bids ?? 0) <= v)
    }
    if (filters.dateFrom) {
      const d = new Date(filters.dateFrom).getTime()
      items = items.filter(t => new Date(t.captured_at).getTime() >= d)
    }
    if (filters.dateTo) {
      const d = new Date(filters.dateTo).getTime() + 86400000
      items = items.filter(t => new Date(t.captured_at).getTime() <= d)
    }

    items.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortKey) {
        case 'player_name': aVal = a.player_name || ''; bVal = b.player_name || ''; break
        case 'category': aVal = a.category || ''; bVal = b.category || ''; break
        case 'price': aVal = a.price ?? 0; bVal = b.price ?? 0; break
        case 'tsi': aVal = a.tsi ?? 0; bVal = b.tsi ?? 0; break
        case 'bids': aVal = a.bids ?? 0; bVal = b.bids ?? 0; break
        case 'captured_at': aVal = a.captured_at; bVal = b.captured_at; break
        default: aVal = a.captured_at; bVal = b.captured_at
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
    return items
  }, [transfers, sortKey, sortDir, filters])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'captured_at' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-green-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters(f => ({ ...f, [k]: e.target.value }))

  const clearFilters = () => { setFilters(emptyFilters) }

  const categories = useMemo(() => {
    const cats = new Set(transfers.map(t => t.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [transfers])

  const formatEuro = (v?: number) =>
    v != null ? `${v.toLocaleString()} €` : '-'

  const FilterInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )

  const filterBar = (
    <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FilterInput label={t('transfers.col.player')}>
          <input type="text" value={filters.text} onChange={set('text')}
            placeholder={t('transfers.search')} className="input-field text-xs" />
        </FilterInput>
        <FilterInput label={t('transfers.col.cat')}>
          <select value={filters.cat} onChange={set('cat')} className="input-field text-xs">
            <option value="">—</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FilterInput>
        <FilterInput label={t('transfers.col.price')}>
          <div className="flex gap-1 items-center">
            <input type="number" value={filters.priceMin} onChange={set('priceMin')} placeholder="Min" className="input-field text-xs w-full" />
            <span className="text-gray-300 text-xs">~</span>
            <input type="number" value={filters.priceMax} onChange={set('priceMax')} placeholder="Max" className="input-field text-xs w-full" />
          </div>
        </FilterInput>
        <FilterInput label={t('transfers.col.tsi')}>
          <div className="flex gap-1 items-center">
            <input type="number" value={filters.tsiMin} onChange={set('tsiMin')} placeholder="Min" className="input-field text-xs w-full" />
            <span className="text-gray-300 text-xs">~</span>
            <input type="number" value={filters.tsiMax} onChange={set('tsiMax')} placeholder="Max" className="input-field text-xs w-full" />
          </div>
        </FilterInput>
        <FilterInput label={t('transfers.col.bids')}>
          <div className="flex gap-1 items-center">
            <input type="number" value={filters.bidsMin} onChange={set('bidsMin')} placeholder="Min" className="input-field text-xs w-full" />
            <span className="text-gray-300 text-xs">~</span>
            <input type="number" value={filters.bidsMax} onChange={set('bidsMax')} placeholder="Max" className="input-field text-xs w-full" />
          </div>
        </FilterInput>
        <FilterInput label={t('transfers.col.captured')}>
          <input type="date" value={filters.dateFrom} onChange={set('dateFrom')} className="input-field text-xs w-full mb-1" />
          <input type="date" value={filters.dateTo} onChange={set('dateTo')} className="input-field text-xs w-full" />
        </FilterInput>
      </div>
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="text-xs text-green-600 hover:text-green-800 font-medium">
          Limpiar filtros ({activeFilterCount})
        </button>
      )}
    </div>
  )

  if (loading) return (
    <div>
      <div className="mb-6"><div className="h-7 w-48 bg-gray-100 rounded animate-pulse" /></div>
      <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}</div>
    </div>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('transfers.title')}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            {t('transfers.subtitle', { n: transfers.length, u: transfers.filter((v,i,a) => a.findIndex(t => t.player_id === v.player_id) === i).length })}
            {modelInfo?.trained_at && (
              <span className="ml-2 text-gray-400">{t('transfers.modelUpdated', { d: new Date(modelInfo.trained_at).toLocaleDateString() })}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeFilterCount > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtros
          {activeFilterCount > 0 && (
            <span className="bg-green-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && filterBar}

      {transfers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">{t('transfers.empty')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('transfers.empty.desc')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-800 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {t(col.labelKey)}<SortIcon col={col.key} />
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hide-mobile whitespace-nowrap">{t('transfers.col.owner')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin resultados para estos filtros</td></tr>
                ) : (
                  filtered.map(tr => (
                    <tr key={tr.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-900 text-sm">{tr.player_name || `#${tr.player_id}`}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {tr.category || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-emerald-600 whitespace-nowrap text-sm">{formatEuro(tr.price)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap text-sm">{tr.tsi?.toLocaleString() || '-'}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 text-sm">{tr.bids ?? '-'}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{new Date(tr.captured_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5 text-gray-600 hide-mobile text-sm">{tr.owner || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2.5 border-t border-gray-50 text-xs text-gray-400 flex justify-between">
            <span>{t('transfers.showing', { n: filtered.length, t: transfers.length })}</span>
            <span>{t('transfers.sortHint')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
