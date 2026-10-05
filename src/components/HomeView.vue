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

        <div class="hero-actions">
          <button class="hero-button primary" type="button" @click="$emit('navigate', 'teoria')">
            Comenzar con fundamentos
            <ArrowRight :size="17" />
          </button>
          <button class="hero-button secondary" type="button" @click="$emit('navigate', 'interactivos')">
            Probar algoritmos
            <ArrowUpRight :size="17" />
          </button>
        </div>
      </div>
    </section>

    <!-- 👇 NUEVO CONTENEDOR CON FONDO DE CONSTELACIONES -->
    <div class="sections-with-canvas">
      <CanvasBackground />

      <!-- RESTO DEL CONTENIDO -->
      <section class="home-section">
        <div class="section-heading">
          <div><span class="eyebrow">EMPIEZA AQUÍ</span><h2>Explora Graphix a tu ritmo</h2></div>
          <p>Aprende los conceptos, construye tu propio grafo y descubre cómo Graphix te ayuda a analizarlo.</p>
        </div>
        <div class="learning-grid">
          <article class="learning-card">
            <div class="card-icon purple"><BookOpen :size="22" /></div>
            <span class="card-number">01</span>
            <h3>Fundamentos</h3>
            <p>Consulta definiciones, representaciones, tipos de grafos y complejidad explicados con ejemplos.</p>
            <button type="button" @click="$emit('navigate', 'teoria')">Explorar teoría <ArrowUpRight :size="16" /></button>
          </article>
          <article class="learning-card featured">
            <div class="card-icon pink"><MousePointer2 :size="22" /></div>
            <span class="card-number">02</span>
            <h3>Pizarra de grafos</h3>
            <p>Crea nodos, conecta aristas, asigna pesos y diseña un grafo desde cero.</p>
            <button type="button" @click="$emit('navigate', 'interactivos')">Explorar pizarras <ArrowUpRight :size="16" /></button>
          </article>
          <article class="learning-card">
            <div class="card-icon blue"><CheckCircle2 :size="22" /></div>
            <span class="card-number">03</span>
            <h3>Cómo funciona Graphix</h3>
            <p>Comprende el recorrido completo: estudia un concepto, construye un grafo y analiza el resultado.</p>
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

      <section class="home-section capabilities-section">
        <div class="section-heading">
          <div><span class="eyebrow">TODO EN UN SOLO LUGAR</span><h2>¿Qué puedes hacer en Graphix?</h2></div>
          <p>Convierte la teoría en una experiencia visual, práctica y fácil de comprobar.</p>
        </div>

        <div class="capabilities-layout">
          <!-- 👇 NUEVO: ejemplo de grafo -->
          <div class="graph-demo" aria-hidden="true">
            <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
              <!-- aristas -->
              <g class="g-edges">
                <line x1="60"  y1="80"  x2="190" y2="40"  />
                <line x1="190" y1="40"  x2="330" y2="100" />
                <line x1="190" y1="40"  x2="250" y2="200" />
                <line x1="330" y1="100" x2="250" y2="200" />
                <line x1="330" y1="100" x2="340" y2="280" />
              </g>
              <!-- camino resaltado (A → D → E → F) -->
              <g class="g-path">
                <line x1="60"  y1="80"  x2="110" y2="210" />
                <line x1="110" y1="210" x2="250" y2="200" />
                <line x1="250" y1="200" x2="340" y2="280" />
              </g>
              <!-- pesos -->
              <g class="g-weights">
                <g transform="translate(125,60)"><circle r="11"/><text>4</text></g>
                <g transform="translate(260,70)"><circle r="11"/><text>3</text></g>
                <g transform="translate(220,120)"><circle r="11"/><text>6</text></g>
                <g transform="translate(290,150)"><circle r="11"/><text>1</text></g>
                <g transform="translate(335,190)"><circle r="11"/><text>7</text></g>
                <g transform="translate(85,145)" class="on"><circle r="11"/><text>2</text></g>
                <g transform="translate(180,205)" class="on"><circle r="11"/><text>5</text></g>
                <g transform="translate(295,240)" class="on"><circle r="11"/><text>2</text></g>
              </g>
              <!-- nodos -->
              <g class="g-nodes">
                <g transform="translate(60,80)"  class="on"><circle r="20"/><text>A</text></g>
                <g transform="translate(190,40)"><circle r="20"/><text>B</text></g>
                <g transform="translate(330,100)"><circle r="20"/><text>C</text></g>
                <g transform="translate(110,210)" class="on"><circle r="20"/><text>D</text></g>
                <g transform="translate(250,200)" class="on"><circle r="20"/><text>E</text></g>
                <g transform="translate(340,280)" class="on"><circle r="20"/><text>F</text></g>
              </g>
            </svg>
          </div>

          <div class="capabilities-grid">
            <div class="capability-item"><span class="capability-icon"><MousePointer2 :size="19" /></span><div><h3>Crear grafos</h3><p>Diseña estructuras con nodos y conexiones.</p></div></div>
            <div class="capability-item"><span class="capability-icon"><ArrowUpRight :size="19" /></span><div><h3>Asignar pesos</h3><p>Representa costos, distancias y relaciones.</p></div></div>
            <div class="capability-item"><span class="capability-icon"><GraduationCap :size="19" /></span><div><h3>Ejecutar algoritmos</h3><p>Experimenta con soluciones paso a paso.</p></div></div>
            <div class="capability-item"><span class="capability-icon"><CheckCircle2 :size="19" /></span><div><h3>Visualizar soluciones</h3><p>Observa qué decisiones toma cada algoritmo.</p></div></div>
            <div class="capability-item"><span class="capability-icon"><BookOpen :size="19" /></span><div><h3>Guardar tus grafos</h3><p>Retoma tus ejercicios cuando quieras.</p></div></div>
          </div>
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
  --hero-bg: radial-gradient(220% 105% at top center, #05030f 10%, #150a33 40%, #50225b 68%, #592a65);
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

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: .8rem;
  margin-top: 2rem;
}

.hero-button {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  min-height: 2.9rem;
  padding: .75rem 1.15rem;
  border: 1px solid transparent;
  border-radius: .7rem;
  font: inherit;
  font-size: .88rem;
  font-weight: 750;
  cursor: pointer;
  transition: transform .2s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.hero-button:hover {
  transform: translateY(-2px);
}

/* destello que cruza el botón al hacer hover */
.hero-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, .65), transparent);
  transform: skewX(-20deg);
  transition: left .6s ease;
  pointer-events: none;
}
.hero-button:hover::after { left: 130%; }

.hero-button.primary {
  color: #1b2947;
  background: linear-gradient(135deg, #ffffff 0%, #f7f7b6 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, .6),
    0 0 18px rgba(247, 247, 182, .55),
    0 0 42px rgba(233, 111, 146, .45);
  animation: btn-pulse 3s ease-in-out infinite;
}

.hero-button.primary:hover {
  background: linear-gradient(135deg, #ffffff 0%, #ffe9a8 100%);
  box-shadow:
    0 0 0 1px #fff,
    0 0 26px rgba(247, 247, 182, .85),
    0 0 60px rgba(233, 111, 146, .65);
}

.hero-button.secondary {
  color: #fff;
  border-color: rgba(255, 255, 255, .6);
  background: rgba(255, 255, 255, .12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    inset 0 0 14px rgba(255, 255, 255, .15),
    0 0 18px rgba(168, 85, 247, .4);
}

.hero-button.secondary:hover {
  border-color: #fff;
  background: rgba(255, 255, 255, .22);
  box-shadow:
    inset 0 0 18px rgba(255, 255, 255, .25),
    0 0 30px rgba(168, 85, 247, .7),
    0 0 55px rgba(236, 72, 153, .45);
}

@keyframes btn-pulse {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.08); }
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

/* ===== GRAFO DE EJEMPLO ===== */
.capabilities-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: center;
}

.graph-demo {
  order: 2; /* grafo a la derecha */
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  background: var(--bg-surface);
}
.graph-demo svg { width: 100%; height: auto; display: block; }

.g-edges line { stroke: var(--border-color); stroke-width: 2.5; }

.g-path line {
  stroke: var(--accent-solid);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 8 8;
  filter: drop-shadow(0 0 5px var(--accent-solid));
  animation: path-flow 1.2s linear infinite;
}
@keyframes path-flow { to { stroke-dashoffset: -16; } }

.g-weights circle { fill: var(--bg-surface); stroke: var(--border-color); stroke-width: 1.5; }
.g-weights text {
  fill: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
}
.g-weights .on circle { stroke: var(--accent-solid); }
.g-weights .on text { fill: var(--accent-solid); }

.g-nodes circle { fill: var(--bg-surface); stroke: var(--text-secondary); stroke-width: 2.5; }
.g-nodes text {
  fill: var(--text-primary, currentColor);
  font-size: 15px;
  font-weight: 800;
  text-anchor: middle;
  dominant-baseline: central;
}
.g-nodes .on circle {
  fill: var(--accent-solid);
  stroke: var(--accent-solid);
  filter: drop-shadow(0 0 8px var(--accent-solid));
}
.g-nodes .on text { fill: #fff; }

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .learning-grid { grid-template-columns: 1fr; }
  .section-heading { display: block; }
  .section-heading > p { margin-top: 1rem; }
  .steps { grid-template-columns: 1fr; gap: 0; }
  .capabilities-layout { grid-template-columns: 1fr; }
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
  .hero-actions { width: 100%; }
  .hero-button { width: 100%; }
}
</style>