<template>
  <canvas ref="canvasRef" class="canvas-background"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationFrameId = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  let can_w = canvas.parentElement.clientWidth
  let can_h = canvas.parentElement.clientHeight
  canvas.width = can_w
  canvas.height = can_h

  const BALL_NUM = 30
  const R = 2
  let balls = []
  const ball_color = { r: 168, g: 85, b: 247 }
  const alpha_f = 0.03
  const link_line_width = 0.8
  const dis_limit = 260
  
  let mouse_in = false
  const mouse_ball = { x: 0, y: 0, vx: 0, vy: 0, r: 0, type: 'mouse' }

  function getRandomSpeed(pos) {
    const min = -1, max = 1
    switch (pos) {
      case 'top': return [Math.random()*(max-min)+min, Math.random()*(max-0.1)+0.1]
      case 'right': return [Math.random()*(-0.1-(-1))+(-1), Math.random()*(max-min)+min]
      case 'bottom': return [Math.random()*(max-min)+min, Math.random()*(-0.1-(-1))+(-1)]
      case 'left': return [Math.random()*(max-0.1)+0.1, Math.random()*(max-min)+min]
      default: return [0, 0]
    }
  }

  function randomArrayItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function getRandomBall() {
    const pos = randomArrayItem(['top', 'right', 'bottom', 'left'])
    switch (pos) {
      case 'top': return { x: Math.ceil(Math.random() * can_w), y: -R, vx: getRandomSpeed('top')[0], vy: getRandomSpeed('top')[1], r: R, alpha: 1, phase: Math.random() * 10 }
      case 'right': return { x: can_w + R, y: Math.ceil(Math.random() * can_h), vx: getRandomSpeed('right')[0], vy: getRandomSpeed('right')[1], r: R, alpha: 1, phase: Math.random() * 10 }
      case 'bottom': return { x: Math.ceil(Math.random() * can_w), y: can_h + R, vx: getRandomSpeed('bottom')[0], vy: getRandomSpeed('bottom')[1], r: R, alpha: 1, phase: Math.random() * 10 }
      case 'left': return { x: -R, y: Math.ceil(Math.random() * can_h), vx: getRandomSpeed('left')[0], vy: getRandomSpeed('left')[1], r: R, alpha: 1, phase: Math.random() * 10 }
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
    
    // Render Balls
    balls.forEach(b => {
      if (!b.hasOwnProperty('type')) {
        ctx.fillStyle = `rgba(${ball_color.r},${ball_color.g},${ball_color.b},${b.alpha})`
        ctx.beginPath()
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.fill()
      }
    })

    // Render Lines
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const dx = Math.abs(balls[i].x - balls[j].x)
        const dy = Math.abs(balls[i].y - balls[j].y)
        const dis = Math.sqrt(dx * dx + dy * dy)
        const fraction = dis / dis_limit

        if (fraction < 1) {
          const alpha = (1 - fraction).toString()
          ctx.strokeStyle = `rgba(150,150,150,${alpha})`
          ctx.lineWidth = link_line_width
          ctx.beginPath()
          ctx.moveTo(balls[i].x, balls[i].y)
          ctx.lineTo(balls[j].x, balls[j].y)
          ctx.stroke()
          ctx.closePath()
        }
      }
    }

    // Update Balls
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

  // Resize listener para adaptarse al contenedor
  const handleResize = () => {
    if (!canvas.parentElement) return
    can_w = canvas.parentElement.clientWidth
    can_h = canvas.parentElement.clientHeight
    canvas.width = can_w
    canvas.height = can_h
  }
  window.addEventListener('resize', handleResize)

  // Mouse interactions dentro del bloque de contenido
  const parent = canvas.parentElement
  parent.addEventListener('mouseenter', () => {
    mouse_in = true
    balls.push(mouse_ball)
  })
  parent.addEventListener('mouseleave', () => {
    mouse_in = false
    balls = balls.filter(b => !b.hasOwnProperty('type'))
  })
  parent.addEventListener('mousemove', (e) => {
    const rect = parent.getBoundingClientRect()
    mouse_ball.x = e.clientX - rect.left
    mouse_ball.y = e.clientY - rect.top
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.cancelAnimationFrame(animationFrameId)
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
  z-index: 1; /* Detrás del contenido interno */
}
</style>