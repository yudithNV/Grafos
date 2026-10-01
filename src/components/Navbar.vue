<template>
  <nav class="navbar">
    <button class="navbar-brand" @click="$emit('navigate', 'home')">
      <svg viewBox="0 0 40 40" class="brand-logo">
        <line x1="20" y1="8" x2="9" y2="28" class="brand-edge brand-edge-a" />
        <line x1="20" y1="8" x2="31" y2="28" class="brand-edge brand-edge-b" />
        <line x1="9" y1="28" x2="31" y2="28" class="brand-edge brand-edge-c" />
        <circle cx="20" cy="8" r="4" class="brand-node brand-node-a" />
        <circle cx="9" cy="28" r="4" class="brand-node brand-node-b" />
        <circle cx="31" cy="28" r="4" class="brand-node brand-node-c" />
      </svg>
      <span class="brand-name">Graphix</span>
    </button>

    <button class="menu-toggle" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen" aria-label="Abrir menú">
      <X v-if="menuOpen" class="menu-icon" />
      <Menu v-else class="menu-icon" />
    </button>

    <div class="navbar-links" :class="{ 'navbar-links-open': menuOpen }">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-link"
        :class="{ 'nav-link-active': current === item.id }"
        @click="navigateTo(item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <button
      class="theme-toggle"
      @click="$emit('toggle-theme')"
      :title="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    >
      <Sun v-if="theme === 'dark'" class="theme-icon" />
      <Moon v-else class="theme-icon" />
    </button>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { Menu, Moon, Sun, X } from '@lucide/vue'

defineProps({
  current: { type: String, default: 'home' },
  theme: { type: String, default: 'light' }
})

const emit = defineEmits(['navigate', 'toggle-theme'])
const menuOpen = ref(false)
const navigateTo = (id) => {
  menuOpen.value = false
  emit('navigate', id)
}

const navItems = [
  { id: 'home', label: 'Inicio' },
  { id: 'teoria', label: 'Fundamentos' },
  { id: 'interactivos', label: 'Algoritmos Interactivos' },
  { id: 'about', label: 'Quiénes somos' }
]
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;

  /* ===== EFECTO GLASSMORPHISM ===== */
  background: rgba(255, 255, 255, 0);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);

  /* ===== NAVBAR FIJO ===== */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 1000;
}

/* ===== MODO OSCURO (sin cambios) ===== */
[data-theme='dark'] .navbar {
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

/* ===== MODO CLARO: cristal azul marino (combina con el hero) ===== */
[data-theme='light'] .navbar {
  background: rgba(27, 41, 71, 0.70);
  border-bottom: 1px solid rgba(247, 247, 182, 0.18);
  box-shadow: 0 4px 30px rgba(27, 41, 71, 0.25);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.brand-logo {
  width: 1.75rem;
  height: 1.75rem;
}

.brand-edge {
  stroke-width: 3px;
  stroke-linecap: round;
}

.brand-edge-a { stroke: var(--accent-start); }
.brand-edge-b { stroke: var(--accent-end); }
.brand-edge-c { stroke: #ec4899; }

.brand-node {
  stroke: var(--bg-surface);
  stroke-width: 1.5px;
}

.brand-node-a { fill: var(--accent-start); }
.brand-node-b { fill: #ec4899; }
.brand-node-c { fill: var(--accent-end); }

/* ===== NOMBRE DEL SISTEMA ===== */
.brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  transition: all 0.3s ease;
}

/* Oscuro: blanco con brillo neón */
[data-theme='dark'] .brand-name {
  color: #ffffff;
  text-shadow:
    0 0 5px  #ffffff,
    0 0 10px #ffffff;
}

/* Claro: blanco con brillo suave */
[data-theme='light'] .brand-name {
  color: #ffffff;
  text-shadow:
    0 0 6px  rgba(255, 255, 255, 0.55),
    0 0 14px rgba(233, 111, 146, 0.45);
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
}

.menu-toggle {
  display: none;
  border: 1px solid var(--border-color);
  border-radius: .55rem;
  padding: .45rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
}
.menu-icon { width: 1.2rem; height: 1.2rem; }

[data-theme='light'] .menu-toggle {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.nav-link {
  padding: 0.5rem 0.9rem;
  background: none;
  border: none;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Claro: links blancos legibles sobre el cristal azul */
[data-theme='light'] .nav-link {
  color: rgba(255, 255, 255, 0.78);
}

[data-theme='light'] .nav-link:hover {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
}

/* ===== BOTÓN ACTIVO - SOLO LAS LETRAS BRILLAN ===== */
.nav-link-active {
  font-weight: 600;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Oscuro: blanco con glow */
[data-theme='dark'] .nav-link-active {
  color: #ffffff;
  text-shadow:
    0 0 4px  rgba(255, 255, 255, 0.55),
    0 0 10px rgba(255, 255, 255, 0.30),
    0 0 20px rgba(168, 85, 247, 0.20);
}

/* Claro: blanco con glow rosado (paleta del hero) */
[data-theme='light'] .nav-link-active {
  color: #ffffff;
  text-shadow:
    0 0 6px  rgba(255, 255, 255, 0.55),
    0 0 14px rgba(233, 111, 146, 0.65),
    0 0 26px rgba(233, 111, 146, 0.35);
}

/* Línea indicadora debajo del texto activo */
.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  border-radius: 2px;
}

/* Oscuro: línea blanca */
[data-theme='dark'] .nav-link-active::after {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}

/* Claro: línea crema/rosa */
[data-theme='light'] .nav-link-active::after {
  background: linear-gradient(90deg, transparent, #F7F7B6, transparent);
  box-shadow: 0 0 10px rgba(233, 111, 146, 0.8);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

[data-theme='dark'] .theme-toggle {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

[data-theme='light'] .theme-toggle {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.28);
  color: #ffffff;
}

.theme-toggle:hover {
  border-color: var(--accent-solid);
  color: var(--accent-solid);
  background: rgba(255, 255, 255, 0.1);
}

[data-theme='light'] .theme-toggle:hover {
  border-color: #F7F7B6;
  color: #F7F7B6;
  background: rgba(255, 255, 255, 0.18);
}

.theme-icon {
  width: 1.1rem;
  height: 1.1rem;
}

@media (max-width: 820px) {
  .navbar {
    padding: 0.6rem 0.85rem;
    flex-wrap: wrap;
  }
  .brand-name {
    font-size: 1rem;
  }
  .navbar-brand { flex: 1; }
  .menu-toggle { display: flex; order: 2; }
  .theme-toggle { order: 3; }
  .navbar-links {
    order: 4;
    flex-basis: 100%;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: .25rem;
    padding: .65rem 0 .15rem;
    border-top: 1px solid var(--border-color);
  }
  [data-theme='light'] .navbar-links {
    border-top-color: rgba(255, 255, 255, 0.2);
  }
  .navbar-links-open { display: flex; }
  .nav-link {
    width: 100%;
    padding: .7rem .8rem;
    text-align: left;
    font-size: .85rem;
  }
}
</style>