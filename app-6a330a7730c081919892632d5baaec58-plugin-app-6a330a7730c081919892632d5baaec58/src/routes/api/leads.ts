import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { listLocalLeads, persistLocalLead } from '../../lib/leads.server'

function summaryFor(name: string, company: string, steps: number) {
  const identity = company ? `${name} at ${company}` : name
  return `${identity} completed ${steps} guided ${steps === 1 ? 'moment' : 'moments'} and asked for a follow-up. Open with the workflow they just explored, then offer a tailored live walkthrough.`
}

export const Route = createFileRoute('/api/leads')({
  server: { handlers: {
    GET: async ({ request }) => {
      const recordingId = new URL(request.url).searchParams.get('recordingId') || undefined
      const local = await listLocalLeads(recordingId)
      if (!supabase) return Response.json({ leads: local, storage: 'local' })
      try {
        let query = supabase.from('demo_leads').select('*').order('created_at', { ascending: false }).limit(40)
        if (recordingId) query = query.eq('recording_id', recordingId)
        const { data, error } = await query
        if (error) return Response.json({ leads: local, storage: 'local' })
        return Response.json({ leads: data || local, storage: 'supabase' })
      } catch { return Response.json({ leads: local, storage: 'local' }) }
    },
    POST: async ({ request }) => {
      const body = await request.json().catch(() => ({}))
      if (!body.recordingId || !body.email || !body.name) return Response.json({ error: 'name, email, and recordingId are required' }, { status: 400 })
      const completedSteps = Math.max(1, Number(body.completedSteps) || 1)
      const summary = summaryFor(body.name, body.company || '', completedSteps)
      const local = await persistLocalLead({
        recording_id: body.recordingId,
        name: body.name,
        company: body.company || '',
        email: body.email,
        completed_steps: completedSteps,
        summary,
      })
      if (supabase) {
        try {
          const { data, error } = await supabase.from('demo_leads').insert({
            recording_id: body.recordingId,
            name: body.name,
            company: body.company || null,
            email: body.email,
            completed_steps: completedSteps,
            summary,
          }).select().single()
          if (!error && data) return Response.json({ lead: data, storage: 'supabase' })
        } catch { /* local capture remains available */ }
      }
      return Response.json({ lead: local, storage: 'local-mirror' })
    },
  } },
})
