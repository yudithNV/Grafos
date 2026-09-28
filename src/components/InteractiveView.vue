<template>
  <main class="interactive-view">
    <CanvasBackground />
    <div class="interactive-shell">
      <header class="page-header">
        <span class="eyebrow">LABORATORIO VISUAL</span>
        <h1 class="interactive-title">Algoritmos Interactivos</h1>
        <p>Elige una pizarra, construye tu grafo y observa cómo cada algoritmo transforma el problema en una solución.</p>
      </header>

      <div class="lab-badge-wrapper">
        <div class="lab-badge">
          <MousePointer2 :size="18" /> 4 pizarras disponibles
        </div>
      </div>

      <div class="workspace-layout">
        <aside class="filters">
          <span>EXPLORA POR TIPO</span>
          <button class="filter-active">Todas las pizarras</button>
          <button>Recorridos</button>
          <button>Caminos mínimos</button>
          <button>Optimización</button>
          <div class="tip">
            <Lightbulb :size="17" />
            <p>Empieza con la pizarra de grafos para familiarizarte con nodos y aristas.</p>
          </div>
        </aside>

        <section class="workspace-main">
          <div class="workspace-heading">
            <div>
              <h2>Pizarras disponibles</h2>
              <p>Selecciona una para comenzar</p>
            </div>
            <span class="result-count">4 experiencias</span>
          </div>

          <AlgorithmCarousel @select="$emit('select', $event)" />

          <div class="how-it-works">
            <strong>¿Cómo funciona?</strong>
            <span>1. Elige una pizarra</span>
            <ArrowRight :size="14" />
            <span>2. Diseña tu grafo</span>
            <ArrowRight :size="14" />
            <span>3. Ejecuta el algoritmo</span>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ArrowRight, Lightbulb, MousePointer2 } from '@lucide/vue'
import AlgorithmCarousel from './AlgorithmCarousel.vue'
import CanvasBackground from './CanvasBackground.vue'
defineEmits(['select'])
</script>

<style scoped>
/* ============ BASE ============ */
.interactive-view {
  position: relative;
  min-height: calc(100vh - 64px);
  background: var(--bg-body);
  color: var(--text-primary);
  overflow: hidden;
}
.interactive-shell {
  position: relative;
  z-index: 1;
  width: min(100% - 2rem, 1160px);
  margin: auto;
  padding: 8rem 0 5rem;
}

/* ============ HEADER ============ */
.page-header {
  margin-bottom: 1.5rem;
  text-align: center;
}
.page-header .eyebrow {
  display: block;
  text-align: left;   /* eyebrow pegado al borde izquierdo de la shell */
  margin-bottom: .5rem;
}
.eyebrow {
  color: var(--accent-solid);
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .14em;
}

/* ============ TÍTULO CON GLOW ============ */
.interactive-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -.05em;
  line-height: 1.05;
  margin: .8rem 0 1rem;
  overflow-wrap: anywhere;
  transition: color 0.3s ease, filter 0.3s ease;
}

[data-theme='dark'] .interactive-title {
  color: #ffffff;
  filter:
    drop-shadow(0 0 6px  rgba(255, 255, 255, 0.45))
    drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
    drop-shadow(0 0 34px rgba(168, 85, 247, 0.25));
}

[data-theme='light'] .interactive-title {
  background: linear-gradient(135deg, #7c3aed, #a855f7, #d946ef);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter:
    drop-shadow(0 0 8px  rgba(168, 85, 247, 0.30))
    drop-shadow(0 0 20px rgba(168, 85, 247, 0.18))
    drop-shadow(0 0 38px rgba(217, 70, 239, 0.12));
}

.page-header p {
  max-width: 650px;
  margin: 0 auto;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ============ BADGE CENTRADO ============ */
.lab-badge-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}
.lab-badge,
.result-count {
  padding: .65rem .85rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: .78rem;
  white-space: nowrap;
}
.lab-badge {
  display: flex;
  align-items: center;
  gap: .4rem;
}
.lab-badge svg {
  color: var(--accent-solid);
}

/* ============ LAYOUT ============ */
.workspace-layout {
  display: grid;
  grid-template-columns: minmax(150px, 190px) minmax(0, 1fr);
  gap: clamp(1.5rem, 5vw, 3rem);
}
.workspace-main {
  min-width: 0;
}

/* ============ FILTROS ============ */
.filters {
  display: grid;
  align-content: start;
  gap: .55rem;
}
.filters > span {
  color: var(--text-secondary);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .12em;
  margin-bottom: .4rem;
}
.filters button {
  padding: .65rem .75rem;
  text-align: left;
  border: 0;
  border-radius: .55rem;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: .82rem;
  cursor: pointer;
}
.filters button:hover,
.filters .filter-active {
  background: var(--accent-soft-bg);
  color: var(--accent-solid);
  font-weight: 700;
}
.tip {
  display: flex;
  gap: .5rem;
  margin-top: 2rem;
  padding: .8rem;
  border: 1px solid var(--border-color);
  border-radius: .7rem;
  color: var(--accent-solid);
}
.tip p {
  color: var(--text-secondary);
  font-size: .75rem;
  line-height: 1.4;
  margin: 0;
}

/* ============ WORKSPACE HEADING ============ */
.workspace-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 1rem;
}
.workspace-heading h2 {
  font-size: 1.5rem;
  margin: 0 0 .25rem;
}
.workspace-heading p {
  color: var(--text-secondary);
  font-size: .85rem;
  margin: 0;
}

/* ============ HOW IT WORKS ============ */
.how-it-works {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  flex-wrap: wrap;
  margin-top: 2.5rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: .7rem;
  color: var(--text-secondary);
  font-size: .8rem;
}
.how-it-works strong {
  color: var(--text-primary);
  margin-right: .5rem;
}
.how-it-works svg {
  color: var(--accent-solid);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 760px) {
  .interactive-shell {
    width: min(100% - 2rem, 680px);
    padding-top: 7rem;
  }
  .lab-badge-wrapper {
    margin-bottom: 2rem;
  }
  .workspace-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .filters {
    display: flex;
    overflow-x: auto;
    align-items: center;
    padding-bottom: .25rem;
  }
  .filters > span {
    flex-shrink: 0;
  }
  .filters button {
    white-space: nowrap;
  }
  .tip {
    display: none;
  }
  .workspace-heading {
    align-items: start;
  }
  .result-count {
    font-size: .7rem;
  }
  .workspace-main :deep(.carousel-wrapper) {
    max-width: 100%;
  }
}

@media (max-width: 420px) {
  .interactive-shell {
    width: min(100% - 1.25rem, 380px);
  }
  .workspace-heading {
    display: block;
  }
  .result-count {
    display: inline-block;
    margin-top: .7rem;
  }
  .how-it-works {
    justify-content: flex-start;
    line-height: 1.4;
  }
}
</style>