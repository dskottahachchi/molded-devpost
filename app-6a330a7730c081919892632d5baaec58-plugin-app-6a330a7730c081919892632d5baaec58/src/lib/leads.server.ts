import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export type CapturedLead = {
  id: string
  recording_id: string
  name: string
  company: string
  email: string
  completed_steps: number
  created_at: string
  summary: string
}

const directory = join(process.cwd(), '.data')
const file = join(directory, 'molded-leads.json')

async function all(): Promise<CapturedLead[]> {
  try { return JSON.parse(await readFile(file, 'utf8')) } catch { return [] }
}

async function save(leads: CapturedLead[]) {
  await mkdir(directory, { recursive: true })
  await writeFile(file, JSON.stringify(leads), 'utf8')
}

export async function listLocalLeads(recordingId?: string) {
  const leads = await all()
  return recordingId ? leads.filter((lead) => lead.recording_id === recordingId) : leads
}

export async function persistLocalLead(input: Omit<CapturedLead, 'id' | 'created_at' | 'summary'> & { summary?: string }) {
  const leads = await all()
  const lead: CapturedLead = {
    id: crypto.randomUUID(),
    recording_id: input.recording_id,
    name: input.name,
    company: input.company,
    email: input.email,
    completed_steps: input.completed_steps,
    created_at: new Date().toISOString(),
    summary: input.summary || `${input.name} completed the guided path and requested a follow-up.`,
  }
  leads.unshift(lead)
  await save(leads)
  return lead
}
