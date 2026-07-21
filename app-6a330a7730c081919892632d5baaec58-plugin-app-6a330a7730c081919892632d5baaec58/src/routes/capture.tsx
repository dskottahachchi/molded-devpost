import { Link, createFileRoute } from '@tanstack/react-router'
import '../app-framer.css'
import '../capture-focused.css'

export const Route = createFileRoute('/capture')({ component: Capture })

function Capture() {
  return <main className="capture-focus">
    <Link className="capture-back" to="/dashboard"><span>←</span> Back to dashboard</Link>
    <section className="capture-setup">
      <div className="capture-setup-copy"><p className="extension-eyebrow"><i /> FIRST-TIME SETUP</p><h1>Install the Chrome<br />extension.</h1><p>Set up Molded Recorder once, then capture any product tab directly from Chrome.</p><a className="capture-download" href="/Molded-Recorder.zip" download>Download Molded Recorder <span>↓</span></a></div>
      <ol><li><b>1</b><span>Download and unzip <strong>Molded-Recorder.zip</strong>.</span></li><li><b>2</b><span>Open <strong>chrome://extensions</strong> and turn on Developer mode.</span></li><li><b>3</b><span>Choose <strong>Load unpacked</strong>, then select the unzipped folder.</span></li></ol>
    </section>
  </main>
}
