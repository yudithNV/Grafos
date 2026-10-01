<template>
  <main class="home-view">
    <!-- HERO CON FONDO DE ESTRELLAS 3D -->
    <section class="hero-banner">
      <div class="stars">
        <div
          v-for="(style, i) in stars"
          :key="i"
          class="star"
          :style="style"
        ></div>
      </div>

      <div class="hero-orbit-container">
        <h1 class="home-title">
          Graphix
          <div class="glow-behind-title"></div>
        </h1>

        <p class="home-subtitle">
          Simulador interactivo para diseñar, conectar y analizar grafos. Explora la teoría
          de grafos y pon a prueba algoritmos complejos en tiempo real.
        </p>
      </div>
    </section>

    <!-- 👇 NUEVO CONTENEDOR CON FONDO DE CONSTELACIONES -->
    <div class="sections-with-canvas">
      <CanvasBackground />

      <!-- RESTO DEL CONTENIDO -->
      <section class="home-section">
        <div class="section-heading">
          <div><span class="eyebrow">UNA RUTA CLARA</span><h2>Todo lo que necesitas para aprender</h2></div>
          <p>Estudia el concepto, llévalo a la práctica y comprueba tus resultados en un mismo espacio.</p>
        </div>
        <div class="learning-grid">
          <article class="learning-card">
            <div class="card-icon purple"><BookOpen :size="22" /></div>
            <span class="card-number">01</span>
            <h3>Fundamentos sólidos</h3>
            <p>Definiciones, representaciones, tipos de grafos y complejidad explicados con ejemplos.</p>
            <button @click="$emit('navigate', 'teoria')">Ir a Fundamentos <ArrowUpRight :size="16" /></button>
          </article>
          <article class="learning-card featured">
            <div class="card-icon pink"><MousePointer2 :size="22" /></div>
            <span class="card-number">02</span>
            <h3>Experimentación visual</h3>
            <p>Dibuja grafos, asigna pesos y observa cómo se comportan los algoritmos en tiempo real.</p>
            <button @click="$emit('navigate', 'interactivos')">Abrir pizarras <ArrowUpRight :size="16" /></button>
          </article>
          <article class="learning-card">
            <div class="card-icon blue"><GraduationCap :size="22" /></div>
            <span class="card-number">03</span>
            <h3>Aprendizaje activo</h3>
            <p>Relaciona la teoría con decisiones concretas y construye intuición para resolver problemas.</p>
            <button @click="$emit('navigate', 'about')">Conocer el proyecto <ArrowUpRight :size="16" /></button>
          </article>
        </div>
      </section>

      <section class="home-section compact-section">
        <div class="section-heading centered"><div><span class="eyebrow">EN POCAS PALABRAS</span><h2>Una plataforma, tres momentos de aprendizaje</h2></div></div>
        <div class="steps">
          <div><span>1</span><h3>Comprende</h3><p>Consulta los conceptos clave antes de comenzar.</p></div>
          <div><span>2</span><h3>Construye</h3><p>Modela tu propio grafo con nodos, conexiones y pesos.</p></div>
          <div><span>3</span><h3>Analiza</h3><p>Interpreta el resultado y verifica cada decisión.</p></div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, GraduationCap, MousePointer2 } from '@lucide/vue'
import CanvasBackground from './CanvasBackground.vue'

defineEmits(['select', 'navigate'])

// ===== ESTRELLAS 3D =====
const STAR_COUNT = 800
const BASE_RADIUS = 800

const stars = Array.from({ length: STAR_COUNT }, () => {
  const s = 0.2 + Math.random() * 1
  const curR = BASE_RADIUS + Math.random() * 300
  return {
    transformOrigin: `0 0 ${curR}px`,
    transform: `translate3d(0,0,-${curR}px) rotateY(${Math.random() * 360}deg) rotateX(${Math.random() * -50}deg) scale(${s},${s})`
  }
})
</script>

<style scoped>
/* ===== HERO BANNER ===== */
.home-view {
  width: 100%;
  background-color: var(--bg-body);
  display: flex;
  flex-direction: column;
}

.hero-banner {
  /* Modo claro (por defecto): tus colores originales */
  --hero-bg: radial-gradient(220% 105% at top center, #1B2947 10%, #75517D 40%, #E96F92 65%, #F7F7B6);
  --star-color: #F7F7B6;

  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem 1rem 4rem;
  background: var(--hero-bg);
}

/* Modo oscuro */
[data-theme='dark'] .hero-banner {
  --hero-bg: radial-gradient(220% 105% at top center, #05030f 10%, #150a33 40%, #331e57 68%, #6d36cb);
  --star-color: #e9d5ff;
}

[data-theme='light'] .hero-banner {
  --hero-bg: radial-gradient(220% 105% at top center, #1B2947 10%, #75517D 40%, #E96F92 65%, #F7F7B6);
  --star-color: #F7F7B6;
}

/* ===== ESTRELLAS ===== */
.stars {
  transform: perspective(500px);
  transform-style: preserve-3d;
  position: absolute;
  bottom: 0;
  left: 50%;
  perspective-origin: 50% 100%;
  animation: stars-rotate 90s infinite linear;
  z-index: 0;
  pointer-events: none;
}

.star {
  width: 2px;
  height: 2px;
  background: var(--star-color);
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0 -300px;
  transform: translate3d(0, 0, -300px);
  backface-visibility: hidden;
}

@keyframes stars-rotate {
  0% {
    transform: perspective(400px) rotateZ(20deg) rotateX(-40deg) rotateY(0);
  }
  100% {
    transform: perspective(400px) rotateZ(20deg) rotateX(-40deg) rotateY(-360deg);
  }
}

/* ===== NUEVO CONTENEDOR CON CANVAS DE FONDO ===== */
.sections-with-canvas {
  position: relative;
  overflow: hidden;
  background-color: var(--bg-body);
}

.sections-with-canvas > .home-section {
  position: relative;
  z-index: 2;
}

.hero-orbit-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
}

/* ===== BRILLO DETRÁS DEL TÍTULO ===== */
.glow-behind-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 300px;
  background: #ffffff;
  opacity: 0.10;
  filter: blur(70px);
  z-index: -1;
  pointer-events: none;
  border-radius: 50%;
}

/* ===== TÍTULO ===== */
.home-title {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  position: relative;
  display: inline-block;
  margin: 0;
  padding: 0.5rem 1rem;
  z-index: 2;
  color: #ffffff;
  -webkit-text-fill-color: #ffffff;
  filter:
    drop-shadow(0 0 6px  rgba(255, 255, 255, 0.45))
    drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
    drop-shadow(0 0 34px rgba(168, 85, 247, 0.30));
}

@media (min-width: 768px) {
  .home-title { font-size: 5.5rem; }
}

@media (min-width: 1024px) {
  .home-title { font-size: 10rem; }
}

.home-subtitle {
  font-size: 1.15rem;
  max-width: 36rem;
  margin: 1.5rem 0 0;
  line-height: 1.6;
  position: relative;
  z-index: 2;
  color: #ffffff;
  text-shadow:
    0 1px 10px rgba(27, 41, 71, 0.55),
    0 0 24px rgba(27, 41, 71, 0.35);
}

/* ===== RESTO DEL CONTENIDO ===== */
.eyebrow { color: var(--accent-solid); font-size: .72rem; font-weight: 800; letter-spacing: .16em; }

.home-section { max-width: 1160px; margin: 0 auto; padding: 5rem 1.5rem; }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 2rem; margin-bottom: 2rem; }
h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); letter-spacing: -.04em; margin: .6rem 0 0; }
.section-heading > p { max-width: 390px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

.learning-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.learning-card { position: relative; padding: 1.5rem; min-height: 220px; border: 1px solid var(--border-color); border-radius: 1rem; background: var(--bg-surface); }
.learning-card.featured { background: linear-gradient(145deg, var(--bg-surface), var(--accent-soft-bg)); border-color: color-mix(in srgb, var(--accent-solid) 45%, var(--border-color)); }

.card-icon { width: 2.7rem; height: 2.7rem; border-radius: .75rem; display: grid; place-items: center; margin-bottom: 1.3rem; }
.purple { color: #a855f7; background: #a855f722; }
.pink { color: #ec4899; background: #ec489922; }
.blue { color: #06b6d4; background: #06b6d422; }

.card-number { position: absolute; top: 1.5rem; right: 1.5rem; color: var(--text-secondary); font-size: .75rem; }
.learning-card h3, .steps h3 { margin: 0 0 .5rem; }
.learning-card p, .steps p { color: var(--text-secondary); line-height: 1.55; font-size: .9rem; margin: 0 0 1.2rem; }
.learning-card button { display: inline-flex; align-items: center; gap: .35rem; border: 0; padding: 0; color: var(--accent-solid); background: none; font: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; }

.compact-section { padding-top: 1rem; }
.centered { justify-content: center; text-align: center; }
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; text-align: center; }
.steps > div { padding: 1.5rem; }
.steps span { display: grid; place-items: center; width: 2.3rem; height: 2.3rem; margin: 0 auto 1rem; border-radius: 50%; color: #fff; font-weight: 800; background: linear-gradient(135deg, var(--accent-start), var(--accent-end)); }

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .learning-grid { grid-template-columns: 1fr; }
  .section-heading { display: block; }
  .section-heading > p { margin-top: 1rem; }
  .steps { grid-template-columns: 1fr; gap: 0; }
}

@media (max-width: 768px) {
  .hero-banner {
    min-height: 50vh;
    padding: 4rem 1rem 3rem;
  }

  .home-title { font-size: clamp(4rem, 20vw, 7rem); }
}

@media (max-width: 480px) {
  .hero-banner { min-height: auto; }
  .home-section { padding-left: 1rem; padding-right: 1rem; }
}
</style>