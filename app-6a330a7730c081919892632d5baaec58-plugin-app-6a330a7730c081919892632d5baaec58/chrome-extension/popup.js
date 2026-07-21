let tab, recording = false
const $ = (selector) => document.querySelector(selector)
const msg = (message) => new Promise((resolve) => chrome.runtime.sendMessage(message, resolve))
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))

function setRecordingState(active) {
  recording = active
  $('#toggle').innerHTML = active
    ? '<span class="record-dot">■</span> Stop & save recording <em>→</em>'
    : '<span class="record-dot">●</span> Start recording <em>→</em>'
  $('#toggle').classList.toggle('stop', active)
  $('#state').innerHTML = active
    ? '<span></span><b>Recording this tab</b><small>Click Stop & save when you are finished.</small>'
    : '<span></span><b>Ready to capture</b><small>Record a real product workflow with rrweb.</small>'
}

async function load() {
  const sessions = await msg({ type: 'LIST' }) || []
  $('#sessions').innerHTML = sessions.sort((a, b) => b.startedAt - a.startedAt).slice(0, 8).map((session) => `<li><b>${escapeHtml(session.title)}</b><small>${session.status === 'recording' ? '● Recording': session.events.length + ' events'}</small><button data-id="${session.id}">Export</button></li>`).join('') || '<li class="empty">No recordings yet.</li>'
  document.querySelectorAll('[data-id]').forEach((button) => button.onclick = async () => {
    const session = await msg({ type: 'GET', id: button.dataset.id })
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = `molded-${session.id}.json`; link.click(); URL.revokeObjectURL(url)
  })
}

async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  $('#site').textContent = tab?.url?.startsWith('http') ? new URL(tab.url).hostname : 'This tab cannot be captured'
  $('#toggle').disabled = !tab?.url?.startsWith('http')
  const activeSession = await msg({ type: 'STATUS', tabId: tab?.id })
  setRecordingState(Boolean(activeSession))
  await load()
}

$('#toggle').onclick = async () => {
  if (!recording) {
    const result = await msg({ type: 'START', tabId: tab.id })
    if (result?.error) return alert(result.error)
    setRecordingState(true)
  } else {
    const result = await msg({ type: 'STOP', tabId: tab.id })
    if (result?.error) return alert(result.error)
    setRecordingState(false)
    setTimeout(load, 300)
  }
}

$('#refresh').onclick = load
init()
