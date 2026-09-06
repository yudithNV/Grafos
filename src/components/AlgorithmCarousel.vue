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
        <div class="algo-card-icon" :style="{ background: card.iconBg }">
          <component :is="card.icon" class="algo-icon" />
        </div>
        <h3 class="algo-card-title">{{ card.title }}</h3>
        <p class="algo-card-desc">{{ card.desc }}</p>
        <span class="algo-card-cta">
          {{ card.comingSoon ? 'Próximamente' : 'Abrir' }}
          <ArrowRight class="cta-icon" />
        </span>
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
import { ChevronLeft, ChevronRight, ArrowRight, Network, Users2 } from '@lucide/vue'

defineEmits(['select'])

const trackRef = ref(null)

const cards = [
  {
    id: 'grafos',
    title: 'Pizarra de grafos',
    desc: 'Crea nodos y conexiones libremente para diseñar y analizar cualquier grafo.',
    icon: Network,
    iconBg: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
    comingSoon: false
  },
  {
    id: 'asignacion',
    title: 'Algoritmo de asignación',
    desc: 'Resuelve problemas de asignación óptima sobre un grafo bipartito.',
    icon: Users2,
    iconBg: 'linear-gradient(135deg, #6366f1, #06b6d4)',
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
}

.carousel-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0.5rem;
  flex: 1;
  scrollbar-width: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.algo-card {
  scroll-snap-align: start;
  flex: 0 0 260px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1.1rem;
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
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
}

.algo-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.algo-icon {
  width: 1.4rem;
  height: 1.4rem;
  color: #ffffff;
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
  margin: 0 0 1.1rem;
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
}

.carousel-arrow:hover {
  border-color: var(--accent-solid);
  color: var(--accent-solid);
}

.arrow-icon {
  width: 1.1rem;
  height: 1.1rem;
}
</style>