import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RrwebReplay } from '../../components/RrwebReplay'
import { TooltipGuide } from '../../components/TooltipGuide'
import { demos, type Demo } from '../../lib/store'
import '../../experience-framer.css'

export const Route = createFileRoute('/studio/$id')({ component: Studio })

function Studio() {
  const { id } = Route.useParams()
  const [demo, setDemo] = useState<Demo>(() => demos.one(id))
  const [tab, setTab] = useState<'tour' | 'settings'>('tour')
  const [selectedStep, setSelectedStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [aiError, setAiError] = useState('')
  const [loading, setLoading] = useState(() => !demos.one(id).recording?.length)
  const [leads, setLeads] = useState<Array<{ id: string; name: string; company?: string; email: string; created_at: string; summary: string }>>([])
  const [shareBuyer, setShareBuyer] = useState({ name: '', company: '' })
  const [linkCopied, setLinkCopied] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publicLinkCopied, setPublicLinkCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const selected = demo.tour[selectedStep]

  useEffect(() => {
    fetch(`/api/recordings?id=${id}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.recording) return
        const recordedEvents = data.events || []
        const next = {
          ...demos.one(id),
          id,
          title: data.recording.title || 'Untitled recording',
          status: data.recording.demo_status === 'published' ? 'published' as const : 'draft' as const,
          tour: Array.isArray(data.recording.tour_json) && data.recording.tour_json.length ? data.recording.tour_json : demos.one(id).tour,
          leadCapture: data.recording.lead_capture !== false,
          recording: recordedEvents,
          events: recordedEvents.length || 0,
        }
        setDemo(next)
        demos.save(next)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetch(`/api/leads?recordingId=${id}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (Array.isArray(data?.leads)) setLeads(data.leads) })
      .catch(() => {})
  }, [id])

  async function copyPersonalLink() {
    const query = new URLSearchParams()
    if (shareBuyer.name) query.set('name', shareBuyer.name)
    if (shareBuyer.company) query.set('company', shareBuyer.company)
    const url = `${window.location.origin}/demo/${id}${query.size ? `?${query}` : ''}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 1800)
    } catch { window.prompt('Copy this personalized demo link:', url) }
  }

  const publicUrl = typeof window === 'undefined' ? `/demo/${id}` : `${window.location.origin}/demo/${id}`
  const embedCode = `<iframe src="${publicUrl}" title="${demo.title.replaceAll('"', '&quot;')} interactive demo" width="100%" height="720" frameborder="0" allow="clipboard-write"></iframe>`

  async function copyLaunchValue(value: string, kind: 'link' | 'embed') {
    try {
      await navigator.clipboard.writeText(value)
      if (kind === 'link') { setPublicLinkCopied(true); window.setTimeout(() => setPublicLinkCopied(false), 1800) }
      else { setEmbedCopied(true); window.setTimeout(() => setEmbedCopied(false), 1800) }
    } catch { window.prompt(kind === 'link' ? 'Copy your public demo link:' : 'Copy your embed snippet:', value) }
  }

  function publishDemo() {
    if (demo.status !== 'published') update({ ...demo, status: 'published' })
  }

  function update(next: Demo) {
    setDemo(next)
    demos.save(next)
    void fetch('/api/recordings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: next.id, title: next.title, status: next.status, tour: next.tour }),
    }).catch(() => {})
  }

  function updateStep(index: number, patch: Partial<Demo['tour'][number]>) {
    const tour = demo.tour.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step)
    update({ ...demo, tour })
  }

  function getReplayScroll() {
    try {
      const frame = document.querySelector<HTMLIFrameElement>('.guide-stage iframe')
      const frameWindow = frame?.contentWindow
      const scrollElement = frame?.contentDocument?.scrollingElement
      return {
        scrollX: Math.round(frameWindow?.scrollX ?? scrollElement?.scrollLeft ?? 0),
        scrollY: Math.round(frameWindow?.scrollY ?? scrollElement?.scrollTop ?? 0),
      }
    } catch {
      return { scrollX: 0, scrollY: 0 }
    }
  }

  function toggleTargetLock() {
    if (!selected) return
    updateStep(selectedStep, selected.locked ? { locked: false } : { locked: true, ...getReplayScroll() })
  }

  function addStep() {
    const tour = [
      ...demo.tour,
      {
        title: 'Guide the next click.',
        copy: 'Tell the buyer why this click matters.',
        target: 'el-project' as const,
        x: 42,
        y: 42,
        width: 20,
        height: 10,
        locked: false,
      },
    ]
    update({ ...demo, tour })
    setSelectedStep(tour.length - 1)
  }

  async function generate(key: string) {
    setGenerating(true)
    setAiError('')
    try {
      const response = await fetch('/api/generate-tour', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: demo.title, apiKey: key }),
      })
      const output = await response.json()
      if (!response.ok) throw new Error(output.error || 'Unable to generate the click path.')
      if (output.steps) {
        update({
          ...demo,
          tour: output.steps.map((step: Demo['tour'][number], index: number) => ({
            ...step,
            x: step.x ?? 28 + index * 16,
            y: step.y ?? 28 + index * 12,
            width: step.width ?? 22,
            height: step.height ?? 10,
            locked: step.locked ?? false,
          })),
        })
      }
      setApiKeyDialogOpen(false)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to generate the click path.')
    } finally {
      setGenerating(false)
    }
  }

  return <>
    <header className="studio-top">
      <Link className="brand" to="/"><i /> molded</Link>
      <span className="studio-back">‹ Demo library / <b>{demo.title}</b></span>
      <div>
        <span className="saved">● Saved</span>
        <Link className="btn secondary" to="/demo/$id" params={{ id }} search={{ name: '', company: '' }}>Preview</Link>
        <button className="btn primary" onClick={() => setPublishOpen(true)}>Publish demo <span>↗</span></button>
      </div>
    </header>

    <div className="studio">
      <aside className="editor">
        <div className="editor-title">
          <input value={demo.title} onChange={(event) => update({ ...demo, title: event.target.value })} />
          <small>{demo.status.toUpperCase()}</small>
        </div>

        <div className="tabs">
          <button className={'tab ' + (tab === 'tour' ? 'active' : '')} onClick={() => setTab('tour')}>Interactive</button>
          <button className={'tab ' + (tab === 'settings' ? 'active' : '')} onClick={() => setTab('settings')}>Settings</button>
        </div>

        {tab === 'tour' ? <>
          <p className="label">TIMELINE <span>{demo.tour.length} prompts</span></p>
          <ol className="step-list edit-timeline">
            {demo.tour.map((step, index) => <li key={index} className={selectedStep === index ? 'selected' : ''} onClick={() => setSelectedStep(index)}>
              <span>{index + 1}</span>
              <div>
                <b>{step.title}</b>
                <small>{step.locked ? 'Locked · ' : ''}{Math.round(step.x ?? 50)}%, {Math.round(step.y ?? 50)}% · {Math.round(step.width ?? 18)}×{Math.round(step.height ?? 10)}</small>
              </div>
            </li>)}
          </ol>

          <button className="add-step" onClick={addStep}>+ Add click prompt</button>

          {selected ? <div className="step-editor">
            <div className="target-lock-row">
              <p className="label">TARGET BOX</p>
              <button className={selected.locked ? 'lock-toggle locked' : 'lock-toggle'} onClick={toggleTargetLock}>
                <span aria-hidden="true">{selected.locked ? '🔒' : '🔓'}</span> {selected.locked ? 'Unlock target' : 'Lock target'}
              </button>
            </div>
            {selected.locked ? <p className="lock-note">Target and scroll are locked for this step.</p> : null}

            <label>Tooltip headline<input value={selected.title} onChange={(event) => updateStep(selectedStep, { title: event.target.value })} /></label>
            <label>Tooltip copy<input value={selected.copy} onChange={(event) => updateStep(selectedStep, { copy: event.target.value })} /></label>

          </div> : null}

          <div className="path-actions">
            <div className="ai-callout">
              <span>↗</span>
              <div>
                <b>Click path editor <small>MANUAL</small></b>
                <p>Drag the rectangle on the demo to cover the exact button or area buyers should click.</p>
              </div>
            </div>

            <button className="generate coming-soon" disabled title="Coming soon — this API-powered feature has not been tested with an API key yet.">
              ✦ AI click-path suggestions — coming soon
            </button>
            <p className="coming-soon-note">API-powered suggestions are not enabled in this demo build yet.</p>
          </div>
        </> : null}

        {tab === 'settings' ? <div className="conversion-settings">
          <div className="share-card"><p className="label">PERSONALIZED DEMO LINK</p><b>Make the invite feel one-to-one.</b><span>Add a buyer and company, then send a demo that greets them by name.</span><input placeholder="Buyer name" value={shareBuyer.name} onChange={(event) => setShareBuyer({ ...shareBuyer, name: event.target.value })} /><input placeholder="Company" value={shareBuyer.company} onChange={(event) => setShareBuyer({ ...shareBuyer, company: event.target.value })} /><button onClick={copyPersonalLink}>{linkCopied ? 'Copied link ✓' : 'Copy personalized link ↗'}</button></div>
          <div className="lead-signal"><p className="label">LIVE BUYER SIGNAL <span>{leads.length}</span></p>{leads.length ? <ul>{leads.slice(0, 3).map((lead) => <li key={lead.id}><b>{lead.name}{lead.company ? ` · ${lead.company}` : ''}</b><small>{lead.email}</small><p>{lead.summary}</p></li>)}</ul> : <div className="lead-empty"><i>✦</i><b>No buyer signals yet</b><span>When someone completes this demo and asks for the full walkthrough, their AI-ready handoff appears here.</span></div>}</div>
        </div> : null}
      </aside>

      <main className="canvas-wrap">
        <div className="canvas-toolbar">
          <span>INTERACTIVE PRODUCT SANDBOX</span>
          <Link className="watch-recording" to="/recording/$id" params={{ id }}>Watch recording ↗</Link>
        </div>

        {loading ? <div className="replay-loader" role="status">
          <i />
          <div><b>Loading your interactive demo</b><span>Preparing the captured UI for hands-on exploration...</span></div>
        </div> : <div className="guide-stage editing">
          <RrwebReplay events={demo.recording || []} mode="interactive" />
          <TooltipGuide steps={demo.tour} active={selectedStep} onSelect={setSelectedStep} onChange={(patch) => updateStep(selectedStep, patch)} editable />
        </div>}
      </main>
    </div>
    {apiKeyDialogOpen ? <div className="api-key-curtain" role="dialog" aria-modal="true" aria-labelledby="api-key-title">
      <form className="api-key-card" onSubmit={(event) => { event.preventDefault(); void generate(apiKey) }}>
        <button className="api-key-close" type="button" onClick={() => setApiKeyDialogOpen(false)} aria-label="Close">×</button>
        <span>✦</span><p>AI TOUR BUILDER</p><h2 id="api-key-title">Bring your own<br /><em>OpenAI key.</em></h2>
        <small>Used only for this browser session to generate the click path. Molded does not save it.</small>
        <label>OpenAI API key<input autoFocus required type="password" autoComplete="off" placeholder="sk-…" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
        {aiError ? <strong className="api-key-error">{aiError}</strong> : null}
        <button className="api-key-submit" disabled={generating}>{generating ? 'Generating path…' : 'Generate click path →'}</button>
      </form>
    </div> : null}
    {publishOpen ? <div className="publish-curtain" role="dialog" aria-modal="true" aria-labelledby="publish-title">
      <section className="publish-card">
        <button className="publish-close" type="button" onClick={() => setPublishOpen(false)} aria-label="Close publish panel">×</button>
        <span className="publish-icon">↗</span>
        <p className="label">READY TO LAUNCH</p>
        <h2 id="publish-title">Turn this path into a <em>live demo.</em></h2>
        <p className="publish-copy">Share it directly with buyers or embed it where intent is highest.</p>
        <label className="lead-toggle"><input type="checkbox" checked={demo.leadCapture !== false} onChange={(event) => update({ ...demo, leadCapture: event.target.checked })} /><span><b>Capture buyer details</b><small>Show the contact handoff after the final guided step.</small></span></label>
        <div className="launch-field"><label>PUBLIC DEMO LINK</label><code>{publicUrl}</code><button type="button" onClick={() => void copyLaunchValue(publicUrl, 'link')}>{publicLinkCopied ? 'Copied ✓' : 'Copy'}</button></div>
        <div className="launch-field"><label>EMBED WIDGET</label><code>{embedCode}</code><button type="button" onClick={() => void copyLaunchValue(embedCode, 'embed')}>{embedCopied ? 'Copied ✓' : 'Copy'}</button></div>
        <div className="publish-actions"><button className="publish-now" type="button" onClick={publishDemo}>{demo.status === 'published' ? 'Published ✓' : 'Publish demo'}</button><a href={publicUrl} target="_blank" rel="noreferrer">Open live demo ↗</a></div>
      </section>
    </div> : null}
  </>
}
