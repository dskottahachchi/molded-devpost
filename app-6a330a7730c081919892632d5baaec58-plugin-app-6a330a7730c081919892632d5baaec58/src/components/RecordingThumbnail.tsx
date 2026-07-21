import { useEffect, useRef, useState } from 'react'

type RrwebEvent = { type?: number; data?: unknown }

function resetPreviewStart(event: unknown) {
  const typed = event as RrwebEvent & { data?: { initialOffset?: { left?: number; top?: number } } }
  if (typed.type !== 2) return event
  return {
    ...typed,
    data: {
      ...typed.data,
      initialOffset: { left: 0, top: 0 },
    },
  }
}

export function RecordingThumbnail({ events }: { events: unknown[] }) {
  const root = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    if (!root.current || !events.length) return
    const hasSnapshot = events.some((event) => (event as RrwebEvent)?.type === 2)
    if (!hasSnapshot) return
    let cancelled = false
    let observer: ResizeObserver | undefined
    let player: any
    import('@rrweb/replay').then(({ Replayer }) => {
      if (cancelled || !root.current) return
      try {
        root.current.innerHTML = ''
        player = new Replayer(events as any, { root: root.current, showWarning: false, showDebug: false, skipInactive: true })
        const fitPreview = () => {
          const canvas = root.current
          const frame = canvas?.querySelector('iframe')
          const wrapper = canvas?.querySelector<HTMLElement>('.replayer-wrapper')
          const width = Number(frame?.getAttribute('width'))
          const height = Number(frame?.getAttribute('height'))
          if (!canvas || !wrapper || !width || !height) return
          // Cover the whole card; the overflow is cropped rather than leaving a coloured letterbox.
          wrapper.style.zoom = String(Math.max(canvas.clientWidth / width, canvas.clientHeight / height))
        }
        player.on('fullsnapshot-rebuilded', () => requestAnimationFrame(() => {
          fitPreview()
          setReady(true)
        }))
        observer = new ResizeObserver(fitPreview)
        observer.observe(root.current)
        const snapshotEvents = events.filter((event) => {
          const type = (event as RrwebEvent)?.type
          return type === 4 || type === 2
        }).map(resetPreviewStart)
        for (const event of snapshotEvents) player.getCastFn(event, true)()
        player.pause()
        // rrweb creates its iframe from metadata before it has painted the page.
        if (snapshotEvents.some((event) => (event as RrwebEvent).type === 2)) {
          requestAnimationFrame(() => {
            fitPreview()
            setReady(true)
          })
        }
      } catch { if (root.current) root.current.innerHTML = '' }
    })
    return () => { cancelled = true; observer?.disconnect(); player?.pause?.() }
  }, [events])

  return <div className={'recording-thumb ' + (ready ? 'is-ready' : 'is-cover')}>
    <div className="thumbnail-mount" ref={root} />
    {!ready ? <div className="thumbnail-cover"><span>✦ AUTHENTIC CAPTURE</span><b>Session ready to shape.</b><small>Open the Studio to build the guided path.</small></div> : null}
  </div>
}
