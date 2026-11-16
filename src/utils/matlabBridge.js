// ==========================================
// CONEXIÓN CON MATLAB (puente local en Python)
//
// El programa matlab-puente/puente_matlab.py corre en la misma computadora,
// abre MATLAB con el MATLAB Engine y escucha en http://127.0.0.1:8765.
// La web le envía el script .m y el .fis; MATLAB simula, muestra las
// gráficas, abre fuzzy y devuelve los resultados.
// ==========================================

export const BRIDGE_URL = 'http://127.0.0.1:8765'

const SIN_PUENTE = { disponible: false, conectado: false, iniciando: false, ocupado: false, matlab: '', toolbox: false, error: '' }

async function fetchWithTimeout(url, options = {}, ms = 1500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// Estado del puente: { disponible, conectado, iniciando, ocupado, matlab, toolbox, error }
export async function checkBridge() {
  try {
    const res = await fetchWithTimeout(`${BRIDGE_URL}/estado`, { cache: 'no-store' })
    if (!res.ok) return { ...SIN_PUENTE }
    const data = await res.json()
    if (data.puente !== 'graphix') return { ...SIN_PUENTE }
    return { ...SIN_PUENTE, ...data, disponible: true }
  } catch {
    return { ...SIN_PUENTE }
  }
}

// Envía el sistema a MATLAB. Devuelve { ok, resultados, etiquetas, evalfis, salida, error, ... }
export async function runInMatlab({ nombre, script, fis }) {
  let res
  try {
    // MATLAB puede tardar en abrir la primera vez: hasta 3 minutos
    res = await fetchWithTimeout(
      `${BRIDGE_URL}/simular`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, script, fis })
      },
      180000
    )
  } catch (e) {
    const msg = e?.name === 'AbortError'
      ? 'MATLAB tardó demasiado en responder.'
      : 'No se pudo conectar con el puente de MATLAB. ¿Está abierto iniciar_puente.bat?'
    return { ok: false, error: msg }
  }
  try {
    return await res.json()
  } catch {
    return { ok: false, error: `El puente respondió con un error (${res.status}).` }
  }
}
