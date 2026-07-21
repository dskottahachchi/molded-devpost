import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import type { Step } from '../lib/store'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getFrameScroll(frame: HTMLIFrameElement | null) {
  try {
    const frameWindow = frame?.contentWindow
    const scrollElement = frame?.contentDocument?.scrollingElement
    return {
      x: frameWindow?.scrollX ?? scrollElement?.scrollLeft ?? 0,
      y: frameWindow?.scrollY ?? scrollElement?.scrollTop ?? 0,
    }
  } catch {
    return { x: 0, y: 0 }
  }
}

function setFrameScroll(frame: HTMLIFrameElement | null, x: number, y: number) {
  try {
    const frameWindow = frame?.contentWindow
    const scrollElement = frame?.contentDocument?.scrollingElement
    frameWindow?.scrollTo(x, y)
    if (scrollElement) {
      scrollElement.scrollLeft = x
      scrollElement.scrollTop = y
    }
  } catch {}
}

export function TooltipGuide({ steps, active, onSelect, onChange, onComplete, editable = false }: { steps: Step[]; active?: number; onSelect?: (index: number) => void; onChange?: (step: Partial<Step>) => void; onComplete?: () => void; editable?: boolean }) {
  const [current, setCurrent] = useState(0)
  const index = active ?? current
  const step = steps[index] || steps[0]
  const baseBox = useMemo(() => ({ x: step?.x ?? 50, y: step?.y ?? 50, width: step?.width ?? 18, height: step?.height ?? 10 }), [step?.x, step?.y, step?.width, step?.height])
  const [draftBox, setDraftBox] = useState(baseBox)
  const [layer, setLayer] = useState<React.CSSProperties>({})
  const frame = useRef<number | null>(null)
  const pending = useRef(baseBox)
  const guideRef = useRef<HTMLDivElement>(null)
  const dragStarted = useRef(false)

  useEffect(() => {
    setDraftBox(baseBox)
    pending.current = baseBox
  }, [baseBox])

  useEffect(() => {
    let raf = 0
    let observer: ResizeObserver | undefined
    let mutationObserver: MutationObserver | undefined
    let observedWrapper: HTMLElement | null = null

    const measure = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const stage = guideRef.current?.closest('.guide-stage') as HTMLElement | null
        const wrapper = stage?.querySelector<HTMLElement>('.replayer-wrapper')
        if (observer && wrapper && wrapper !== observedWrapper) {
          if (observedWrapper) observer.unobserve(observedWrapper)
          observer.observe(wrapper)
          observedWrapper = wrapper
        }
        if (!stage || !wrapper) {
          setLayer({})
          return
        }
        const stageRect = stage.getBoundingClientRect()
        const wrapperRect = wrapper.getBoundingClientRect()
        setLayer({
          left: wrapperRect.left - stageRect.left,
          top: wrapperRect.top - stageRect.top,
          width: wrapperRect.width,
          height: wrapperRect.height,
        })
      })
    }

    measure()
    const stage = guideRef.current?.closest('.guide-stage') as HTMLElement | null
    if (stage) {
      observer = new ResizeObserver(measure)
      observer.observe(stage)
      mutationObserver = new MutationObserver(measure)
      mutationObserver.observe(stage, { childList: true, subtree: true })
    }
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const timers = [120, 350, 800].map((time) => window.setTimeout(measure, time))

    return () => {
      if (raf) cancelAnimationFrame(raf)
      observer?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      timers.forEach(clearTimeout)
    }
  }, [steps.length, active])

  useEffect(() => {
    if (!step?.locked || typeof step.scrollX !== 'number' || typeof step.scrollY !== 'number') return

    const lockedScrollX = step.scrollX
    const lockedScrollY = step.scrollY
    let raf = 0
    let mutationObserver: MutationObserver | undefined
    let cleanupFrame: (() => void) | undefined
    let activeFrame: HTMLIFrameElement | null = null

    const install = () => {
      const stage = guideRef.current?.closest('.guide-stage') as HTMLElement | null
      const frame = stage?.querySelector<HTMLIFrameElement>('.replayer-wrapper iframe, iframe') || null
      if (!frame || frame === activeFrame) return

      cleanupFrame?.()
      activeFrame = frame

      const snap = () => {
        const current = getFrameScroll(frame)
        if (Math.abs(current.x - lockedScrollX) > 1 || Math.abs(current.y - lockedScrollY) > 1) {
          setFrameScroll(frame, lockedScrollX, lockedScrollY)
        }
      }
      const scheduleSnap = () => {
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(snap)
      }
      const preventScroll = (event: Event) => {
        event.preventDefault()
        scheduleSnap()
      }
      const preventKeys = (event: KeyboardEvent) => {
        if ([' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          scheduleSnap()
        }
      }

      const frameWindow = frame.contentWindow
      const frameDocument = frame.contentDocument
      frameWindow?.addEventListener('scroll', scheduleSnap, { passive: true })
      frameDocument?.addEventListener('wheel', preventScroll, { passive: false, capture: true })
      frameDocument?.addEventListener('touchmove', preventScroll, { passive: false, capture: true })
      frameDocument?.addEventListener('keydown', preventKeys, true)
      setFrameScroll(frame, lockedScrollX, lockedScrollY)

      cleanupFrame = () => {
        frameWindow?.removeEventListener('scroll', scheduleSnap)
        frameDocument?.removeEventListener('wheel', preventScroll, { capture: true })
        frameDocument?.removeEventListener('touchmove', preventScroll, { capture: true })
        frameDocument?.removeEventListener('keydown', preventKeys, true)
      }
    }

    install()
    const stage = guideRef.current?.closest('.guide-stage') as HTMLElement | null
    if (stage) {
      mutationObserver = new MutationObserver(install)
      mutationObserver.observe(stage, { childList: true, subtree: true })
    }
    const timers = [60, 180, 420, 900].map((time) => window.setTimeout(() => {
      install()
      if (activeFrame) setFrameScroll(activeFrame, lockedScrollX, lockedScrollY)
    }, time))

    return () => {
      if (raf) cancelAnimationFrame(raf)
      cleanupFrame?.()
      mutationObserver?.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [index, step?.locked, step?.scrollX, step?.scrollY])

  if (!step) return null
  const { x, y, width, height } = draftBox

  function next() {
    if (index === steps.length - 1 && onComplete) {
      onComplete()
      return
    }
    const nextIndex = (index + 1) % steps.length
    if (onSelect) onSelect(nextIndex)
    else setCurrent(nextIndex)
  }
  function forwardClickToReplay(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (editable && dragStarted.current) {
      dragStarted.current = false
      return
    }
    try {
      const stage = guideRef.current?.closest('.guide-stage') as HTMLElement | null
      const frame = stage?.querySelector<HTMLIFrameElement>('.replayer-wrapper iframe, iframe') || null
      const documentElement = frame?.contentDocument?.documentElement
      const frameWindow = frame?.contentWindow
      if (frame && frame.contentDocument && documentElement && frameWindow) {
        const frameRect = frame.getBoundingClientRect()
        const scaleX = documentElement.clientWidth / frameRect.width
        const scaleY = documentElement.clientHeight / frameRect.height
        const clientX = (event.clientX - frameRect.left) * scaleX
        const clientY = (event.clientY - frameRect.top) * scaleY
        const target = frame.contentDocument.elementFromPoint(clientX, clientY)
        for (const type of ['mousedown', 'mouseup', 'click']) {
          target?.dispatchEvent(new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            view: frameWindow,
          }))
        }
      }
    } catch {}
    window.setTimeout(next, 120)
  }
  function startMove(event: React.PointerEvent<HTMLElement>, mode: 'move' | 'resize') {
    if (!editable || !onChange || step.locked) return
    event.preventDefault()
    event.stopPropagation()
    const layerRect = event.currentTarget.closest('.tooltip-guide')?.getBoundingClientRect()
    if (!layerRect) return
    const startX = event.clientX
    const startY = event.clientY
    const start = { x, y, width, height }
    dragStarted.current = false
    const move = (pointer: PointerEvent) => {
      if (Math.abs(pointer.clientX - startX) > 3 || Math.abs(pointer.clientY - startY) > 3) dragStarted.current = true
      const dx = ((pointer.clientX - startX) / layerRect.width) * 100
      const dy = ((pointer.clientY - startY) / layerRect.height) * 100
      pending.current = mode === 'move'
        ? { ...start, x: clamp(start.x + dx, 0, 100 - start.width), y: clamp(start.y + dy, 0, 100 - start.height) }
        : { ...start, width: clamp(start.width + dx, 6, 100 - start.x), height: clamp(start.height + dy, 5, 100 - start.y) }
      if (frame.current === null) {
        frame.current = requestAnimationFrame(() => {
          setDraftBox(pending.current)
          frame.current = null
        })
      }
    }
    const up = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      setDraftBox(pending.current)
      onChange(pending.current)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return <div ref={guideRef} className="tooltip-guide" style={layer}>
    <button className={'click-target ' + (editable ? 'editable' : '') + (step.locked ? ' locked' : '')} style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }} onPointerDown={editable ? (event) => startMove(event, 'move') : undefined} onClick={forwardClickToReplay} aria-label={step.title} tabIndex={editable ? 0 : -1}>
      <span>{step.locked ? 'Locked target' : editable ? 'Drag target' : 'Click target'}</span>
      {editable && !step.locked ? <i onPointerDown={(event) => startMove(event, 'resize')} /> : null}
    </button>
    <aside className="command-bar">
      <div className="command-prompt">
        <b>Mission {index + 1} / {steps.length}</b>
        <h3>{step.title}</h3>
        <p>{step.copy}</p>
      </div>
      <div className="command-progress" aria-hidden="true">
        {steps.map((_, stepIndex) => <i key={stepIndex} className={stepIndex === index ? 'active' : ''} />)}
      </div>
      <button onClick={next}>{index === steps.length - 1 && onComplete ? 'Unlock your plan' : index === steps.length - 1 ? 'Replay mission' : 'Next move'} <span>↵</span></button>
    </aside>
  </div>
}
