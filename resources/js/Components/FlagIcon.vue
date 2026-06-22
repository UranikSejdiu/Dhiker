<script setup>
import { ref } from 'vue'

const props = defineProps({
  countryCode: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 20
  }
})

const failed = ref(false)
const code = props.countryCode.toLowerCase()
const uri = `https://flagcdn.com/w40/${code}.png`
</script>

<template>
  <span
    v-if="failed"
    :style="{
      width: Math.round(size * 1.4) + 'px',
      height: size + 'px',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: (size - 4) + 'px',
      backgroundColor: 'var(--card)',
      color: 'var(--text-muted)',
      fontWeight: '600'
    }"
  >
    {{ code.toUpperCase() }}
  </span>
  <img
    v-else
    :src="uri"
    :alt="`${countryCode.toUpperCase()} flag`"
    @error="failed = true"
    :style="{
      width: Math.round(size * 1.4) + 'px',
      height: size + 'px',
      borderRadius: '2px',
      display: 'block'
    }"
  />
</template>
