<template>
  <div class="starry-background">
    <div class="night">
      <!-- Generamos 40 estrellas fugaces distribuidas por toda la pantalla -->
      <div 
        v-for="n in 40" 
        :key="n" 
        class="shooting_star"
        :style="getRandomStyle()"
      ></div>
    </div>
  </div>
</template>

<script setup>
// Genera posiciones aleatorias en porcentaje y retrasos variados (más lentos)
const getRandomStyle = () => {
  const randomTop = Math.random() * 100;   // De 0% a 100% de la altura
  const randomLeft = Math.random() * 100;  // De 0% a 100% del ancho
  const randomDelay = Math.random() * 9000; // Retraso aleatorio hasta 9 segundos
  const randomDuration = Math.random() * 4000 + 4000; // Duración entre 4s y 8s (más lento y sutil)

  return {
    top: `${randomTop}%`,
    left: `${randomLeft}%`,
    animationDuration: `${randomDuration}ms`,
    animationDelay: `${randomDelay}ms`,
  };
};
</script>

<style scoped>
.starry-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: var(--starry-bg);   /* ← en vez del gradiente fijo */
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.night {
  position: relative;
  width: 100%;
  height: 100%;
  transform: rotateZ(45deg);
}

.shooting_star {
  position: absolute;
  height: 2px;
  background: linear-gradient(-45deg, var(--star-color), transparent);
  border-radius: 999px;
  filter: drop-shadow(0 0 4px var(--star-glow));
  opacity: 0.7;
  animation: tail ease-in-out infinite, shooting ease-in-out infinite;
}

.shooting_star::before,
.shooting_star::after {
  content: '';
  position: absolute;
  top: calc(50% - 1px);
  right: 0;
  height: 2px;
  background: linear-gradient(-45deg, transparent, var(--star-color), transparent);
  border-radius: 100%;
  animation: shining ease-in-out infinite;
}

.shooting_star::before {
  transform: translateX(50%) rotateZ(45deg);
}

.shooting_star::after {
  transform: translateX(50%) rotateZ(-45deg);
}

/* Hacemos que los pseudoelementos también respeten la duración dinámica que se inyecta */
.shooting_star,
.shooting_star::before,
.shooting_star::after {
  animation-duration: inherit;
  animation-delay: inherit;
}

@keyframes tail {
  0% {
    width: 0;
  }
  30% {
    width: 100px;
  }
  100% {
    width: 0;
  }
}

@keyframes shining {
  0% {
    width: 0;
  }
  50% {
    width: 30px;
  }
  100% {
    width: 0;
  }
}

@keyframes shooting {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(300px);
  }
}
</style>