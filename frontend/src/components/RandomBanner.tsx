import { useState } from 'react'

const BANNERS = [
  'cole_1', 'cole_2', 'cole_3',
  'general_1', 'general_2',
  'invierno_1',
  'navidad_1',
  'primavera_1',
  'san_valentin_1',
  'verano_1', 'verano_2', 'verano_3', 'verano_4',
]

export default function RandomBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [banner] = useState(() => BANNERS[Math.floor(Math.random() * BANNERS.length)])

  if (dismissed) return null

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-1 sm:pt-2">
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white text-xs transition-colors"
          aria-label="Cerrar banner"
        >
          ✕
        </button>
        <picture>
          <source media="(max-width: 768px)" srcSet={`/banners/optimized/${banner}-mobile.webp`} />
          <source media="(max-width: 1280px)" srcSet={`/banners/optimized/${banner}-tablet.webp`} />
          <img
            src={`/banners/optimized/${banner}-desktop.webp`}
            alt="Banner promocional de Hattrick2Shopping"
            className="w-full max-h-40 sm:max-h-64 md:max-h-[32rem] object-cover"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>
    </div>
  )
}
