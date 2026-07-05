const BASE = import.meta.env.VITE_API_URL || ''

export function apiUrl(path: string) {
  return `${BASE}${path}`
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(apiUrl(url), options)
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
  return resp.json()
}
