const dbName = 'prism-recorder'
const storeName = 'sessions'
// Hackathon-only convenience default. Rotate/remove this before a public release.
const demoUpload = { url: 'http://localhost:3000/api/recordings', key: '90cb37572eff73e1f4f928e00b1ab195ae03947d0ac3750157d450ef9ac65e50' }

function db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function save(session) {
  const database = await db()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(session)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
}

async function get(id) {
  const database = await db()
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function list() {
  const database = await db()
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

async function activeForTab(tabId) {
  return (await list()).find((session) => session.tabId === tabId && (session.status === 'recording' || session.status === 'starting'))
}

async function upload(session, events) {
  const { prismUpload } = await chrome.storage.local.get('prismUpload')
  const config = prismUpload?.url ? prismUpload : demoUpload
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-prism-key': config.key },
      body: JSON.stringify({ ...session, events }),
    })
    if (!response.ok) throw new Error(`Molded upload failed (${response.status})`)
    return true
  } catch (error) {
    console.error('[Molded] Upload failed:', error)
    return false
  }
}

async function finish(sessionId) {
  const session = await get(sessionId)
  if (!session || session.status === 'ready') return
  session.status = 'ready'
  session.endedAt = Date.now()
  await save(session)
  await upload(session, [])
}

async function injectRecorder(tabId, sessionId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['recorder.js'] })
  const result = await chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING', sessionId })
  if (result?.error) throw new Error(result.error)
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    if (message.type === 'START') {
      const tab = await chrome.tabs.get(message.tabId)
      const id = crypto.randomUUID()
      const session = { id, tabId: message.tabId, title: tab.title || 'Untitled recording', url: tab.url, startedAt: Date.now(), status: 'starting', events: [] }
      await save(session)
      await injectRecorder(message.tabId, id)
      session.status = 'recording'
      await save(session)
      sendResponse({ ok: true, id })
      return
    }

    if (message.type === 'STOP') {
      const session = await activeForTab(message.tabId)
      if (!session) throw new Error('No active recording was found for this tab.')
      try {
        await chrome.tabs.sendMessage(message.tabId, { type: 'STOP_RECORDING' })
      } catch {
        // Navigation can remove the injected page script. Finalize anyway so Stop is dependable.
        await finish(session.id)
      }
      // The recorder flushes first; this finalizes a navigated/slow tab as a reliable fallback.
      setTimeout(() => { void finish(session.id) }, 500)
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'STATUS') {
      sendResponse((await activeForTab(message.tabId)) || null)
      return
    }

    if (message.type === 'EVENTS') {
      const session = await get(message.sessionId)
      if (session) {
        session.events.push(...message.events)
        await save(session)
        await upload(session, message.events)
      }
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'RECORDING_STARTED') {
      const session = await get(message.sessionId)
      if (session) {
        session.title = message.title || session.title
        session.url = message.href || session.url
        session.status = 'recording'
        await save(session)
      }
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'RECORDING_STOPPED') {
      await finish(message.sessionId)
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'RECORDING_ERROR') {
      const session = await get(message.sessionId)
      if (session) {
        session.status = 'error'
        session.error = message.error
        await save(session)
      }
      sendResponse({ ok: true })
      return
    }

    if (message.type === 'LIST') { sendResponse(await list()); return }
    if (message.type === 'GET') { sendResponse(await get(message.id)); return }
    if (message.type === 'SET_CONFIG') { await chrome.storage.local.set({ prismUpload: message.config }); sendResponse({ ok: true }); return }
    if (message.type === 'GET_CONFIG') { sendResponse((await chrome.storage.local.get('prismUpload')).prismUpload || demoUpload); return }
    sendResponse({ error: 'Unknown message' })
  })().catch((error) => sendResponse({ error: String(error?.message || error) }))
  return true
})

// Reattach rrweb after a same-tab navigation, keeping the same session and Stop control.
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.status !== 'complete') return
  void activeForTab(tabId).then(async (session) => {
    if (!session) return
    try {
      await injectRecorder(tabId, session.id)
      session.title = tab.title || session.title
      session.url = tab.url || session.url
      await save(session)
    } catch { /* Chrome blocks injection on restricted pages; Stop still finalizes safely. */ }
  })
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void activeForTab(tabId).then((session) => { if (session) void finish(session.id) })
})
