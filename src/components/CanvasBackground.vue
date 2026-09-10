<template>
  <canvas ref="canvasRef" class="canvas-background"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ===== Props =====
const props = defineProps({
  // Muestra u oculta las líneas que conectan las bolas
  showLines: { type: Boolean, default: true },
  // Cantidad de bolas (estrellas) en el canvas
  ballCount: { type: Number, default: 30 }
})

const canvasRef = ref(null)
let animationFrameId = null
let observer = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  // ===== Detectar tema (reactivo) =====
  let isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  let ball_color = { r: 0, g: 0, b: 0 }
  let line_color = { r: 0, g: 0, b: 0 }

  const updatePalette = () => {
    isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    if (isDark) {
      // Dark: estrellas blancas
      ball_color = { r: 255, g: 255, b: 255 }
      line_color = { r: 255, g: 255, b: 255 }
    } else {
      // Light: lila/morado
      ball_color = { r: 168, g: 85,  b: 247 }
      line_color = { r: 139, g: 92,  b: 246 }
    }
  }
  updatePalette()

  // ===== Canvas setup =====
  let can_w = canvas.parentElement.clientWidth
  let can_h = canvas.parentElement.clientHeight
  canvas.width = can_w
  canvas.height = can_h

  const BALL_NUM = props.ballCount   // 👈 usa la prop
  const R = 2
  let balls = []
  const alpha_f = 0.03
  const link_line_width = 0.8
  const dis_limit = 260

  let mouse_in = false
  const mouse_ball = { x: 0, y: 0, vx: 0, vy: 0, r: 0, type: 'mouse' }

  function getRandomSpeed(pos) {
    const min = -1, max = 1
    switch (pos) {
      case 'top':    return [Math.random()*(max-min)+min, Math.random()*(max-0.1)+0.1]
      case 'right':  return [Math.random()*(-0.1-(-1))+(-1), Math.random()*(max-min)+min]
      case 'bottom': return [Math.random()*(max-min)+min, Math.random()*(-0.1-(-1))+(-1)]
      case 'left':   return [Math.random()*(max-0.1)+0.1, Math.random()*(max-min)+min]
      default:       return [0, 0]
    }
  }

  function randomArrayItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function getRandomBall() {
    const pos = randomArrayItem(['top', 'right', 'bottom', 'left'])
    switch (pos) {
      case 'top':    return { x: Math.ceil(Math.random() * can_w), y: -R,      vx: getRandomSpeed('top')[0],    vy: getRandomSpeed('top')[1],    r: R, alpha: 1, phase: Math.random() * 10 }
      case 'right':  return { x: can_w + R,                        y: Math.ceil(Math.random() * can_h), vx: getRandomSpeed('right')[0],  vy: getRandomSpeed('right')[1],  r: R, alpha: 1, phase: Math.random() * 10 }
      case 'bottom': return { x: Math.ceil(Math.random() * can_w), y: can_h + R, vx: getRandomSpeed('bottom')[0], vy: getRandomSpeed('bottom')[1], r: R, alpha: 1, phase: Math.random() * 10 }
      case 'left':   return { x: -R,                                y: Math.ceil(Math.random() * can_h), vx: getRandomSpeed('left')[0],   vy: getRandomSpeed('left')[1],   r: R, alpha: 1, phase: Math.random() * 10 }
    }
  }

  function initBalls(num) {
    for (let i = 1; i <= num; i++) {
      balls.push({
        x: Math.ceil(Math.random() * can_w),
        y: Math.ceil(Math.random() * can_h),
        vx: getRandomSpeed('top')[0],
        vy: getRandomSpeed('top')[1],
        r: R,
        alpha: 1,
        phase: Math.random() * 10
      })
    }
  }

  function render() {
    ctx.clearRect(0, 0, can_w, can_h)

    // ===== Balls =====
    balls.forEach(b => {
      if (!b.hasOwnProperty('type')) {
        const a = b.alpha

        if (isDark) {
          // ✨ Glow blanco tipo estrella
          ctx.shadowBlur = 12
          ctx.shadowColor = `rgba(255, 255, 255, ${a * 0.9})`
        }

        ctx.fillStyle = `rgba(${ball_color.r},${ball_color.g},${ball_color.b},${a})`
        ctx.beginPath()
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.fill()

        // Reset sombra
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }
    })

    // ===== Lines =====
    if (props.showLines) {                          // 👈 condicional
      const lineBoost = isDark ? 0.35 : 0.55
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const dx = Math.abs(balls[i].x - balls[j].x)
          const dy = Math.abs(balls[i].y - balls[j].y)
          const dis = Math.sqrt(dx * dx + dy * dy)
          const fraction = dis / dis_limit

          if (fraction < 1) {
            const alpha = (1 - fraction) * lineBoost
            ctx.strokeStyle = `rgba(${line_color.r},${line_color.g},${line_color.b},${alpha})`
            ctx.lineWidth = link_line_width
            ctx.beginPath()
            ctx.moveTo(balls[i].x, balls[i].y)
            ctx.lineTo(balls[j].x, balls[j].y)
            ctx.stroke()
            ctx.closePath()
          }
        }
      }
    }

    // ===== Update =====
    let new_balls = []
    balls.forEach(b => {
      b.x += b.vx
      b.y += b.vy
      if (b.x > -50 && b.x < can_w + 50 && b.y > -50 && b.y < can_h + 50) {
        new_balls.push(b)
      }
      b.phase += alpha_f
      b.alpha = Math.abs(Math.cos(b.phase))
    })
    balls = new_balls

    if (balls.length < BALL_NUM) {
      balls.push(getRandomBall())
    }

    animationFrameId = window.requestAnimationFrame(render)
  }

  initBalls(BALL_NUM)
  render()

  // ===== Resize =====
  const handleResize = () => {
    if (!canvas.parentElement) return
    can_w = canvas.parentElement.clientWidth
    can_h = canvas.parentElement.clientHeight
    canvas.width = can_w
    canvas.height = can_h
  }
  window.addEventListener('resize', handleResize)

  // ===== Mouse =====
  const parent = canvas.parentElement
  const onEnter = () => { mouse_in = true; balls.push(mouse_ball) }
  const onLeave = () => { mouse_in = false; balls = balls.filter(b => !b.hasOwnProperty('type')) }
  const onMove = (e) => {
    const rect = parent.getBoundingClientRect()
    mouse_ball.x = e.clientX - rect.left
    mouse_ball.y = e.clientY - rect.top
  }
  parent.addEventListener('mouseenter', onEnter)
  parent.addEventListener('mouseleave', onLeave)
  parent.addEventListener('mousemove', onMove)

  // ===== 🔄 Detecta cambio de tema EN VIVO =====
  observer = new MutationObserver(() => {
    updatePalette()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    parent.removeEventListener('mouseenter', onEnter)
    parent.removeEventListener('mouseleave', onLeave)
    parent.removeEventListener('mousemove', onMove)
    window.cancelAnimationFrame(animationFrameId)
    if (observer) observer.disconnect()
  })
})
</script>

<style scoped>
.canvas-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>