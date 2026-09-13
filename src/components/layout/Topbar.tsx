import { useLayoutEffect, useRef, useState } from 'react'
import { Bell, HelpCircle, Menu, Search } from 'lucide-react'

type GlassMaps = { context: string; search: string; actions: string }

// A neutral center and outward-facing edge normals refract the backdrop like a lens.
function createCapsuleDisplacementMap(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d')
  if (!context) return ''

  const image = context.createImageData(canvas.width, canvas.height)
  const radius = Math.min(canvas.width, canvas.height) / 2
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const capX = Math.min(Math.max(x + .5, radius), canvas.width - radius)
      const dx = x + .5 - capX
      const dy = y + .5 - canvas.height / 2
      const distance = Math.hypot(dx, dy)
      const edge = Math.max(0, Math.min(1, 1 - (radius - distance) / 13)) ** 2
      const offset = (y * canvas.width + x) * 4
      image.data[offset] = 128 + (distance ? dx / distance : 0) * edge * 55
      image.data[offset + 1] = 128 + (distance ? dy / distance : 0) * edge * 65
      image.data[offset + 2] = 128
      image.data[offset + 3] = 255
    }
  }
  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

function GlassFilter({ id, map }: { id: string; map: string }) {
  return <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
    <feImage href={map} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale="-6" xChannelSelector="R" yChannelSelector="G" result="red-shift" />
    <feColorMatrix in="red-shift" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale="-7" xChannelSelector="R" yChannelSelector="G" result="green-shift" />
    <feColorMatrix in="green-shift" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale="-8" xChannelSelector="R" yChannelSelector="G" result="blue-shift" />
    <feColorMatrix in="blue-shift" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
    <feBlend in="red" in2="green" mode="screen" result="red-green" />
    <feBlend in="red-green" in2="blue" mode="screen" result="refracted" />
    <feGaussianBlur in="refracted" stdDeviation=".65" />
  </filter>
}

export function Topbar({ openMenu, menuOpen }: { openMenu: () => void; menuOpen: boolean }) {
  const headerRef = useRef<HTMLElement>(null)
  const [maps, setMaps] = useState<GlassMaps>({ context: '', search: '', actions: '' })

  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return
    const islands = {
      context: header.querySelector<HTMLElement>('.topbar-context'),
      search: header.querySelector<HTMLElement>('.global-search'),
      actions: header.querySelector<HTMLElement>('.top-actions'),
    }
    const { context, search, actions } = islands
    if (!context || !search || !actions) return
    const islandElements = [context, search, actions]

    let lastSizes = ''
    const updateMaps = () => {
      const sizes = islandElements.map(island => {
        const bounds = island.getBoundingClientRect()
        return [Math.round(bounds.width), Math.round(bounds.height)] as const
      })
      const key = sizes.map(([width, height]) => `${width}x${height}`).join('|')
      if (key === lastSizes) return
      lastSizes = key
      setMaps({
        context: createCapsuleDisplacementMap(...sizes[0]),
        search: createCapsuleDisplacementMap(...sizes[1]),
        actions: createCapsuleDisplacementMap(...sizes[2]),
      })
    }
    updateMaps()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateMaps)
    islandElements.forEach(island => observer.observe(island))
    return () => observer.disconnect()
  }, [])

  return <header ref={headerRef} className="topbar" data-glass-ready={maps.context && maps.search && maps.actions ? '' : undefined}>
    <svg className="topbar-glass-filters" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {maps.context && <GlassFilter id="topbar-glass-context" map={maps.context} />}
        {maps.search && <GlassFilter id="topbar-glass-search" map={maps.search} />}
        {maps.actions && <GlassFilter id="topbar-glass-actions" map={maps.actions} />}
      </defs>
    </svg>
    <div className="topbar-island topbar-context">
      <button className="menu-button" onClick={openMenu} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="app-sidebar"><Menu size={20} /></button>
      <div className="project-context"><span className="context-dot" /><strong>Aky Alimentos</strong><small>Projeto em preparação</small></div>
    </div>
    <label className="global-search"><Search size={16} /><input aria-label="Busca global" placeholder="Buscar no projeto" /><kbd>⌘ K</kbd></label>
    <div className="topbar-island top-actions"><button aria-label="Ajuda"><HelpCircle size={18} /></button><button aria-label="Notificações" className="has-notification"><Bell size={18} /></button><span className="environment">PROTO</span></div>
  </header>
}
