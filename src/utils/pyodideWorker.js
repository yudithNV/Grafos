// ==========================================
// PYTHON EN EL NAVEGADOR (Pyodide) — Web Worker
//
// Corre en segundo plano para que la página no se congele mientras Python
// se descarga o simula. Carga Pyodide, numpy, matplotlib y scikit-fuzzy, y
// ejecuta public/python/fuzzy_engine.py.
// ==========================================

let pyodide = null
let loading = null

const post = (msg) => self.postMessage(msg)

async function init({ indexURL, baseURL }) {
  post({ type: 'status', stage: 'Descargando Python (Pyodide)…' })
  const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)
  const py = await loadPyodide({ indexURL })

  post({ type: 'status', stage: 'Cargando numpy y matplotlib…' })
  await py.loadPackage(['numpy', 'matplotlib', 'micropip'])

  post({ type: 'status', stage: 'Instalando scikit-fuzzy…' })
  const micropip = py.pyimport('micropip')
  // La librería va incluida en la web (public/python), así no depende de PyPI
  await micropip.install(`${baseURL}python/scikit_fuzzy-0.5.0-py2.py3-none-any.whl`)

  post({ type: 'status', stage: 'Preparando el motor difuso…' })
  const res = await fetch(`${baseURL}python/fuzzy_engine.py`, { cache: 'no-cache' })
  if (!res.ok) throw new Error('No se encontró python/fuzzy_engine.py')
  py.FS.writeFile('/home/pyodide/fuzzy_engine.py', await res.text())
  py.runPython('import sys\nif "/home/pyodide" not in sys.path: sys.path.insert(0, "/home/pyodide")\nimport fuzzy_engine')
  const info = py.runPython('import json\njson.dumps(fuzzy_engine.version())')
  pyodide = py
  return JSON.parse(info)
}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      loading = loading || init(data)
      const info = await loading
      post({ type: 'ready', info })
    } catch (e) {
      loading = null
      post({ type: 'error', error: String(e?.message || e) })
    }
    return
  }

  // Llamadas al motor: simular (con imágenes), superficie y punto (visor de reglas)
  if (data.type === 'call') {
    const FUNCIONES = { simular: 'simular_json', superficie: 'superficie_json', punto: 'punto_json' }
    const fn = FUNCIONES[data.fn]
    try {
      if (!fn) throw new Error('función no permitida')
      if (!pyodide) await loading
      pyodide.globals.set('graphix_pedido', JSON.stringify(data.payload))
      const out = pyodide.runPython(`fuzzy_engine.${fn}(graphix_pedido)`)
      post({ type: 'result', id: data.id, result: JSON.parse(out) })
    } catch (e) {
      post({ type: 'result', id: data.id, result: { ok: false, error: `Error en Python: ${e?.message || e}` } })
    }
  }
}
