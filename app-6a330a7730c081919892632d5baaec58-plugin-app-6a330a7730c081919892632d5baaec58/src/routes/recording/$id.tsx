import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RrwebReplay } from '../../components/RrwebReplay'
import { demos, type Demo } from '../../lib/store'
import '../../experience-framer.css'

export const Route = createFileRoute('/recording/$id')({ component: RecordingPage })

function RecordingPage() {
  const { id } = Route.useParams()
  const [demo, setDemo] = useState<Demo>(() => demos.one(id))
  const [loading, setLoading] = useState(() => !demos.one(id).recording?.length)

  useEffect(() => {
    fetch(`/api/recordings?id=${id}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.recording) return
        const next = {
          ...demos.one(id),
          id,
          title: data.recording.title || 'Untitled recording',
          recording: data.events || [],
          events: data.events?.length || 0,
        }
        setDemo(next)
        demos.save(next)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return <>
    <header className="studio-top">
      <Link className="brand" to="/"><i /> molded</Link>
      <span className="studio-back">‹ Demo library / <b>{demo.title}</b> / Recording</span>
      <div>
        <Link className="btn secondary" to="/studio/$id" params={{ id }}>Interactive mode</Link>
        <button className="btn primary" onClick={() => location.reload()}>Restart <span>↻</span></button>
      </div>
    </header>
    <main className="recording-page">
      <div className="canvas-toolbar">
        <span>AUTHENTIC SESSION RECORDING</span>
        <span>{loading ? 'LOADING...' : `${demo.recording?.length || 0} EVENTS · RRWEB PLAYBACK`}</span>
      </div>
      {loading ? <div className="replay-loader" role="status"><i /><div><b>Loading recording</b><span>Rebuilding the captured browser timeline...</span></div></div> : <RrwebReplay events={demo.recording || []} mode="watch" />}
    </main>
  </>
}
