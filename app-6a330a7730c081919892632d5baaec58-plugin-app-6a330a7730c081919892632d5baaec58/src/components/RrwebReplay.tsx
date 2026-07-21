import { useEffect, useRef, useState } from 'react'
import '@rrweb/replay/dist/style.css'

type RrwebEvent = { type?: number; data?: unknown }

function resetInteractiveStart(event: unknown) {
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

export function RrwebReplay({ events, mode = 'interactive', allowInteract = true }: { events: unknown[]; mode?: 'interactive' | 'watch'; allowInteract?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!root.current || !events.length) return
    let cancelled = false
    let observer: ResizeObserver | undefined
    let replayer: any
    import('@rrweb/replay').then(({ Replayer }) => {
      if (cancelled || !root.current) return
      try {
        root.current.innerHTML = ''
        replayer = new Replayer(events as any, { root: root.current, showWarning: false, skipInactive: true })
        const fitToCanvas = () => {
          const canvas = root.current
          const frame = canvas?.querySelector('iframe')
          const wrapper = canvas?.querySelector<HTMLElement>('.replayer-wrapper')
          const width = Number(frame?.getAttribute('width'))
          const height = Number(frame?.getAttribute('height'))
          if (!canvas || !wrapper || !width || !height) return
          wrapper.style.zoom = String(Math.min(canvas.clientWidth / width, canvas.clientHeight / height))
        }
        replayer.on('fullsnapshot-rebuilded', () => requestAnimationFrame(fitToCanvas))
        observer = new ResizeObserver(fitToCanvas)
        observer.observe(root.current)
        if (mode === 'interactive') {
          const snapshotEvents = events.filter((event) => {
            const type = (event as RrwebEvent)?.type
            return type === 4 || type === 2
          }).map(resetInteractiveStart)
          for (const event of snapshotEvents) replayer.getCastFn(event, true)()
          replayer.pause()
          if (allowInteract) replayer.enableInteract()
          else replayer.disableInteract()
          requestAnimationFrame(fitToCanvas)
        } else {
          replayer.play()
        }
      } catch {
        setError('This recording could not be replayed. Capture a fresh session with Molded Recorder.')
      }
    })
    return () => { cancelled = true; observer?.disconnect(); replayer?.pause?.() }
  }, [events, mode, allowInteract])

  if (!events.length) return <div className="replay-empty">No rrweb events are attached to this demo yet.</div>
  return <div className={`replay-shell ${mode === 'interactive' ? 'is-interactive' : 'is-watch'}`}><div ref={root} />{error && <p>{error}</p>}</div>
}
