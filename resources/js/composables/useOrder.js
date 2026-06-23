import { ref } from 'vue'

const STORAGE_KEY = 'dhikr_order'

const orderPending = ref(false)

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

function syncOrder(order) {
  if (!navigator.onLine) {
    orderPending.value = true
    return
  }

  window.axios.post(route('dhikrs.reorder'), { order })
    .then(() => { orderPending.value = false })
    .catch((err) => {
      orderPending.value = true
      console.error('Order sync failed:', err)
    })
}

function syncOrderBeforeUnload(order) {
  if (order.length === 0) return

  try {
    const blob = new Blob([JSON.stringify({ order })], { type: 'application/json' })
    navigator.sendBeacon(route('dhikrs.reorder'), blob)
  } catch {}
}

export function useOrder() {
  return {
    orderPending,
    loadOrderFromServer,
    loadOrderFromStorage,
    persistOrder,
    syncOrder,
    syncOrderBeforeUnload,
  }
}
