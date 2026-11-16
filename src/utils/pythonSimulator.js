// ==========================================
// SIMULADOR EN PYTHON (scikit-fuzzy) DENTRO DEL NAVEGADOR
//
// Usa Pyodide (Python compilado a WebAssembly): no hay que instalar nada.
// La primera vez descarga Python, numpy, matplotlib y scikit-fuzzy
// (unos 50 MB); después el navegador lo guarda en caché.
// El motor está en public/python/fuzzy_engine.py.
// ==========================================

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_URL = import.meta.env.VITE_PYODIDE_URL || `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

let worker = null
let nextId = 1
const pending = new Map()
const listeners = new Set()

// Estado compartido: { stage: 'idle' | 'loading' | 'ready' | 'error', detail, info, error }
let status = { stage: 'idle', detail: '', info: null, error: '' }

function setStatus(patch) {
  status = { ...status, ...patch }
  listeners.forEach((fn) => fn(status))
}

export function onPythonStatus(fn) {
  listeners.add(fn)
  fn(status)
  return () => listeners.delete(fn)
}

export function getPythonStatus() {
  return status
}

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./pyodideWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    if (data.type === 'status') setStatus({ stage: 'loading', detail: data.stage })
    else if (data.type === 'ready') setStatus({ stage: 'ready', detail: '', info: data.info, error: '' })
    else if (data.type === 'error') setStatus({ stage: 'error', detail: '', error: data.error })
    else if (data.type === 'result') {
      const resolve = pending.get(data.id)
      pending.delete(data.id)
      resolve?.(data.result)
    }
  }
  worker.onerror = (e) => {
    setStatus({ stage: 'error', error: e?.message || 'No se pudo iniciar Python en el navegador' })
    pending.forEach((resolve) => resolve({ ok: false, error: 'Python se detuvo inesperadamente.' }))
    pending.clear()
    worker = null
  }
  return worker
}

// Descarga y prepara Python (solo la primera vez). Devuelve el estado final.
export function loadPython() {
  if (status.stage === 'ready') return Promise.resolve(status)
  return new Promise((resolve) => {
    const off = onPythonStatus((s) => {
      if (s.stage === 'ready' || s.stage === 'error') {
        queueMicrotask(() => off())
        resolve(s)
      }
    })
    if (status.stage !== 'loading') {
      setStatus({ stage: 'loading', detail: 'Iniciando Python…', error: '' })
      const baseURL = new URL(import.meta.env.BASE_URL || '/', window.location.href).href
      getWorker().postMessage({ type: 'init', indexURL: PYODIDE_URL, baseURL })
    }
  })
}

async function callPython(fn, payload) {
  const s = await loadPython()
  if (s.stage !== 'ready') {
    return { ok: false, error: `No se pudo cargar Python: ${s.error || 'error desconocido'}. Revisa tu conexión a internet.` }
  }
  const id = nextId++
  return new Promise((resolve) => {
    pending.set(id, resolve)
    // Copia simple (sin los objetos reactivos de Vue, que no se pueden enviar al worker)
    getWorker().postMessage({ type: 'call', fn, id, payload: JSON.parse(JSON.stringify(payload)) })
  })
}

// Simula en Python. Devuelve { ok, resultados, etiquetas, graficas, superficie, salida, motor, error }
export const simulateInPython = (payload) => callPython('simular', payload)

// Solo la superficie 3D (al cambiar ejes o escenario)
export const surfaceInPython = (payload) => callPython('superficie', payload)

// Un punto con todo el detalle, para el visor de reglas interactivo
export const pointInPython = (payload) => callPython('punto', payload)
