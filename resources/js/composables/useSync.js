import { ref } from 'vue'

const STORAGE_KEY = 'dhikr_sync'

const hasPending = ref(false)
const dhikrCounts = ref({})
let syncTimer = null

function loadFromServer(dhikrs) {
  const map = {}
  for (const d of dhikrs) {
    map[d.id] = { total_count: d.total_count ?? 0, daily_count: d.daily_count ?? 0 }
  }
  dhikrCounts.value = map
  checkDailyReset()
}

function checkDailyReset() {
  const today = new Date().toDateString()
  const lastSeen = localStorage.getItem('dhikr_last_seen')
  if (lastSeen && lastSeen !== today) {
    for (const id of Object.keys(dhikrCounts.value)) {
      dhikrCounts.value[id].daily_count = 0
    }
    persistToStorage()
  }
  localStorage.setItem('dhikr_last_seen', today)
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      for (const [id, counts] of Object.entries(stored)) {
        if (!dhikrCounts.value[id]) {
          dhikrCounts.value[id] = { total_count: counts.total_count, daily_count: counts.daily_count }
        }
      }
    }
  } catch {}
}

function persistToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dhikrCounts.value))
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    sync()
  }, 2000)
}

function increment(id) {
  if (!dhikrCounts.value[id]) return
  dhikrCounts.value[id].total_count++
  dhikrCounts.value[id].daily_count++
  persistToStorage()
  hasPending.value = true
  scheduleSync()
}

function resetCount(id) {
  if (!dhikrCounts.value[id]) return
  dhikrCounts.value[id].total_count = 0
  dhikrCounts.value[id].daily_count = 0
  persistToStorage()
  hasPending.value = true
  scheduleSync()
}

function sync() {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }

  if (!navigator.onLine) {
    hasPending.value = true
    return
  }

  const payload = Object.entries(dhikrCounts.value).map(([id, counts]) => ({
    id: Number(id),
    total_count: counts.total_count,
    daily_count: counts.daily_count,
  }))

  window.axios.post(route('dhikrs.sync'), { dhikrs: payload })
    .then(() => { hasPending.value = false })
    .catch(() => { hasPending.value = true })
}

function syncBeforeUnload() {
  if (!hasPending.value) return

  const payload = Object.entries(dhikrCounts.value).map(([id, counts]) => ({
    id: Number(id),
    total_count: counts.total_count,
    daily_count: counts.daily_count,
  }))

  try {
    const blob = new Blob([JSON.stringify({ dhikrs: payload })], { type: 'application/json' })
    navigator.sendBeacon(route('dhikrs.sync'), blob)
    hasPending.value = false
  } catch {}
}

export function useSync() {
  return {
    dhikrCounts,
    hasPending,
    loadFromServer,
    loadFromStorage,
    increment,
    resetCount,
    sync,
    syncBeforeUnload,
  }
}
