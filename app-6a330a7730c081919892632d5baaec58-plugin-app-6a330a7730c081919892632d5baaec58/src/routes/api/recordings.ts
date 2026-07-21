import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { deleteLocalRecordingsByDemoStatus, getLocalRecording, listLocalRecordings, persistLocalRecording, updateLocalRecordingDemo } from '../../lib/recordings.server'

function authorized(request: Request) {
  const required = process.env.EXTENSION_INGEST_KEY
  return !required || request.headers.get('x-prism-key') === required
}

function dashboardShape(recording: Awaited<ReturnType<typeof listLocalRecordings>>[number]) {
  const { events, ...details } = recording
  return { ...details, recording_event_batches: [{ events }] }
}

function demoPayload(body: any) {
  return {
    title: typeof body.title === 'string' ? body.title : undefined,
    demoStatus: body.status === 'published' ? 'published' as const : body.status === 'draft' ? 'draft' as const : undefined,
    tour: Array.isArray(body.tour) ? body.tour : undefined,
    leadCapture: typeof body.leadCapture === 'boolean' ? body.leadCapture : undefined,
  }
}

async function localResponse(id?: string) {
  if (id) {
    const recording = await getLocalRecording(id)
    return Response.json({ recording, events: recording?.events || [], storage: 'local' })
  }
  return Response.json({ recordings: (await listLocalRecordings()).map(dashboardShape), storage: 'local' })
}

export const Route = createFileRoute('/api/recordings')({
  server: { handlers: {
    GET: async ({ request }) => {
      const id = new URL(request.url).searchParams.get('id') || undefined
      if (!supabase) return localResponse(id)
      try {
        if (id) {
          const localRecording = await getLocalRecording(id)
          const [{ data: remoteRecording, error: recordingError }, { data: batches, error: batchError }] = await Promise.all([
            supabase.from('recordings').select('*').eq('id', id).single(),
            supabase.from('recording_event_batches').select('events').eq('recording_id', id).order('id'),
          ])
          if (localRecording) return Response.json({ recording: localRecording, events: localRecording.events, storage: 'local-mirror' })
          if (recordingError || batchError) return localResponse(id)
          const events = batches?.flatMap((batch) => batch.events) || []
          if (remoteRecording) await persistLocalRecording({ id: remoteRecording.id, title: remoteRecording.title, url: remoteRecording.source_url, status: remoteRecording.status, demoStatus: remoteRecording.demo_status || 'draft', startedAt: Date.parse(remoteRecording.started_at), endedAt: remoteRecording.ended_at ? Date.parse(remoteRecording.ended_at) : undefined, events, tour: remoteRecording.tour_json || [] })
          return Response.json({ recording: remoteRecording, events, storage: 'supabase' })
        }
        const localRecordings = await listLocalRecordings()
        const { data: remote, error } = await supabase.from('recordings').select('*, recording_event_batches(events)').order('created_at', { ascending: false }).limit(30)
        if (error) return localResponse()
        const localById = new Map(localRecordings.map((recording) => [recording.id, dashboardShape(recording)]))
        for (const recording of remote || []) {
          if (!localById.has(recording.id)) {
            const events = recording.recording_event_batches?.flatMap((batch: { events: unknown[] }) => batch.events) || []
            await persistLocalRecording({ id: recording.id, title: recording.title, url: recording.source_url, status: recording.status, demoStatus: recording.demo_status || 'draft', startedAt: Date.parse(recording.started_at), endedAt: recording.ended_at ? Date.parse(recording.ended_at) : undefined, events, tour: recording.tour_json || [] })
            localById.set(recording.id, recording)
          }
        }
        return Response.json({ recordings: [...localById.values()], storage: 'local-mirror+supabase' })
      } catch { return localResponse(id) }
    },
    POST: async ({ request }) => {
      if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
      const body = await request.json()
      if (!body.id || !Array.isArray(body.events)) return Response.json({ error: 'id and events are required' }, { status: 400 })

      // Always retain a local copy first. It keeps a hackathon demo reliable when the cloud database is briefly unavailable.
      await persistLocalRecording(body)
      if (supabase) {
        try {
          const { error: upsertError } = await supabase.from('recordings').upsert({ id: body.id, title: body.title || 'Untitled recording', source_url: body.url, status: body.status || 'recording', started_at: new Date(body.startedAt || Date.now()).toISOString(), ended_at: body.endedAt ? new Date(body.endedAt).toISOString() : null })
          if (!upsertError && body.events.length) await supabase.from('recording_event_batches').insert({ recording_id: body.id, events: body.events })
        } catch { /* local mirror is already safely saved */ }
      }
      return Response.json({ ok: true, storage: 'local-mirror' })
    },
    PATCH: async ({ request }) => {
      const body = await request.json().catch(() => ({}))
      if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 })
      const patch = demoPayload(body)
      const local = await updateLocalRecordingDemo({ id: body.id, ...patch })
      if (supabase) {
        try {
          const update: Record<string, unknown> = {}
          if (patch.title) update.title = patch.title
          if (patch.demoStatus) update.demo_status = patch.demoStatus
          if (patch.tour) update.tour_json = patch.tour
          if (Object.keys(update).length) await supabase.from('recordings').update(update).eq('id', body.id)
        } catch { /* local mirror is still saved */ }
      }
      return Response.json({ ok: true, recording: local, storage: supabase ? 'local-mirror+supabase' : 'local' })
    },
    DELETE: async ({ request }) => {
      const demoStatus = new URL(request.url).searchParams.get('demoStatus')
      if (demoStatus !== 'draft' && demoStatus !== 'published') return Response.json({ error: 'demoStatus must be draft or published' }, { status: 400 })
      const removed = await deleteLocalRecordingsByDemoStatus(demoStatus)
      if (supabase) {
        try {
          const { data: remote } = await supabase.from('recordings').select('id').eq('demo_status', demoStatus)
          const ids = remote?.map((recording) => recording.id) || []
          if (ids.length) {
            await supabase.from('recording_event_batches').delete().in('recording_id', ids)
            await supabase.from('recordings').delete().in('id', ids)
          }
        } catch { /* local data was still cleared */ }
      }
      return Response.json({ ok: true, removed, storage: supabase ? 'local-mirror+supabase' : 'local' })
    },
  } },
})
