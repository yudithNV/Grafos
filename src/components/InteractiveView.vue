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
          <MousePointer2 :size="18" /> {{ cards.length }} pizarras disponibles
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
            <span class="result-count">{{ cards.length }} experiencias</span>
          </div>

          <!-- TABS DE VISTA -->
          <div class="view-tabs" role="tablist" aria-label="Modo de visualización">
            <button
              v-for="tab in viewTabs"
              :key="tab.value"
              class="view-tab"
              :class="{ active: viewMode === tab.value }"
              role="tab"
              :aria-selected="viewMode === tab.value"
              @click="viewMode = tab.value"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.label }}
            </button>
          </div>

          <!-- VISTA CARRUSEL -->
          <AlgorithmCarousel
            v-if="viewMode === 'carousel'"
            @select="$emit('select', $event)"
          />

          <!-- VISTA CUADRÍCULA (3 por fila) -->
          <ul v-else-if="viewMode === 'grid'" class="algorithm-grid">
            <li v-for="card in cards" :key="card.id">
              <button
                class="grid-item"
                :class="{ 'grid-item-disabled': card.comingSoon }"
                @click="$emit('select', card.id)"
              >
                <div class="grid-thumb">
                  <img
                    v-if="card.image"
                    :src="card.image"
                    :alt="card.title"
                    class="grid-thumb-img"
                    loading="lazy"
                  />
                  <div v-else class="grid-thumb-icon" :style="{ background: card.iconBg }">
                    <component :is="card.icon" :size="28" />
                  </div>
                </div>

                <div class="grid-item-text">
                  <strong>
                    {{ card.title }}
                    <em v-if="card.comingSoon" class="grid-badge">Próximamente</em>
                  </strong>
                  <small>{{ card.desc }}</small>
                </div>
              </button>
            </li>
          </ul>

          <!-- VISTA LISTA -->
          <ul v-else class="algorithm-list">
            <li v-for="card in cards" :key="card.id">
              <button
                class="list-item"
                :class="{ 'list-item-disabled': card.comingSoon }"
                @click="$emit('select', card.id)"
              >
                <div class="list-thumb">
                  <img
                    v-if="card.image"
                    :src="card.image"
                    :alt="card.title"
                    class="list-thumb-img"
                    loading="lazy"
                  />
                  <div v-else class="list-thumb-icon" :style="{ background: card.iconBg }">
                    <component :is="card.icon" :size="24" />
                  </div>
                </div>

                <span class="list-item-text">
                  <strong>
                    {{ card.title }}
                    <em v-if="card.comingSoon" class="list-badge">Próximamente</em>
                  </strong>
                  <small>{{ card.desc }}</small>
                </span>

                <ChevronRight :size="18" class="list-chevron" />
              </button>
            </li>
          </ul>

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
import { ref, watch, onMounted } from 'vue'
import {
  ArrowRight,
  Lightbulb,
  MousePointer2,
  GalleryHorizontal,
  LayoutGrid,
  List,
  ChevronRight
} from '@lucide/vue'
import AlgorithmCarousel from './AlgorithmCarousel.vue'
import CanvasBackground from './CanvasBackground.vue'
import { cards } from './algorithmCards'

defineEmits(['select'])

const VIEW_MODE_KEY = 'interactive-view-mode'
const DEFAULT_VIEW = 'carousel'

const viewTabs = [
  { value: 'carousel', label: 'Carrusel', icon: GalleryHorizontal },
  { value: 'grid', label: 'Cuadrícula', icon: LayoutGrid },
  { value: 'list', label: 'Lista', icon: List }
]

const viewMode = ref(DEFAULT_VIEW)

onMounted(() => {
  const saved = sessionStorage.getItem(VIEW_MODE_KEY)
  if (saved && viewTabs.some(t => t.value === saved)) {
    viewMode.value = saved
  }
})

watch(viewMode, (val) => {
  sessionStorage.setItem(VIEW_MODE_KEY, val)
})
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
  text-align: left;
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

/* ============ TABS DE VISTA ============ */
.view-tabs {
  display: inline-flex;
  gap: .25rem;
  padding: .25rem;
  margin-bottom: 1.25rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
}
.view-tab {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .5rem .9rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: .8rem;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.view-tab:hover {
  color: var(--accent-solid);
}
.view-tab.active {
  background: var(--accent-soft-bg);
  color: var(--accent-solid);
  font-weight: 700;
}

/* ============ VISTA CUADRÍCULA (3 por fila) ============ */
.algorithm-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .9rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.grid-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: .9rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: border-color .2s ease, background .2s ease, transform .15s ease;
}
.grid-item:hover {
  border-color: var(--accent-solid);
  transform: translateY(-3px);
}
.grid-item-disabled {
  opacity: .85;
}

.grid-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bg-surface-subtle, rgba(0, 0, 0, 0.1));
}
.grid-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.grid-thumb-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.grid-item-text {
  display: grid;
  gap: .3rem;
  padding: .85rem .9rem 1rem;
  min-width: 0;
}
.grid-item-text strong {
  font-size: .95rem;
  display: flex;
  align-items: center;
  gap: .4rem;
  flex-wrap: wrap;
}
.grid-item-text small {
  color: var(--text-secondary);
  font-size: .78rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.grid-badge {
  font-style: normal;
  font-size: .62rem;
  font-weight: 600;
  padding: .15rem .5rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

[data-theme='light'] .grid-item {
  background: #ffffff;
  border-color: #e4ddfa;
}
[data-theme='light'] .grid-item:hover {
  border-color: #a855f7;
}

/* ============ VISTA LISTA ============ */
.algorithm-list {
  display: grid;
  gap: .75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: .75rem 1.1rem .75rem .75rem;
  border: 1px solid var(--border-color);
  border-radius: .9rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, transform .15s ease;
}
.list-item:hover {
  border-color: var(--accent-solid);
  transform: translateX(3px);
}
.list-item-disabled {
  opacity: .85;
}

/* Miniatura */
.list-thumb {
  flex-shrink: 0;
  width: 112px;
  aspect-ratio: 16 / 9;
  border-radius: .6rem;
  overflow: hidden;
  background: var(--bg-surface-subtle, rgba(0, 0, 0, 0.1));
}
.list-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.list-thumb-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.list-item-text {
  display: grid;
  gap: .25rem;
  min-width: 0;
  flex: 1;
}
.list-item-text strong {
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}
.list-item-text small {
  color: var(--text-secondary);
  font-size: .8rem;
  line-height: 1.45;
}
.list-badge {
  font-style: normal;
  font-size: .65rem;
  font-weight: 600;
  padding: .15rem .5rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}
.list-chevron {
  color: var(--accent-solid);
  flex-shrink: 0;
}

[data-theme='light'] .list-item {
  background: #ffffff;
  border-color: #e4ddfa;
}
[data-theme='light'] .list-item:hover {
  border-color: #a855f7;
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
@media (max-width: 900px) {
  .algorithm-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

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

@media (max-width: 520px) {
  .algorithm-grid {
    grid-template-columns: 1fr;
  }
  .list-thumb {
    width: 84px;
  }
  .list-item-text small {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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