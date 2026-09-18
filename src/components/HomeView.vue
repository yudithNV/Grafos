<template>
  <main class="home-view">
    <!-- HERO PERSONALIZADO CON ÓRBITAS ANIMADAS -->
    <section class="hero-banner">
      <CanvasBackground :show-lines="false" :ball-count="50" />

      <div class="hero-orbit-container">
        <h1 class="home-title">
          Graphix
          <div class="glow-behind-title"></div>
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
</script>

<style scoped>
/* ===== HERO BANNER PERSONALIZADO ===== */
.home-view {
  width: 100%;
  background-color: var(--bg-body);
  display: flex;
  flex-direction: column;
}

.hero-banner {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem 1rem 4rem;
  background-color: var(--bg-body);
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

/* ===== NIEBLA MORADA DETRÁS DEL TÍTULO ===== */
.glow-behind-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 300px;
  background: var(--accent-solid);
  opacity: 0.16;
  filter: blur(70px);
  z-index: -1;
  pointer-events: none;
  border-radius: 50%;
}

/* ===== TÍTULO CON ÓRBITAS DENTRO ===== */
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

[data-theme='dark'] .home-title {
  color: #ffffff;
  background: none;
  -webkit-text-fill-color: #ffffff;
  filter:
    drop-shadow(0 0 6px  rgba(255, 255, 255, 0.45))
    drop-shadow(0 0 16px rgba(255, 255, 255, 0.25))
    drop-shadow(0 0 34px rgba(168, 85, 247, 0.25));
}

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
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

[data-theme='dark'] .home-subtitle {
  color: #f5f3ff;
  text-shadow:
    0 0 6px  rgba(255, 255, 255, 0.35),
    0 0 14px rgba(255, 255, 255, 0.18),
    0 0 28px rgba(168, 85, 247, 0.20);
}

[data-theme='light'] .home-subtitle {
  color: #4c4373;
  text-shadow:
    0 0 8px  rgba(168, 85, 247, 0.12),
    0 0 18px rgba(168, 85, 247, 0.06);
}

/* ===== ÓRBITAS ===== */
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