<template>
  <div class="home-view">
    <!-- BLOQUE 1: BANNER HERO CON ÓRBITAS DENTRO DEL TÍTULO -->
    <section class="hero-banner">
      <!-- 👇 NUEVO: canvas de constelaciones en el hero -->
      <CanvasBackground :show-lines="false" :ball-count="50" />

      <div class="hero-orbit-container">
        <!-- Título con órbitas DENTRO (como en el ejemplo original) -->
        <h1 class="home-title">
          Graphix
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
            Simulador interactivo para diseñar, conectar y analizar grafos. Explora la teoría de grafos y poner a prueba algoritmos complejos en tiempo real.
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
        <!-- NUEVO: fila con explicación + video -->
        <div class="explainer-row">
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

          <!-- NUEVO: video embebido -->
          <div class="explainer-video">
            <iframe
              :src="videoUrl"
              title="¿Qué es un algoritmo?"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
        </div>

        <div id="algorithms-carousel" class="algorithms-anchor">
          <AlgorithmCarousel @select="(id) => $emit('select', id)" />
        </div>
      </div>
    </section>

    <section class="content-section" v-else>
      <CanvasBackground />
      <div class="content-container">
        <div id="algorithms-carousel" class="algorithms-anchor">
          <AlgorithmCarousel @select="(id) => $emit('select', id)" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AlgorithmCarousel from './AlgorithmCarousel.vue'
import CanvasBackground from './CanvasBackground.vue'

defineProps({
  mode: { type: String, default: 'home' }
})

defineEmits(['select'])

// 👇 Cambia esto por el link de YouTube que quieras
const youtubeLink = 'https://www.youtube.com/watch?v=f10jKIslSUY'

// Convierte cualquier formato de link de YouTube a URL de embed
const videoUrl = computed(() => {
  const url = youtubeLink
  // Formatos soportados:
  // - https://www.youtube.com/watch?v=XXXX
  // - https://youtu.be/XXXX
  // - https://www.youtube.com/embed/XXXX
  // - https://www.youtube.com/shorts/XXXX
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  const id = match ? match[1] : ''
  return `https://www.youtube.com/embed/${id}`
})
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
  position: relative;        /* 👈 NUEVO: ancla el canvas */
  overflow: hidden;          /* 👈 NUEVO: evita que se salga */
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
  z-index: 2;                /* 👈 NUEVO: por encima del canvas */
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
  position: relative;
  display: inline-block;
  transform-style: preserve-3d;
  margin: 0;
  padding: 0.5rem 1rem;
  z-index: 2;
  transition: color 0.3s ease, filter 0.3s ease;
}

/* ===== MODO OSCURO: BLANCO con glow tipo constelación ===== */
[data-theme='dark'] .home-title {
  color: #ffffff;
  background: none;
  -webkit-text-fill-color: #ffffff;

  filter:
    drop-shadow(0 0 6px  rgba(255, 255, 255, 0.45))
    drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
    drop-shadow(0 0 34px rgba(168, 85, 247, 0.25));
}

/* ===== MODO CLARO: mantenemos el gradiente ===== */
[data-theme='light'] .home-title {
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
  font-size: 1.15rem;
  max-width: 36rem;
  margin: 1.5rem 0 0;
  line-height: 1.6;
  position: relative;
  z-index: 2;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

/* ===== MODO OSCURO: blanco con brillo sutil ===== */
[data-theme='dark'] .home-subtitle {
  color: #f5f3ff;
  text-shadow:
    0 0 6px  rgba(255, 255, 255, 0.35),
    0 0 14px rgba(255, 255, 255, 0.18),
    0 0 28px rgba(168, 85, 247, 0.20);
}

/* ===== MODO CLARO: gris oscuro legible ===== */
[data-theme='light'] .home-subtitle {
  color: #4c4373;   /* violeta grisáceo oscuro, legible */
  text-shadow:
    0 0 8px  rgba(168, 85, 247, 0.12),
    0 0 18px rgba(168, 85, 247, 0.06);
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

/* Configuración de cada órbita */
.orbit-1  { animation: orbit-rotate 10s linear infinite; animation-delay: -6.8s; top: 56%;  left: 0.5%;  width: 99%; }
.orbit-1:after  { animation-delay: -6.8s; height: 4px;  width: 4px;  background-color: #f59e0b; }
.orbit-2  { animation: orbit-rotate 10s linear infinite; animation-delay: -0.3s; top: 77%;  left: 8%;    width: 84%; }
.orbit-2:after  { animation-delay: -0.3s; height: 8px;  width: 8px;  background-color: #3b82f6; }
.orbit-3  { animation: orbit-rotate 10s linear infinite; animation-delay: -2.3s; top: 48%;  left: 0%;    width: 100%; }
.orbit-3:after  { animation-delay: -2.3s; height: 12px; width: 12px; background-color: #ef4444; }
.orbit-4  { animation: orbit-rotate 10s linear infinite; animation-delay: -3.6s; top: 43%;  left: 0.5%;  width: 99%; }
.orbit-4:after  { animation-delay: -3.6s; height: 5px;  width: 5px;  background-color: #10b981; }
.orbit-5  { animation: orbit-rotate 10s linear infinite; animation-delay: -7.2s; top: 27%;  left: 5.5%;  width: 89%; }
.orbit-5:after  { animation-delay: -7.2s; height: 6px;  width: 6px;  background-color: #8b5cf6; }
.orbit-6  { animation: orbit-rotate 10s linear infinite; animation-delay: -1.7s; top: 24%;  left: 7%;    width: 86%; }
.orbit-6:after  { animation-delay: -1.7s; height: 12px; width: 12px; background-color: #ec4899; }
.orbit-7  { animation: orbit-rotate 10s linear infinite; animation-delay: -5.6s; top: 14%;  left: 15.5%; width: 69%; }
.orbit-7:after  { animation-delay: -5.6s; height: 5px;  width: 5px;  background-color: #f97316; }
.orbit-8  { animation: orbit-rotate 10s linear infinite; animation-delay: -5s;   top: 4%;   left: 30.5%; width: 39%; }
.orbit-8:after  { animation-delay: -5s;   height: 6px;  width: 6px;  background-color: #06b6d4; }
.orbit-9  { animation: orbit-rotate 10s linear infinite; animation-delay: -3.4s; top: 20%;  left: 10%;   width: 80%; }
.orbit-9:after  { animation-delay: -3.4s; height: 12px; width: 12px; background-color: #d946ef; }
.orbit-10 { animation: orbit-rotate 10s linear infinite; animation-delay: -8.2s; top: 40%;  left: 1%;    width: 98%; }
.orbit-10:after { animation-delay: -8.2s; height: 9px;  width: 9px;  background-color: #84cc16; }
.orbit-11 { animation: orbit-rotate 10s linear infinite; animation-delay: -2.2s; top: 83%;  left: 12.5%; width: 75%; }
.orbit-11:after { animation-delay: -2.2s; height: 6px;  width: 6px;  background-color: #eab308; }
.orbit-12 { animation: orbit-rotate 10s linear infinite; animation-delay: -0.1s; top: 87%;  left: 16.5%; width: 67%; }
.orbit-12:after { animation-delay: -0.1s; height: 12px; width: 12px; background-color: #f472b6; }
.orbit-13 { animation: orbit-rotate 10s linear infinite; animation-delay: -8s;   top: 17%;  left: 12%;   width: 76%; }
.orbit-13:after { animation-delay: -8s;   height: 6px;  width: 6px;  background-color: #22d3ee; }
.orbit-14 { animation: orbit-rotate 10s linear infinite; animation-delay: -3.4s; top: 92%;  left: 23.5%; width: 53%; }
.orbit-14:after { animation-delay: -3.4s; height: 10px; width: 10px; background-color: #a78bfa; }
.orbit-15 { animation: orbit-rotate 10s linear infinite; animation-delay: -0.6s; top: 85%;  left: 14.5%; width: 71%; }
.orbit-15:after { animation-delay: -0.6s; height: 8px;  width: 8px;  background-color: #fb923c; }
.orbit-16 { animation: orbit-rotate 10s linear infinite; animation-delay: -5s;   top: 14%;  left: 15%;   width: 70%; }
.orbit-16:after { animation-delay: -5s;   height: 8px;  width: 8px;  background-color: #34d399; }
.orbit-17 { animation: orbit-rotate 10s linear infinite; animation-delay: -9.6s; top: 79%;  left: 9%;    width: 82%; }
.orbit-17:after { animation-delay: -9.6s; height: 11px; width: 11px; background-color: #f87171; }
.orbit-18 { animation: orbit-rotate 10s linear infinite; animation-delay: -0.8s; top: 11%;  left: 18.5%; width: 63%; }
.orbit-18:after { animation-delay: -0.8s; height: 7px;  width: 7px;  background-color: #60a5fa; }
.orbit-19 { animation: orbit-rotate 10s linear infinite; animation-delay: -3.2s; top: 65%;  left: 2%;    width: 96%; }
.orbit-19:after { animation-delay: -3.2s; height: 5px;  width: 5px;  background-color: #e879f9; }
.orbit-20 { animation: orbit-rotate 10s linear infinite; animation-delay: -9.7s; top: 30%;  left: 4%;    width: 92%; }
.orbit-20:after { animation-delay: -9.7s; height: 8px;  width: 8px;  background-color: #fbbf24; }

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

.algorithms-anchor {
  width: 100%;
  scroll-margin-top: 5.5rem;
}

/* ===== NUEVO: fila explicación + video ===== */
.explainer-row {
  display: flex;
  align-items: stretch;
  gap: 2rem;
  width: 100%;
  margin-bottom: 3rem;
  text-align: left;
}

.explainer {
  flex: 1 1 55%;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.75rem 2rem;
  margin-bottom: 0;      /* el margen lo lleva .explainer-row ahora */
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

/* ===== NUEVO: contenedor del video ===== */
.explainer-video {
  flex: 1 1 45%;
  position: relative;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background-color: var(--bg-surface);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  aspect-ratio: 16 / 9;
  align-self: center;
}

.explainer-video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

/* Halo sutil en dark mode para que combine con el título */
[data-theme='dark'] .explainer-video {
  box-shadow:
    0 0 0 1px rgba(168, 85, 247, 0.15),
    0 0 20px rgba(168, 85, 247, 0.15),
    0 8px 30px rgba(0, 0, 0, 0.3);
}

/* Responsive: se apilan en pantallas medianas y pequeñas */
@media (max-width: 900px) {
  .explainer-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  .explainer,
  .explainer-video {
    flex: 1 1 auto;
    width: 100%;
  }
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
  }

  .explainer-row {
    margin-bottom: 2rem;
  }
}
</style>