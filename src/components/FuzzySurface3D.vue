<template>
  <div class="surface-wrap">
    <div class="surface-box">
      <div ref="plotEl" class="surface-plot" role="img" :aria-label="ariaLabel"></div>
      <button type="button" class="surface-reset" @click="resetView" title="Volver a la vista inicial">↺ Restablecer vista</button>
    </div>
    <p v-if="error" class="surface-error">{{ error }}</p>
    <p class="surface-hint">
      Arrastra para girar · rueda del mouse para acercar · pasa el mouse sobre la superficie para ver los valores.
      Los puntos son los escenarios (cada uno con sus propios valores en las demás entradas)
      <template v-if="data?.fijas?.length">
        · {{ data.fijas.map((f) => `${f.nombre} = ${fmt(f.valor)}`).join(', ') }}
      </template>
    </p>
  </div>
</template>

<script setup>
// Superficie 3D interactiva (Plotly). Los datos (malla x, y, z) los calcula Python.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  data: { type: Object, default: null }, // { x, y, z, nombres: [x, y, z], puntos: [{ nombre, x, y, z }], fijas }
  colors: { type: Array, default: () => ['#4f46e5', '#0f9d6e', '#db2777'] }
})

const plotEl = ref(null)
const error = ref('')
const CAMARA = { x: -1.6, y: -1.6, z: 1.0 }
let Plotly = null
let themeObserver = null

const fmt = (n) => (Number.isFinite(n) ? Number(n.toFixed(3)).toString() : '—')
const ariaLabel = computed(() =>
  props.data ? `Superficie 3D de ${props.data.nombres[2]} según ${props.data.nombres[0]} y ${props.data.nombres[1]}` : 'Superficie 3D'
)

function themeColors() {
  const css = getComputedStyle(document.documentElement)
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback
  return { text: v('--text-primary', '#1e1b33'), grid: v('--border-color', '#e4ddfa') }
}

async function draw() {
  if (!props.data || !plotEl.value) return
  try {
    if (!Plotly) Plotly = (await import('plotly.js-dist-min')).default
  } catch {
    error.value = 'No se pudo cargar el visor 3D.'
    return
  }
  const d = props.data
  const t = themeColors()
  const axis = (title) => ({
    title: { text: title, font: { color: t.text, size: 12 } },
    color: t.text, gridcolor: t.grid, zerolinecolor: t.grid, backgroundcolor: 'rgba(0,0,0,0)', showbackground: true
  })
  const traces = [
    {
      type: 'surface',
      x: d.x, y: d.y, z: d.z,
      colorscale: 'Viridis',
      opacity: 0.97,
      contours: { z: { show: true, usecolormap: true, project: { z: true }, width: 1 } },
      colorbar: { title: { text: d.nombres[2], side: 'right', font: { color: t.text } }, tickfont: { color: t.text }, len: 0.78, y: 0.44, thickness: 14 },
      hovertemplate: `${d.nombres[0]}: %{x:.3f}<br>${d.nombres[1]}: %{y:.3f}<br>${d.nombres[2]}: %{z:.4f}<extra></extra>`,
      name: d.nombres[2]
    },
    ...d.puntos.map((p, k) => ({
      type: 'scatter3d',
      mode: 'markers',
      x: [p.x], y: [p.y], z: [p.z],
      name: p.nombre,
      marker: { size: 6, color: props.colors[k % props.colors.length], line: { color: '#ffffff', width: 1.5 } },
      hovertemplate: `${p.nombre}<br>${d.nombres[0]}: %{x:.3f}<br>${d.nombres[1]}: %{y:.3f}<br>${d.nombres[2]}: %{z:.4f}<extra></extra>`
    }))
  ]
  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 0, r: 0, t: 10, b: 0 },
    font: { color: t.text, family: 'Inter, "Segoe UI", Arial, sans-serif', size: 12 },
    legend: { orientation: 'h', x: 0.02, y: 1.02, font: { color: t.text } },
    scene: {
      xaxis: axis(d.nombres[0]),
      yaxis: axis(d.nombres[1]),
      zaxis: axis(d.nombres[2]),
      camera: { eye: { ...CAMARA } },
      aspectmode: 'cube'
    },
    uirevision: d.nombres.join('|') // conserva el giro mientras no cambien los ejes
  }
  error.value = ''
  await Plotly.react(plotEl.value, traces, layout, { responsive: true, displaylogo: false, displayModeBar: false, scrollZoom: true })
}

function resetView() {
  if (Plotly && plotEl.value) Plotly.relayout(plotEl.value, { 'scene.camera': { eye: { ...CAMARA }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } } })
}

watch(() => props.data, draw)
onMounted(() => {
  draw()
  // Redibujar con los colores del tema si se cambia entre claro y oscuro
  themeObserver = new MutationObserver(draw)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onBeforeUnmount(() => {
  themeObserver?.disconnect()
  if (Plotly && plotEl.value) Plotly.purge(plotEl.value)
})
</script>

<style scoped>
.surface-wrap { margin-top: 0.75rem; }
.surface-plot {
  width: 100%;
  height: 520px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface-2, transparent);
}
.surface-box { position: relative; }
.surface-reset {
  position: absolute; top: 8px; right: 10px;
  border: 1px solid var(--border-color); background: var(--bg-surface, rgba(255, 255, 255, 0.85)); color: var(--text-primary);
  font: inherit; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 999px; cursor: pointer;
}
.surface-reset:hover { border-color: #2563eb; color: #2563eb; }
.surface-reset:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.surface-hint { margin: 0.45rem 0 0; font-size: 0.75rem; color: var(--text-secondary); }
.surface-error { margin: 0.5rem 0 0; color: #dc2626; font-size: 0.85rem; }
@media (max-width: 700px) { .surface-plot { height: 380px; } }
</style>
