<template>
  <div class="home-view">
    <!-- BLOQUE 1: BANNER HERO CON ÓRBITAS DENTRO DEL TÍTULO -->
    <section class="hero-banner">
      <div class="hero-orbit-container">
        <!-- Título con órbitas DENTRO (como en el ejemplo original) -->
        <h1 class="home-title">
          GraphFlow
          <div class="orbit orbit-1"></div>
          <div class="orbit orbit-2"></div>
          <div class="orbit orbit-3"></div>
          <div class="orbit orbit-4"></div>
          <div class="orbit orbit-5"></div>
          <div class="orbit orbit-6"></div>
          <div class="orbit orbit-7"></div>
          <div class="orbit orbit-8"></div>
          <div class="orbit orbit-9"></div>
          <div class="orbit orbit-10"></div>
          <div class="orbit orbit-11"></div>
          <div class="orbit orbit-12"></div>
          <div class="orbit orbit-13"></div>
          <div class="orbit orbit-14"></div>
          <div class="orbit orbit-15"></div>
          <div class="orbit orbit-16"></div>
          <div class="orbit orbit-17"></div>
          <div class="orbit orbit-18"></div>
          <div class="orbit orbit-19"></div>
          <div class="orbit orbit-20"></div>
        </h1>

        <!-- Subtítulo (fuera del h1) -->
        <template v-if="mode === 'home'">
          <p class="home-subtitle">
            Simulador interactivo para el estudio y diseño de estructuras de grafos.
          </p>
        </template>
        <template v-else>
          <p class="home-subtitle">
            Elige un algoritmo para abrir su pizarra interactiva.
          </p>
        </template>
      </div>
    </section>

    <!-- BLOQUE 2: SECCIÓN DE CONTENIDO -->
    <section class="content-section" v-if="mode === 'home'">
        <CanvasBackground />
      <div class="content-container">
        <div class="explainer">
          <h2 class="explainer-title">¿Qué es un algoritmo?</h2>
          <p class="explainer-text">
            Un algoritmo es una secuencia ordenada y finita de pasos que resuelve un
            problema o realiza una tarea. En el contexto de los grafos, un algoritmo
            recorre nodos y aristas siguiendo reglas específicas —por ejemplo, para
            encontrar el camino más corto, detectar ciclos o asignar recursos de forma
            óptima. Explora los algoritmos disponibles abajo.
          </p>
        </div>

        <AlgorithmCarousel @select="(id) => $emit('select', id)" />
      </div>
    </section>

    <section class="content-section" v-else>
        <CanvasBackground />
      <div class="content-container">
        <AlgorithmCarousel @select="(id) => $emit('select', id)" />
      </div>
    </section>
  </div>
</template>

<script setup>
import AlgorithmCarousel from './AlgorithmCarousel.vue'
import CanvasBackground from './CanvasBackground.vue'

defineProps({
  mode: { type: String, default: 'home' }
})

defineEmits(['select'])
</script>

<style scoped>
.home-view {
  width: 100%;
  background-color: var(--bg-body);
  display: flex;
  flex-direction: column;
}

/* ===== BLOQUE 1: BANNER HERO ===== */
.hero-banner {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem 1rem 4rem;
  background-color: var(--bg-body);
}

.hero-orbit-container {
  position: relative;
  width: 100%;
  max-width: 65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
}

/* ===== TÍTULO CON ÓRBITAS DENTRO (como en el ejemplo) ===== */
.home-title {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  position: relative;
  display: inline-block;
  transform-style: preserve-3d;
  margin: 0;
  padding: 0.5rem 1rem;
  z-index: 2;
}

@media (min-width: 768px) {
  .home-title {
    font-size: 5.5rem;
  }
}

@media (min-width: 1024px) {
  .home-title {
    font-size: 10rem;
  }
}

.home-subtitle {
  color: var(--text-secondary);
  font-size: 1.15rem;
  max-width: 36rem;
  margin: 1.5rem 0 0;
  line-height: 1.6;
  position: relative;
  z-index: 2;
}

/* ===== ÓRBITAS DENTRO DEL H1 ===== */
.orbit {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform-style: preserve-3d;
  z-index: 1;
}

.orbit:after {
  content: '';
  display: block;
  border-radius: 50%;
  animation: planet-rotate 10s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
}

/* Configuración de cada órbita (basada en el ejemplo original) */
.orbit-1 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -6.8s;
  top: 56%;
  left: 0.5%;
  width: 99%;
}
.orbit-1:after {
  animation-delay: -6.8s;
  height: 4px;
  width: 4px;
  background-color: #f59e0b;
}

.orbit-2 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -0.3s;
  top: 77%;
  left: 8%;
  width: 84%;
}
.orbit-2:after {
  animation-delay: -0.3s;
  height: 8px;
  width: 8px;
  background-color: #3b82f6;
}

.orbit-3 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -2.3s;
  top: 48%;
  left: 0%;
  width: 100%;
}
.orbit-3:after {
  animation-delay: -2.3s;
  height: 12px;
  width: 12px;
  background-color: #ef4444;
}

.orbit-4 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -3.6s;
  top: 43%;
  left: 0.5%;
  width: 99%;
}
.orbit-4:after {
  animation-delay: -3.6s;
  height: 5px;
  width: 5px;
  background-color: #10b981;
}

.orbit-5 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -7.2s;
  top: 27%;
  left: 5.5%;
  width: 89%;
}
.orbit-5:after {
  animation-delay: -7.2s;
  height: 6px;
  width: 6px;
  background-color: #8b5cf6;
}

.orbit-6 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -1.7s;
  top: 24%;
  left: 7%;
  width: 86%;
}
.orbit-6:after {
  animation-delay: -1.7s;
  height: 12px;
  width: 12px;
  background-color: #ec4899;
}

.orbit-7 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -5.6s;
  top: 14%;
  left: 15.5%;
  width: 69%;
}
.orbit-7:after {
  animation-delay: -5.6s;
  height: 5px;
  width: 5px;
  background-color: #f97316;
}

.orbit-8 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -5s;
  top: 4%;
  left: 30.5%;
  width: 39%;
}
.orbit-8:after {
  animation-delay: -5s;
  height: 6px;
  width: 6px;
  background-color: #06b6d4;
}

.orbit-9 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -3.4s;
  top: 20%;
  left: 10%;
  width: 80%;
}
.orbit-9:after {
  animation-delay: -3.4s;
  height: 12px;
  width: 12px;
  background-color: #d946ef;
}

.orbit-10 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -8.2s;
  top: 40%;
  left: 1%;
  width: 98%;
}
.orbit-10:after {
  animation-delay: -8.2s;
  height: 9px;
  width: 9px;
  background-color: #84cc16;
}

.orbit-11 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -2.2s;
  top: 83%;
  left: 12.5%;
  width: 75%;
}
.orbit-11:after {
  animation-delay: -2.2s;
  height: 6px;
  width: 6px;
  background-color: #eab308;
}

.orbit-12 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -0.1s;
  top: 87%;
  left: 16.5%;
  width: 67%;
}
.orbit-12:after {
  animation-delay: -0.1s;
  height: 12px;
  width: 12px;
  background-color: #f472b6;
}

.orbit-13 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -8s;
  top: 17%;
  left: 12%;
  width: 76%;
}
.orbit-13:after {
  animation-delay: -8s;
  height: 6px;
  width: 6px;
  background-color: #22d3ee;
}

.orbit-14 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -3.4s;
  top: 92%;
  left: 23.5%;
  width: 53%;
}
.orbit-14:after {
  animation-delay: -3.4s;
  height: 10px;
  width: 10px;
  background-color: #a78bfa;
}

.orbit-15 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -0.6s;
  top: 85%;
  left: 14.5%;
  width: 71%;
}
.orbit-15:after {
  animation-delay: -0.6s;
  height: 8px;
  width: 8px;
  background-color: #fb923c;
}

.orbit-16 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -5s;
  top: 14%;
  left: 15%;
  width: 70%;
}
.orbit-16:after {
  animation-delay: -5s;
  height: 8px;
  width: 8px;
  background-color: #34d399;
}

.orbit-17 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -9.6s;
  top: 79%;
  left: 9%;
  width: 82%;
}
.orbit-17:after {
  animation-delay: -9.6s;
  height: 11px;
  width: 11px;
  background-color: #f87171;
}

.orbit-18 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -0.8s;
  top: 11%;
  left: 18.5%;
  width: 63%;
}
.orbit-18:after {
  animation-delay: -0.8s;
  height: 7px;
  width: 7px;
  background-color: #60a5fa;
}

.orbit-19 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -3.2s;
  top: 65%;
  left: 2%;
  width: 96%;
}
.orbit-19:after {
  animation-delay: -3.2s;
  height: 5px;
  width: 5px;
  background-color: #e879f9;
}

.orbit-20 {
  animation: orbit-rotate 10s linear infinite;
  animation-delay: -9.7s;
  top: 30%;
  left: 4%;
  width: 92%;
}
.orbit-20:after {
  animation-delay: -9.7s;
  height: 8px;
  width: 8px;
  background-color: #fbbf24;
}

@keyframes orbit-rotate {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}

@keyframes planet-rotate {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(-360deg); }
}

/* ===== BLOQUE 2: SECCIÓN DE CONTENIDO ===== */
.content-section {
    position: relative;
    overflow: hidden;
  width: 100%;
  background-color: var(--bg-surface-subtle, rgba(255, 255, 255, 0.02));
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  padding: 4rem 1rem 5rem;
}

.content-container {
    position: relative;
    z-index: 2;
  width: 100%;
  max-width: 60rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.explainer {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.75rem 2rem;
  max-width: 40rem;
  margin-bottom: 3rem;
  text-align: left;
}

.explainer-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.6rem;
}

.explainer-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}

@media (max-width: 768px) {
  .hero-banner {
    min-height: 50vh;
    padding: 4rem 1rem 3rem;
  }
  
  .content-section {
    padding: 2.5rem 1rem 3rem;
  }
  
  .explainer {
    padding: 1.25rem 1.5rem;
    margin-bottom: 2rem;
  }
}
</style>