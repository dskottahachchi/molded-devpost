import { Link, createFileRoute } from '@tanstack/react-router'
import '../landing.css'
import '../landing-framer.css'
import '../landing-final.css'
import '../landing-workflow-visuals.css'

export const Route = createFileRoute('/landing')({ component: Landing })

export function Landing() {
  return <div className="landing-page">
    <header className="landing-nav">
      <Link className="brand" to="/"><i /> molded</Link>
      <nav><a href="#how-it-works">How it works</a></nav>
      <Link className="landing-dashboard-link" to="/dashboard">Dashboard <span>↗</span></Link>
    </header>

    <main>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><i /> THE DEMO BEFORE THE DEMO</p>
          <h1>Let buyers<br /><em>feel</em> your product.</h1>
          <p className="landing-lede">Molded turns real product sessions into guided, interactive experiences that move high-intent prospects from curious to convinced.</p>
          <div className="landing-actions"><Link className="landing-primary" to="/dashboard">Explore the dashboard <span>↗</span></Link></div>
          <div className="landing-proof"><span><b>Real product</b><small>sessions, not a mock</small></span><span><b>No signup wall</b><small>buyers start instantly</small></span><span><b>Intent captured</b><small>every path becomes a signal</small></span></div>
        </div>
        <div className="landing-hero-art">
          <div className="landing-glow" />
          <div className="landing-window"><div className="window-top"><span><i /><i /><i /></span><small>molded / live signal</small><b>● Recording</b></div><div className="window-body"><aside><strong>n</strong><i className="active" /><i /><i /><i /></aside><section><small>ACME INC. / OVERVIEW</small><h3>Good morning, Jamie <em>✦</em></h3><div className="window-metrics"><b><small>ACTIVE REVENUE</small>$48,230</b><b><small>ACTIVATION</small>74.8%</b><b><small>ON TRACK</small>92%</b></div><div className="window-list"><small>PRIORITY PROJECTS</small><p><i /> Website refresh <span>75%</span></p><p><i /> Q3 Growth launch <span>42%</span></p></div></section></div><div className="landing-spotlight"><span>✦ MOLDED GUIDE</span><b>Start with the whole picture.</b><small>Click here to see the moment that matters.</small><button>Next →</button></div></div><div className="landing-signal"><small>LIVE BUYER SIGNAL</small><b>12<span>×</span></b><p>more likely to convert<br />after a hands-on demo</p></div><div className="landing-chip">● AI path generated</div></div>
      </section>

      <section className="landing-product-demo"><div className="landing-demo-copy"><p className="landing-eyebrow"><i /> THE PRODUCT, IN THE PRODUCT</p><h2>We use Molded<br /><em>to sell Molded.</em></h2><p>The dashboard below is the real Molded workspace embedded as a live widget. Explore it, open a demo, and see exactly what your prospects experience.</p><Link className="landing-secondary" to="/dashboard">Open the full workspace <span>↗</span></Link></div><div className="landing-embed-shell"><div className="embed-callout"><span>THIS IS THE REAL<br />INTERACTIVE DEMO WIDGET</span><i>↘</i></div><div className="embed-toolbar"><span><i /><i /><i /></span><b>molded.app / live workspace</b><em>LIVE PRODUCT WIDGET</em></div><div className="embed-viewport"><iframe src="/dashboard" title="Live Molded product dashboard" loading="lazy" /></div><div className="embed-caption"><span><i /> This is Molded, using Molded</span><small>Click inside to explore the real product</small></div></div></section>

      <section className="landing-marquee"><span>RECORD ONCE</span><i>✦</i><span>GUIDE WITH AI</span><i>✦</i><span>CAPTURE INTENT</span><i>✦</i><span>TURN CLICKS INTO CONVERSATIONS</span><i>✦</i></section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-workflow-head"><div><p className="landing-eyebrow"><i /> FROM PRODUCT TAB TO PIPELINE</p><h2>Launch a demo<br /><em>buyers can actually use.</em></h2></div><p>Four deliberate moves turn your live product into an embedded, lead-capturing experience.</p></div>
        <div className="landing-steps">
          <article><div className="step-top"><b>01</b><i>↓</i></div><small>CHROME</small><h3>Install the extension.</h3><p>Download Molded Recorder once and add it to Chrome in under a minute.</p><div className="step-visual visual-extension"><span>✦</span><b>Molded Recorder</b><i>Ready to capture</i></div></article>
          <article><div className="step-top"><b>02</b><i>●</i></div><small>RECORD</small><h3>Record your product tab.</h3><p>Open the exact workflow you want to sell, then start and stop a real rrweb capture.</p><div className="step-visual visual-record"><span /><span /><span /><b>● Recording</b></div></article>
          <article><div className="step-top"><b>03</b><i>✦</i></div><small>STUDIO</small><h3>Shape the guided path.</h3><p>Drop spotlight targets, write the prompts, and tune every click in the interactive demo.</p><div className="step-visual visual-studio"><span /><span /><span /><b>Click target</b></div></article>
          <article><div className="step-top"><b>04</b><i>↗</i></div><small>EMBED</small><h3>Copy the widget. Go live.</h3><p>Publish your demo, copy one embed snippet, and put it where your best prospects land.</p><div className="step-visual visual-embed"><code>&lt;MoldedDemo /&gt;</code><span>LIVE</span></div></article>
        </div>
        <div className="workflow-note"><i>✦</i><span>Every live demo starts with your real product—not a scripted mockup.</span><b>Chrome extension → Studio → your website</b></div>
      </section>

    </main>
  </div>
}
