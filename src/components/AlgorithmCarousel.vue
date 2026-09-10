<template>
  <div class="carousel-wrapper">
    <button
      v-if="cards.length > 1"
      class="carousel-arrow carousel-arrow-left"
      @click="scrollBy(-1)"
      aria-label="Anterior"
    >
      <ChevronLeft class="arrow-icon" />
    </button>

    <div class="carousel-track" ref="trackRef">
      <div
        v-for="card in cards"
        :key="card.id"
        class="algo-card"
        :class="{ 'algo-card-disabled': card.comingSoon }"
        @click="$emit('select', card.id)"
      >
        <!-- MINIATURA / IMAGEN DE PORTADA -->
        <div class="algo-card-cover">
          <img
            v-if="card.image"
            :src="card.image"
            :alt="card.title"
            class="algo-cover-img"
            loading="lazy"
          />
          <div
            v-else
            class="algo-cover-icon"
            :style="{ background: card.iconBg }"
          >
            <component :is="card.icon" class="algo-icon" />
          </div>

          <!-- Badge "Próximamente" sobre la imagen -->
          <span v-if="card.comingSoon" class="algo-card-badge">Próximamente</span>
        </div>

        <div class="algo-card-body">
          <h3 class="algo-card-title">{{ card.title }}</h3>
          <p class="algo-card-desc">{{ card.desc }}</p>

          <span class="algo-card-cta">
            {{ card.comingSoon ? 'Próximamente' : 'Abrir' }}
            <ArrowRight class="cta-icon" />
          </span>
        </div>
      </div>
    </div>

    <button
      v-if="cards.length > 1"
      class="carousel-arrow carousel-arrow-right"
      @click="scrollBy(1)"
      aria-label="Siguiente"
    >
      <ChevronRight class="arrow-icon" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronLeft, ChevronRight, ArrowRight, Network } from '@lucide/vue'

defineEmits(['select'])

const trackRef = ref(null)

// 👇 Aquí agregas tus imágenes. Opciones:
//    - Local:  import imgGrafos from '@/assets/algo-grafos.png'
//    - URL:    'https://tusitio.com/img/grafos.png'
//    - Placeholder rápido: 'https://picsum.photos/seed/grafos/600/340'
const cards = [
  {
    id: 'grafos',
    title: 'Pizarra de grafos',
    desc: 'Crea nodos y conexiones libremente para diseñar y analizar cualquier grafo.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
    image: null,           // ← pon aquí tu imagen real
    comingSoon: false
  },
  {
    id: 'asignacion',
    title: 'Algoritmo de asignación',
    desc: 'Resuelve problemas de asignación óptima sobre un grafo bipartito.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: null,
    comingSoon: false // ← Cambiar de true a false
  },
  {
    id: 'johnson',
    title: 'Algoritmo de Johnson',
    desc: 'Encuentra los caminos más cortos entre todos los pares de vértices en un grafo con pesos.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    image: null,
    comingSoon: true
  }
]

const scrollBy = (direction) => {
  if (!trackRef.value) return
  const cardWidth = trackRef.value.firstElementChild?.offsetWidth || 280
  trackRef.value.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' })
}
</script>

<style scoped>
.carousel-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  position: relative;
}

.carousel-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0.5rem;
  flex: 1;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

/* ===== CARD ===== */
.algo-card {
  scroll-snap-align: start;
  flex: 0 0 260px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1.1rem;
  overflow: hidden;              /* para que la imagen respete el radius */
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  display: flex;
  flex-direction: column;
}

@media (min-width: 640px) {
  .algo-card {
    flex-basis: 300px;
  }
}

.algo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -8px var(--shadow-color);
  border-color: var(--accent-solid);
}

.algo-card-disabled {
  opacity: 0.85;
  cursor: default;
}

.algo-card-disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--border-color);
}

/* ===== PORTADA (imagen o icono) ===== */
.algo-card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--bg-surface-subtle, rgba(0, 0, 0, 0.1));
  overflow: hidden;
}

.algo-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.algo-card:hover .algo-cover-img {
  transform: scale(1.05);
}

/* Fallback: si no hay imagen, mostramos el icono con gradiente */
.algo-cover-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.algo-icon {
  width: 2rem;
  height: 2rem;
  color: #ffffff;
}

/* Badge "Próximamente" sobre la portada */
.algo-card-badge {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* ===== CUERPO DE LA CARD ===== */
.algo-card-body {
  padding: 1.1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.algo-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.4rem;
}

.algo-card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 1rem;
  flex: 1;
}

.algo-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-solid);
}

.cta-icon {
  width: 0.9rem;
  height: 0.9rem;
}

[data-theme='light'] .algo-card {
  background-color: #ffffff;
  border-color: #e4ddfa;
  box-shadow:
    0 1px 2px rgba(139, 92, 246, 0.05),
    0 8px 24px -8px rgba(139, 92, 246, 0.10);
}

[data-theme='light'] .algo-card:hover {
  border-color: #a855f7;
  box-shadow:
    0 0 0 1px rgba(168, 85, 247, 0.15),
    0 12px 32px -8px rgba(168, 85, 247, 0.25);
}

/* ===== FLECHAS ===== */
.carousel-arrow {
  flex-shrink: 0;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 2;
}

.carousel-arrow:hover {
  border-color: var(--accent-solid);
  color: var(--accent-solid);
}

.arrow-icon {
  width: 1.1rem;
  height: 1.1rem;
}

/* ===== RESPONSIVE ===== */

/* Tablet: cards un poco más chicas */
@media (max-width: 768px) {
  .algo-card {
    flex-basis: 260px;
  }
}

/* Móvil: ocultamos flechas, scroll natural con snap */
@media (max-width: 640px) {
  .carousel-wrapper {
    gap: 0;
  }

  .carousel-arrow {
    display: none;               /* el swipe táctil es más natural */
  }

  .carousel-track {
    padding: 0.5rem 1rem;        /* padding lateral para que la 1ª card no pegue al borde */
    gap: 1rem;
  }

  .algo-card {
    flex-basis: 78vw;            /* casi todo el ancho, se ve la siguiente asomando */
    max-width: 300px;
  }
}

/* Móvil muy chico */
@media (max-width: 380px) {
  .algo-card {
    flex-basis: 85vw;
  }
}
</style>