<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const emit = defineEmits(['complete'])

const show = ref(true)
const particles = ref([])
const COLORS = ['#C9A84C', '#E8D48B', '#2ECC71', '#E74C3C', '#F39C12', '#4A90D9', '#FFFFFF']

function burst(cx, cy) {
  const newParticles = []
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.3
    const speed = 2 + Math.random() * 4
    newParticles.push({
      id: Date.now() + i + Math.random(),
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
      size: 2 + Math.random() * 3,
    })
  }
  particles.value = [...particles.value, ...newParticles]
}

const timeouts = []
let animInterval = null

onMounted(() => {
  const w = window.innerWidth
  const h = window.innerHeight
  burst(w * 0.5, h * 0.4)
  timeouts.push(setTimeout(() => burst(w * 0.3, h * 0.3), 200))
  timeouts.push(setTimeout(() => burst(w * 0.7, h * 0.35), 400))
  timeouts.push(setTimeout(() => burst(w * 0.5, h * 0.5), 600))

  animInterval = setInterval(() => {
    particles.value = particles.value
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.05,
        life: p.life - 0.02,
      }))
      .filter((p) => p.life > 0)
    if (particles.value.length === 0) {
      clearInterval(animInterval)
      timeouts.push(setTimeout(() => { show.value = false }, 300))
    }
  }, 20)
})

onUnmounted(() => {
  timeouts.forEach(clearTimeout)
  if (animInterval) clearInterval(animInterval)
})

watch(show, (val) => {
  if (!val) emit('complete')
})
</script>

<template>
  <div v-if="show" style="position: fixed; inset: 0; z-index: 9999; pointer-events: none; overflow: hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      :style="{
        position: 'absolute',
        left: p.x + 'px',
        top: p.y + 'px',
        width: p.size + 'px',
        height: p.size + 'px',
        borderRadius: '50%',
        backgroundColor: p.color,
        opacity: Math.max(0, p.life),
        transform: 'translate(-50%, -50%)',
      }"
    />
  </div>
</template>
