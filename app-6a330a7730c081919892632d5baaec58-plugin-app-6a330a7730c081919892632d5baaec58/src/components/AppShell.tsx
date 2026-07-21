import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import '../app-framer.css'
import '../dashboard-cleanup.css'

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="shell">
    <aside className="sidebar">
      <Link className="brand" to="/"><i /> molded</Link>
      <p className="workspace-label">WORKSPACE</p>
      <Link className="nav" activeProps={{ className: 'nav active' }} to="/dashboard"><span>▦</span> <span>Demo library</span></Link>
      <Link className="nav" activeProps={{ className: 'nav active' }} to="/signals"><span>⌁</span> <span>Buyer signals</span></Link>
      <div className="side-bottom"><button className="usage">✦ 7 / 10 demos</button><div className="profile"><b>JM</b><span>Jamie Moore<small>Acme Inc.</small></span><em>•••</em></div></div>
    </aside>{children}
  </div>
}
