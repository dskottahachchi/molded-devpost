export type Step = { title: string; copy: string; target: 'el-revenue' | 'el-activation' | 'el-project'; x?: number; y?: number; width?: number; height?: number; locked?: boolean; scrollX?: number; scrollY?: number }
export type Demo = { id: string; title: string; status: 'draft' | 'published'; plays: number; created: string; events: number; tour: Step[]; recording?: unknown[]; leadCapture?: boolean; captureStatus?: string }

const key = 'prism-demos-v2'
const legacyTemplateIds = new Set(['northstar', 'growth'])
const legacyTemplateTitles = new Set([
  'Product workspace tour',
  'Q3 Growth launch',
  'Devpost - The home for hackathons',
  'Molded — Interactive demos',
])

function isTemplate(demo: Demo) {
  return legacyTemplateIds.has(demo.id) || legacyTemplateTitles.has(demo.title)
}

function load(): Demo[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]') as Demo[]
    const real = saved.filter((demo) => !isTemplate(demo))
    if (real.length !== saved.length) localStorage.setItem(key, JSON.stringify(real))
    return real
  } catch { return [] }
}

const starterTour: Step[] = [
  { title: 'Start with the whole picture.', copy: 'Click here first to understand what this screen is trying to show you.', target: 'el-revenue', x: 28, y: 24, width: 18, height: 9 },
  { title: 'Reveal the proof.', copy: 'Now try this part. This is where the product value starts to become obvious.', target: 'el-activation', x: 52, y: 42, width: 20, height: 10 },
  { title: 'Invite the next action.', copy: 'Finish by clicking the workflow that turns interest into momentum.', target: 'el-project', x: 66, y: 62, width: 22, height: 11 },
]

export const demos = {
  all: (): Demo[] => load(),
  isTemplate,
  one: (id: string) => load().find((demo) => demo.id === id) || { id, title: 'Untitled recording', status: 'draft' as const, plays: 0, created: 'Just now', events: 0, tour: starterTour },
  save: (demo: Demo) => {
    const all = load(), index = all.findIndex((item) => item.id === demo.id)
    if (index < 0) all.unshift(demo); else all[index] = demo
    localStorage.setItem(key, JSON.stringify(all))
    return demo
  },
  replace: (next: Demo[]) => {
    const real = next.filter((demo) => !isTemplate(demo))
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(real))
    return real
  },
  new: (title: string, events: number): Demo => ({ id: `demo-${Date.now().toString(36)}`, title, status: 'draft', plays: 0, created: 'Just now', events, tour: starterTour }),
}
