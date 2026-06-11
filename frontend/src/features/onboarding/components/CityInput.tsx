import { useState, useRef, useEffect } from 'react'

interface Suggestion {
  name: string
  detail: string // country + region for disambiguation
}

interface Props {
  value: string
  onChange: (city: string, validated: boolean) => void
  error?: string
}

let debounceTimer: ReturnType<typeof setTimeout>

async function fetchCities(query: string): Promise<Suggestion[]> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&addressdetails=1&limit=7&featuretype=city`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'ru,en', 'User-Agent': 'UpWayApp/1.0' },
  })
  const data = await res.json()

  const seen = new Set<string>()
  const results: Suggestion[] = []

  for (const item of data) {
    const addr = item.address ?? {}
    const city =
      addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? item.display_name.split(',')[0]
    const country = addr.country ?? ''
    const state   = addr.state ?? addr.region ?? ''

    if (!city || seen.has(city.toLowerCase())) continue
    seen.add(city.toLowerCase())

    results.push({
      name: city,
      detail: [state, country].filter(Boolean).join(', '),
    })
  }
  return results
}

export function CityInput({ value, onChange, error }: Props) {
  const [query, setQuery]           = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen]             = useState(false)
  const [loading, setLoading]       = useState(false)
  const [validated, setValidated]   = useState(!!value) // pre-filled value is considered valid
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    setValidated(false)
    onChange(q, false)
    setSuggestions([])

    clearTimeout(debounceTimer)
    if (q.trim().length < 2) { setOpen(false); return }

    debounceTimer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await fetchCities(q)
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const select = (s: Suggestion) => {
    setQuery(s.name)
    setValidated(true)
    onChange(s.name, true)
    setSuggestions([])
    setOpen(false)
  }

  const borderCls = error
    ? 'border-danger focus:border-danger'
    : validated && query
      ? 'border-accent'
      : 'border-border focus:border-accent'

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Минск"
          maxLength={80}
          className={`w-full h-11 px-3.5 bg-surface2 border rounded-btn text-sm text-text focus:outline-none transition-colors ${borderCls}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto scrollbar-thin">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(s) }}
                className="w-full flex flex-col items-start px-3.5 py-2.5 hover:bg-surface2 transition-colors text-left"
              >
                <span className="text-[13.5px] font-medium text-text">{s.name}</span>
                {s.detail && (
                  <span className="text-[11px] text-text-3">{s.detail}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-danger text-[11.5px] mt-1">{error}</p>}
      {!validated && query.length >= 2 && !error && !loading && (
        <p className="text-text-3 text-[11px] mt-1">Выберите город из списка</p>
      )}
    </div>
  )
}
