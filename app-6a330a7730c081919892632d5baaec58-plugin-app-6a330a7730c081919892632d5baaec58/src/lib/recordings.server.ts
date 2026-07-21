import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export type LocalRecording = {
  id: string
  title: string
  source_url?: string
  status: string
  demo_status?: 'draft' | 'published'
  started_at: string
  ended_at?: string | null
  created_at: string
  events: unknown[]
  tour_json?: unknown[]
  lead_capture?: boolean
}

const directory = join(process.cwd(), '.data')
const file = join(directory, 'molded-recordings.json')

async function all(): Promise<LocalRecording[]> {
  try { return JSON.parse(await readFile(file, 'utf8')) } catch { return [] }
}

async function save(recordings: LocalRecording[]) {
  await mkdir(directory, { recursive: true })
  await writeFile(file, JSON.stringify(recordings), 'utf8')
}

export async function listLocalRecordings() { return all() }

export async function getLocalRecording(id: string) {
  return (await all()).find((recording) => recording.id === id) ?? null
}

export async function persistLocalRecording(input: {
  id: string; title?: string; url?: string; status?: string; startedAt?: number; endedAt?: number; events: unknown[]; tour?: unknown[]; demoStatus?: 'draft' | 'published'; leadCapture?: boolean
}) {
  const recordings = await all()
  const existing = recordings.find((recording) => recording.id === input.id)
  const now = new Date().toISOString()
  const recording: LocalRecording = existing ?? {
    id: input.id, title: input.title || 'Untitled recording', status: input.status || 'recording',
    started_at: new Date(input.startedAt || Date.now()).toISOString(), created_at: now, events: [],
  }
  recording.title = input.title || recording.title
  recording.source_url = input.url || recording.source_url
  recording.status = input.status || recording.status
  recording.demo_status = input.demoStatus || recording.demo_status || 'draft'
  recording.ended_at = input.endedAt ? new Date(input.endedAt).toISOString() : recording.ended_at
  if (input.tour) recording.tour_json = input.tour
  if (typeof input.leadCapture === 'boolean') recording.lead_capture = input.leadCapture
  recording.events.push(...input.events)
  if (existing) Object.assign(existing, recording); else recordings.unshift(recording)
  await save(recordings)
  return recording
}

export async function updateLocalRecordingDemo(input: {
  id: string; title?: string; demoStatus?: 'draft' | 'published'; tour?: unknown[]; leadCapture?: boolean
}) {
  const recordings = await all()
  const recording = recordings.find((item) => item.id === input.id)
  if (!recording) return null
  if (input.title) recording.title = input.title
  if (input.demoStatus) recording.demo_status = input.demoStatus
  if (input.tour) recording.tour_json = input.tour
  if (typeof input.leadCapture === 'boolean') recording.lead_capture = input.leadCapture
  await save(recordings)
  return recording
}

export async function deleteLocalRecordingsByDemoStatus(status: 'draft' | 'published') {
  const recordings = await all()
  const remaining = recordings.filter((recording) => (recording.demo_status || 'draft') !== status)
  await save(remaining)
  return recordings.length - remaining.length
}
