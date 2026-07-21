import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { demos } from '../lib/store'
import '../signals.css'

type Lead = {
  id: string
  name: string
  company?: string
  email: string
  created_at: string
  completed_steps?: number
  summary?: string
  recording_id?: string
}

export const Route = createFileRoute('/signals')({ component: BuyerSignals })

function BuyerSignals() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leads')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setLeads(Array.isArray(data?.leads) ? data.leads : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const demoNames = useMemo(() => new Map(demos.all().map((demo) => [demo.id, demo.title])), [])
  const meetingsReady = leads.filter((lead) => (lead.completed_steps || 0) >= 2).length

  return <AppShell><main className="signals-main">
    <header className="signals-header">
      <div><p className="kicker">BUYER SIGNALS</p><h1>Know who&apos;s leaning in.</h1><p>Every completed interactive path becomes a warm, actionable conversation.</p></div>
      <div className="signal-live"><i /> Live intent feed</div>
    </header>

    <section className="signals-stats">
      <article><small>NEW SIGNALS</small><b>{loading ? '…' : leads.length}</b><span>Captured from live demos</span></article>
      <article><small>MEETING-READY</small><b>{loading ? '…' : meetingsReady}</b><span>Completed key product moments</span></article>
      <article><small>FASTEST FOLLOW-UP</small><b>Now</b><span>Reply while intent is fresh</span></article>
    </section>

    <section className="signal-feed">
      <div className="signal-feed-head"><div><h2>Live buyer activity</h2><p>Prioritize people who experienced the product, not just the pitch.</p></div><span>{loading ? 'Syncing…' : `${leads.length} signals`}</span></div>
      {loading ? <div className="signals-loading"><i /><b>Loading buyer signals</b></div> : leads.length ? <div className="signal-list">{leads.map((lead) => <article key={lead.id}>
        <div className="signal-avatar">{lead.name.slice(0, 1).toUpperCase()}</div>
        <div className="signal-person"><b>{lead.name}{lead.company ? ` · ${lead.company}` : ''}</b><span>{lead.email}</span><p>{lead.summary || 'Completed an interactive product walkthrough.'}</p></div>
        <div className="signal-context"><span>{lead.recording_id ? demoNames.get(lead.recording_id) || 'Interactive demo' : 'Interactive demo'}</span><small>{lead.completed_steps || 0} moments explored · {new Date(lead.created_at).toLocaleString()}</small></div>
      </article>)}</div> : <div className="signals-empty"><i>✦</i><h3>Your buyer signals will appear here.</h3><p>When someone completes a guided demo and requests a follow-up, Molded turns that moment into a sales-ready handoff.</p></div>}
    </section>
  </main></AppShell>
}
