import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { RecordingThumbnail } from '../components/RecordingThumbnail'
import { demos, type Demo } from '../lib/store'
import { Landing } from './landing'
import '../dashboard-capture.css'

export const Route = createFileRoute('/')({ component: Landing })

export function Dashboard() {
  const [list, setList] = useState<Demo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const loadRecordings = () => fetch('/api/recordings')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active || !data?.recordings) return
        const cloud = data.recordings.map((recording: any): Demo => {
          const events = recording.recording_event_batches?.flatMap((batch: any) => batch.events) || []
          return {
            id: recording.id,
            title: recording.title || 'Untitled recording',
            status: recording.demo_status === 'published' ? 'published' : 'draft',
            plays: 0,
            created: 'Captured session',
            events: events.length,
            tour: Array.isArray(recording.tour_json) ? recording.tour_json : [],
            recording: events,
            captureStatus: recording.status,
          }
        })
        const realCloud = cloud.filter((recording: Demo) => !demos.isTemplate(recording))
        demos.replace(realCloud)
        setList((previous) => {
          const nextCloud = realCloud.map((recording: Demo) => {
            const current = previous.find((item) => item.id === recording.id)
            // Preserve the existing event array once a card is stable. Replacing it on every
            // poll restarts rrweb's thumbnail renderer and leaves the card in a loading loop.
            const unchanged = current
              && current.events === recording.events
              && current.captureStatus === recording.captureStatus
              && current.title === recording.title
              && current.status === recording.status
            return unchanged ? current : recording
          })
          return nextCloud
        })
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    void loadRecordings()
    const refresh = window.setInterval(() => void loadRecordings(), 1500)
    return () => { active = false; window.clearInterval(refresh) }
  }, [])

  return <AppShell><main className="main">
    <header className="topbar"><div><p className="kicker">DEMO LIBRARY</p><h1>Good morning, Jamie.</h1></div><div className="top-actions"><Link className="btn primary" to="/capture">+ New capture</Link></div></header>
    <section className="stat-grid"><article><small>TOTAL PLAYS</small><b>2,486</b><span className="up">↑ 18.2%</span></article><article><small>COMPLETION RATE</small><b>68.4%</b><span className="up">↑ 4.1%</span></article><article><small>MEETINGS INFLUENCED</small><b>47</b><span className="up">↑ 12.8%</span></article></section>
    <section className="section-head"><div><h2>Your demos</h2><p>Interactive experiences your prospects can explore.</p></div><div className="filters"><button className="filter active">All demos <b>{loading ? '…' : list.length}</b></button><button className="filter">Published</button><button className="filter">Drafts</button></div></section>
    {list.length ? <section className="demo-grid">{list.map((demo, index) => {
      return <article className="demo-card" key={demo.id}>
        <Link to="/studio/$id" params={{ id: demo.id }} className={'card-shot shot-' + index % 3}><RecordingThumbnail events={demo.recording || []} /><em>● {demo.status === 'published' ? 'Live' : 'Draft'}</em></Link>
        <div className="card-info"><div><h3>{demo.title}</h3><p>{demo.events} captured events · {demo.created}</p></div></div>
        <footer><span>{demo.status === 'published' ? `◉ ${demo.plays.toLocaleString()} plays` : 'Ready to shape'}</span><Link to="/studio/$id" params={{ id: demo.id }}>{demo.status === 'published' ? 'Open ↗' : 'Continue →'}</Link></footer>
      </article>
    })}</section> : <div className="recordings-empty"><b>✦</b><h3>Your recordings will appear here</h3><p>Use Molded Recorder on any product tab, then stop the capture to sync it here.</p></div>}
  </main></AppShell>
}
