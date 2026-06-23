import { ref } from 'vue'

const STORAGE_KEY = 'dhikr_order'

const orderPending = ref(false)
let syncTimer = null

function loadOrderFromServer(dhikrs) {
  return dhikrs.map(d => d.id)
}

function loadOrderFromStorage(fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (Array.isArray(stored) && stored.length > 0) {
        return stored
      }
    }
  } catch {}
  return fallback
}

function persistOrder(order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
}

function scheduleSync(order) {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncOrder(order)
  }, 2000)
}

function syncOrder(order) {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }

  if (!navigator.onLine) {
    orderPending.value = true
    return
  }

  window.axios.post(route('dhikrs.reorder'), { order })
    .then(() => { orderPending.value = false })
    .catch(() => { orderPending.value = true })
}

function syncOrderBeforeUnload(order) {
  if (order.length === 0) return

  try {
    navigator.sendBeacon(route('dhikrs.reorder'), JSON.stringify({ order }))
  } catch {}
}

export function useOrder() {
  return {
    orderPending,
    loadOrderFromServer,
    loadOrderFromStorage,
    persistOrder,
    scheduleSync,
    syncOrder,
    syncOrderBeforeUnload,
  }
}
