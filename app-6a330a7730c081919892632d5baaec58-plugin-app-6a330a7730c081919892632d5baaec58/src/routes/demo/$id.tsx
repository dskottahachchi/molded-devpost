import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { RrwebReplay } from '../../components/RrwebReplay'
import { TooltipGuide } from '../../components/TooltipGuide'
import { demos } from '../../lib/store'
import '../../experience-framer.css'

export const Route = createFileRoute('/demo/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === 'string' ? search.name.slice(0, 80) : '',
    company: typeof search.company === 'string' ? search.company.slice(0, 80) : '',
  }),
  component: PublicDemo,
})

function PublicDemo() {
  const { id } = Route.useParams()
  const share = Route.useSearch()
  const saved = demos.one(id)
  const [title, setTitle] = useState(saved.title)
  const [events, setEvents] = useState<unknown[]>(saved.recording || [])
  const [tour, setTour] = useState(saved.tour)
  const [complete, setComplete] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [leadCapture, setLeadCapture] = useState(saved.leadCapture !== false)
  const [submitting, setSubmitting] = useState(false)
  const [signal, setSignal] = useState('')
  const [buyer, setBuyer] = useState(() => ({ name: share.name, company: share.company, email: '' }))
  useEffect(() => {
    fetch(`/api/recordings?id=${id}`).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.recording) {
        setTitle(data.recording.title || title)
        setEvents(data.events || [])
        setLeadCapture(data.recording.lead_capture !== false)
        if (Array.isArray(data.recording.tour_json) && data.recording.tour_json.length) setTour(data.recording.tour_json)
      }
    }).catch(() => {})
  }, [id])
  useEffect(() => setTour(demos.one(id).tour), [id])
  async function captureLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recordingId: id, ...buyer, completedSteps: tour.length }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save your details')
      setSignal(data.lead?.summary || 'Your tailored follow-up is on its way.')
      setSubmitted(true)
    } catch {
      setSignal('We could not save that just yet. Please try again.')
    } finally { setSubmitting(false) }
  }

  return <div className="public-body">
    <div className="public-bar"><Link className="brand" to="/"><i /> molded</Link><span>Guided interactive demo</span><button onClick={() => location.reload()}>↻ Restart path</button></div>
    <main className="public-wrap">
      <section className="public-intro"><p className="kicker">{buyer.company ? `A PERSONAL WALKTHROUGH FOR ${buyer.company.toUpperCase()}` : 'EXPLORE THE PRODUCT'}</p><h1>{buyer.name ? `Welcome, ${buyer.name}.` : title}<br /><em>in action.</em></h1><p>Follow the guided moments, try the real product, then take the next step when it clicks.</p></section>
      <div className="guide-stage public-guide-stage">
        <RrwebReplay events={events} mode="interactive" />
        <TooltipGuide steps={tour} onComplete={() => setComplete(true)} />
        {complete ? <div className="lead-curtain">
          <section className="lead-card">
            <button className="lead-close" type="button" onClick={() => setComplete(false)} aria-label="Close form">×</button>
            {!leadCapture ? <><span className="lead-icon">✦</span><p className="kicker">PATH COMPLETE</p><h2>You found the <em>aha moment.</em></h2><p>Thanks for exploring this interactive product demo.</p><button onClick={() => setComplete(false)}>Keep exploring →</button></> : submitted ? <><span className="lead-icon">✦</span><p className="kicker">YOUR SIGNAL IS CAPTURED</p><h2>That&apos;s the <em>aha moment.</em></h2><p>{signal}</p><button onClick={() => setComplete(false)}>Keep exploring →</button></> : <><span className="lead-icon">↗</span><p className="kicker">MAKE THE NEXT MOVE</p><h2>Want this tailored<br />for <em>your team?</em></h2><p>Leave your details and get the complete workflow, plus the right next step for your team.</p><form onSubmit={captureLead}><input required placeholder="Your name" value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} /><input placeholder="Company" value={buyer.company} onChange={(event) => setBuyer({ ...buyer, company: event.target.value })} /><input required type="email" placeholder="Work email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} /><button disabled={submitting}>{submitting ? 'Capturing your signal...' : 'Send me the full walkthrough →'}</button></form><small>No spam. Just a useful next step.</small></>}
          </section>
        </div> : null}
      </div>
    </main>
  </div>
}
