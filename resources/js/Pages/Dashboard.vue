<script setup>
import { Head, router, usePage } from '@inertiajs/vue3'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import Fireworks from '../Components/Fireworks.vue'
import { APP_VERSION } from '../constants/version'
import FlagIcon from '../Components/FlagIcon.vue'
import { useLanguage } from '../composables/useLanguage'
import { useTheme, toRgba } from '../composables/useTheme'
import { useSync } from '../composables/useSync'
import { useOrder } from '../composables/useOrder'
import { usePwaInstall } from '../composables/usePwaInstall'
import { Button } from '@/Components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/Components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog'

const LANGUAGES_LIST = [
  { code: 'en', name: 'English', countryCode: 'gb' },
  { code: 'de', name: 'Deutsch', countryCode: 'de' },
  { code: 'fr', name: 'Français', countryCode: 'fr' },
  { code: 'sq', name: 'Shqip', countryCode: 'al' },
]

const props = defineProps({
  dhikrs: Array,
})

const { t, language, languages, setLanguage } = useLanguage()
const { themeName, themeNames, themes, colors, setTheme } = useTheme()
const sync = useSync()
const order = useOrder()
const pwa = usePwaInstall()

const selectedId = ref(null)
const showFireworks = ref(false)
const showLimitWarning = ref(false)
const showDhikrsPanel = ref(false)
const showSettingsPanel = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const modalName = ref('')
const modalLimit = ref('')
const modalError = ref('')
const confirmAction = ref(null)
const confirmDialogOpen = computed({
  get: () => confirmAction.value !== null,
  set: (v) => { if (!v) confirmAction.value = null }
})
const fadeRef = ref(null)
const loading = ref(false)

const localTotal = computed(() => {
  if (selectedId.value && sync.dhikrCounts.value[selectedId.value]) {
    return sync.dhikrCounts.value[selectedId.value].total_count
  }
  return 0
})
const localDaily = computed(() => {
  if (selectedId.value && sync.dhikrCounts.value[selectedId.value]) {
    return sync.dhikrCounts.value[selectedId.value].daily_count
  }
  return 0
})

const localDhikrs = ref([])

const selectedDhikr = computed(() => localDhikrs.value.find(d => d.id === selectedId.value) || null)

onMounted(() => {
  sync.loadFromServer(props.dhikrs)
  sync.loadFromStorage()

  // Server returns dhikrs sorted by sort_order — use as source of truth
  localDhikrs.value = [...props.dhikrs]

  order.persistOrder(localDhikrs.value.map(d => d.id))
  if (localDhikrs.value.length > 0) {
    selectedId.value = localDhikrs.value[0].id
  }
  setTimeout(() => {
    if (fadeRef.value) {
      fadeRef.value.style.opacity = '1'
      fadeRef.value.style.transform = 'translateY(0)'
    }
  }, 100)

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('online', onOnline)
  window.addEventListener('focus', onFocus)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('online', onOnline)
  window.removeEventListener('focus', onFocus)
  if (fadeTimer) clearTimeout(fadeTimer)
  sync.syncBeforeUnload()
  order.syncOrderBeforeUnload(localDhikrs.value.map(d => d.id))
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && sync.hasPending.value) {
    sync.sync()
  }
}

function onBeforeUnload() {
  sync.syncBeforeUnload()
  order.syncOrderBeforeUnload(localDhikrs.value.map(d => d.id))
}

function onOnline() {
  if (sync.hasPending.value) {
    sync.sync()
  }
  if (order.orderPending.value) {
    order.syncOrder(localDhikrs.value.map(d => d.id))
  }
}

function onFocus() {
  if (sync.hasPending.value) {
    sync.sync()
  }
  if (order.orderPending.value) {
    order.syncOrder(localDhikrs.value.map(d => d.id))
  }
}

let fadeTimer = null

watch(() => selectedId.value, (newId, oldId) => {
  if (oldId !== null && newId !== oldId) {
    sync.sync()
  }
  if (fadeRef.value) {
    fadeRef.value.style.opacity = '0'
    fadeRef.value.style.transform = 'translateY(10px)'
    if (fadeTimer) clearTimeout(fadeTimer)
    fadeTimer = setTimeout(() => {
      if (fadeRef.value) {
        fadeRef.value.style.opacity = '1'
        fadeRef.value.style.transform = 'translateY(0)'
      }
    }, 50)
  }
})

const cycle = (dir) => {
  if (localDhikrs.value.length < 2) return
  const idx = localDhikrs.value.findIndex(d => d.id === selectedId.value)
  const next = dir === 'next' ? (idx + 1) % localDhikrs.value.length : (idx - 1 + localDhikrs.value.length) % localDhikrs.value.length
  selectedId.value = localDhikrs.value[next].id
}

function onDragEnd() {
  const orderIds = localDhikrs.value.map(d => d.id)
  order.persistOrder(orderIds)
  order.syncOrder(orderIds)
}

const increment = () => {
  if (!selectedDhikr.value) return
  const d = selectedDhikr.value
  if (d.daily_limit !== null && localDaily.value >= d.daily_limit) {
    showLimitWarning.value = true
    setTimeout(() => { showLimitWarning.value = false }, 2000)
    return
  }
  const willHitLimit = d.daily_limit !== null && (localDaily.value + 1 >= d.daily_limit)
  sync.increment(selectedId.value)
  if (willHitLimit) {
    showFireworks.value = true
    setTimeout(() => { showFireworks.value = false }, 3000)
  }
}

const openCreateModal = () => {
  editingId.value = null
  modalName.value = ''
  modalLimit.value = ''
  modalError.value = ''
  showModal.value = true
}

const openEditModal = (dhikr) => {
  editingId.value = dhikr.id
  modalName.value = dhikr.name
  modalLimit.value = dhikr.daily_limit || ''
  modalError.value = ''
  showModal.value = true
}

const saveDhikr = () => {
  modalError.value = ''
  if (!modalName.value.trim()) {
    modalError.value = t('errorNoName')
    return
  }
  const limit = modalLimit.value ? parseInt(modalLimit.value, 10) : null
  if (limit !== null && (isNaN(limit) || limit <= 0)) {
    modalError.value = t('errorLimitPositive')
    return
  }
  if (editingId.value) {
    router.patch(route('dhikrs.update', editingId.value), {
      name: modalName.value.trim(),
      daily_limit: limit,
    }, {
      preserveScroll: true,
      onSuccess: () => { showModal.value = false },
      onError: (e) => { modalError.value = Object.values(e).join(', ') },
    })
  } else {
    router.post(route('dhikrs.store'), {
      name: modalName.value.trim(),
      daily_limit: limit,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        showModal.value = false
        nextTick(() => {
          const dhikrs = usePage().props.dhikrs
          if (dhikrs.length > 0) selectedId.value = dhikrs.at(-1).id
        })
      },
      onError: (e) => { modalError.value = Object.values(e).join(', ') },
    })
  }
}

const deleteDhikr = (id, name) => {
  confirmAction.value = {
    title: t('deleteConfirmTitle'),
    message: t('deleteConfirmBody', { name }),
    onConfirm: () => {
      router.delete(route('dhikrs.destroy', id), {
        preserveScroll: true,
        onSuccess: () => {
          confirmAction.value = null
          if (selectedId.value === id) {
            selectedId.value = localDhikrs.value.length > 0 ? localDhikrs.value[0].id : null
          }
        },
      })
    },
  }
}

const resetDaily = () => {
  if (!selectedDhikr.value) return
  confirmAction.value = {
    title: t('resetLabel'),
    message: t('resetDhikrConfirm'),
    onConfirm: () => {
      sync.resetCount(selectedId.value)
      confirmAction.value = null
    },
  }
}

const hardRefresh = () => {
  localStorage.removeItem('dhikr_sync')
  window.location.reload()
}

const logout = () => {
  router.post(route('logout'))
}
</script>

<template>
  <Head :title="t('appTitle')" />

  <div :style="{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: colors.background, backgroundImage: `radial-gradient(circle at top, ${toRgba(colors.primary, 0.10)} 0%, transparent 34%), radial-gradient(circle at bottom, ${toRgba(colors.accent, 0.08)} 0%, transparent 30%)`, paddingBottom: '100px' }">

    <!-- Fireworks -->
    <Fireworks v-if="showFireworks" @complete="showFireworks = false" />

    <!-- Main counter view -->
    <template v-if="selectedDhikr">
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 20px 20px' }">
        <button @click="cycle('prev')" :style="{ padding: '10px', color: colors.textSecondary, fontSize: '30px', fontWeight: '300', background: 'none', border: 'none', cursor: 'pointer', lineHeight: '30px' }">
          <i class="fi fi-rr-angle-left"></i>
        </button>
        <div :style="{ color: colors.primary, fontSize: '16px', fontWeight: '600', textAlign: 'center', flex: 1, padding: '0 10px', overflow: 'hidden', lineHeight: '22px' }">{{ selectedDhikr.name }}</div>
        <button @click="cycle('next')" :style="{ padding: '10px', color: colors.textSecondary, fontSize: '30px', fontWeight: '300', background: 'none', border: 'none', cursor: 'pointer', lineHeight: '30px' }">
          <i class="fi fi-rr-angle-right"></i>
        </button>
      </div>

      <div
        ref="fadeRef"
        @click="increment"
        :style="{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', userSelect: 'none', WebkitTapHighlightColor: 'transparent', cursor: 'pointer', opacity: 0, transform: 'translateY(10px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }"
      >
        <div :style="{ color: colors.text, fontSize: '160px', fontWeight: '200', letterSpacing: '-5px', textAlign: 'center', lineHeight: 1 }">
          {{ localTotal.toLocaleString() }}
        </div>
        <div v-if="showLimitWarning" :style="{ position: 'absolute', bottom: '100px', backgroundColor: toRgba(colors.error, 0.12), padding: '10px 20px', borderRadius: '20px', border: `1px solid ${toRgba(colors.error, 0.30)}` }">
          <div :style="{ color: colors.error, fontSize: '14px', fontWeight: '500', textAlign: 'center' }">{{ t('limitReached') }}</div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else>
      <div :style="{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 40px' }">
        <div :style="{ fontSize: '56px', color: colors.primary, marginBottom: '16px', opacity: 0.8, textShadow: `0 0 20px ${toRgba(colors.primary, 0.24)}` }"><i class="fi fi-rr-star"></i></div>
        <div :style="{ color: colors.text, fontSize: '24px', fontWeight: '600', marginBottom: '8px' }">{{ t('noDhikrYet') }}</div>
        <div :style="{ color: colors.textSecondary, fontSize: '15px', marginBottom: '32px', textAlign: 'center' }">{{ t('addFirstDhikr') }}</div>
        <button @click="openCreateModal" :style="{ backgroundColor: colors.surface, border: `1px solid ${toRgba(colors.primary, 0.28)}`, borderRadius: '14px', padding: '14px 28px', color: colors.primary, fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: `0 8px 24px ${toRgba(colors.primary, 0.08)}` }">{{ t('addDhikrBtn') }}</button>
      </div>
    </template>

    <!-- Toolbar -->
    <div class="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-10" :style="{ padding: '8px 0 max(env(safe-area-inset-bottom, 20px), 20px)' }">
      <div class="flex items-center rounded-full p-3.5 pointer-events-auto gap-1" :style="{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }">
        <div class="flex flex-col items-center px-6 gap-1.5">
          <Button variant="ghost" size="icon-lg" @click="resetDaily"><i class="fi fi-rr-refresh text-xl"></i></Button>
          <span class="text-xs font-semibold text-center text-muted-foreground">{{ t('resetLabel') }}</span>
        </div>
        <div class="w-px h-10" :style="{ backgroundColor: 'var(--border)', opacity: 0.5 }"></div>
        <div class="flex flex-col items-center px-6 gap-1.5">
          <Button variant="ghost" size="icon-lg" @click="showDhikrsPanel = true"><i class="fi fi-rr-menu-burger text-xl"></i></Button>
          <span class="text-xs font-semibold text-center text-muted-foreground">{{ t('dhikrsLabel') }}</span>
        </div>
        <div class="w-px h-10" :style="{ backgroundColor: 'var(--border)', opacity: 0.5 }"></div>
        <div class="flex flex-col items-center px-6 gap-1.5">
          <Button variant="ghost" size="icon-lg" @click="showSettingsPanel = true"><i class="fi fi-rr-settings text-xl"></i></Button>
          <span class="text-xs font-semibold text-center text-muted-foreground">{{ t('settingsLabel') }}</span>
        </div>
      </div>
    </div>

    <!-- Dhikrs Panel (bottom sheet) -->
    <Sheet v-model:open="showDhikrsPanel">
      <SheetContent side="bottom" class="max-h-[85vh] px-0 pb-0 flex flex-col overflow-hidden">
        <SheetHeader class="text-left px-4 pt-2 shrink-0">
          <div class="flex items-center justify-between w-full pr-8">
            <SheetTitle>{{ t('myDhikrs') }}</SheetTitle>
            <Button :style="{ backgroundColor: colors.surfaceLight, border: `1px solid ${colors.border}`, color: colors.primary, borderRadius: '10px', fontWeight: '600', fontSize: '14px', padding: '10px 22px' }" @click.stop="openCreateModal">{{ t('newBtn') }}</Button>
          </div>
        </SheetHeader>

        <div class="overflow-y-auto flex-1 px-4 pb-8">
          <template v-if="localDhikrs.length === 0">
            <div class="flex flex-col items-center py-12">
              <i class="fi fi-rr-menu-burger text-4xl text-muted-foreground/50 mb-3"></i>
              <p class="text-base font-semibold text-muted-foreground">{{ t('noDhikrsAdded') }}</p>
              <p class="text-sm text-muted-foreground/70">{{ t('tapNewToCreate') }}</p>
            </div>
          </template>

          <VueDraggable v-model="localDhikrs" handle=".drag-handle" ghost-class="opacity-40" :animation="200" @end="onDragEnd" class="space-y-3" v-else>
            <div v-for="d in localDhikrs" :key="d.id" class="rounded-xl p-4 bg-muted cursor-pointer" :style="{ border: `1px solid ${d.id === selectedId ? toRgba(colors.primary, 0.55) : 'var(--border)'}`, background: d.id === selectedId ? toRgba(colors.primary, 0.06) : 'var(--muted)' }" @click="selectedId = d.id; showDhikrsPanel = false">
              <div class="flex items-center gap-2.5">
                <button class="drag-handle text-muted-foreground text-lg leading-none cursor-grab active:cursor-grabbing select-none" :style="{ touchAction: 'none' }">⠿</button>
                <div class="text-foreground text-lg font-semibold flex-1 truncate">{{ d.name }}</div>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon-xs" @click.stop="openEditModal(d)"><i class="fi fi-rr-edit"></i></Button>
                  <Button variant="ghost" size="icon-xs" :style="{ color: 'var(--error)' }" @click.stop="deleteDhikr(d.id, d.name)"><i class="fi fi-rr-trash"></i></Button>
                </div>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-muted-foreground">{{ t('total') }} {{ sync.dhikrCounts.value[d.id]?.total_count ?? d.total_count }}</span>
                <span v-if="d.daily_limit !== null" class="text-sm font-semibold" :style="{ color: 'var(--primary)' }">
                  {{ sync.dhikrCounts.value[d.id]?.daily_count ?? d.daily_count }}/{{ d.daily_limit }}
                </span>
              </div>
              <div v-if="d.daily_limit !== null" class="h-1 rounded-full overflow-hidden mt-2.5" :style="{ backgroundColor: 'var(--border)' }">
                <div
                  :style="{
                    height: '100%', borderRadius: '999px', transition: 'width 0.3s',
                    width: Math.min(((sync.dhikrCounts.value[d.id]?.daily_count ?? d.daily_count) || 0) / d.daily_limit * 100, 100) + '%',
                    backgroundColor: (sync.dhikrCounts.value[d.id]?.daily_count ?? d.daily_count) >= d.daily_limit ? 'var(--success)' : 'var(--primary)'
                  }"
                />
              </div>
            </div>
          </VueDraggable>
          <div class="h-8"></div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Settings Panel (bottom sheet) -->
    <Sheet v-model:open="showSettingsPanel">
      <SheetContent side="bottom" class="max-h-[85vh] px-0 pb-0 flex flex-col overflow-hidden">
        <SheetHeader class="text-left px-4 pt-2 shrink-0">
          <SheetTitle>{{ t('settings') }}</SheetTitle>
        </SheetHeader>
        <div class="overflow-y-auto flex-1 px-4 pb-8 space-y-6">

          <!-- Account Section -->
          <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1">{{ t('accountSection') }}</p>
          <div class="rounded-xl bg-muted border border-border overflow-hidden">
            <div class="flex justify-between items-center p-4">
              <span class="text-sm text-foreground">{{ t('name') }}</span>
              <span class="text-sm text-muted-foreground max-w-[55%] text-right">{{ $page.props.auth.user.name }}</span>
            </div>
            <div class="h-px bg-border ml-4"></div>
            <div class="flex justify-between items-center p-4">
              <span class="text-sm text-foreground">{{ t('email') }}</span>
              <span class="text-sm text-muted-foreground max-w-[55%] text-right">{{ $page.props.auth.user.email }}</span>
            </div>
          </div>

          <!-- Appearance Section -->
          <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1">{{ t('appearanceSection') }}</p>
          <div class="rounded-xl bg-muted border border-border overflow-hidden">
            <div class="flex justify-between items-center p-4">
              <span class="text-sm text-foreground">Theme</span>
              <div class="flex gap-2">
                <button v-for="tn in themeNames" :key="tn" @click="setTheme(tn)" class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer p-0" :style="{ border: `2px solid ${themeName === tn ? colors.primary : 'transparent'}`, backgroundColor: themes[tn].surface, boxShadow: themeName === tn ? `0 0 0 3px ${toRgba(themes[tn].primary, 0.12)}` : 'none' }">
                  <div class="w-3.5 h-3.5 rounded-full" :style="{ backgroundColor: themes[tn].primary }"></div>
                </button>
              </div>
            </div>
          </div>

          <!-- Language Section -->
          <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1">{{ t('languageSection') }}</p>
          <div class="flex flex-wrap gap-2.5">
            <button v-for="l in LANGUAGES_LIST" :key="l.code" @click="setLanguage(l.code)" class="flex items-center gap-2 rounded-full px-4 py-2.5 cursor-pointer text-sm font-semibold" :style="{ backgroundColor: language === l.code ? toRgba(colors.primary, 0.10) : 'var(--surface-light)', border: `1px solid ${language === l.code ? toRgba(colors.primary, 0.28) : 'var(--border)'}` }">
              <FlagIcon :countryCode="l.countryCode" :size="18" />
              <span :style="{ color: language === l.code ? colors.primary : colors.textSecondary }">{{ l.name }}</span>
            </button>
          </div>

          <!-- Sync Section -->
          <div>
            <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1 mb-2">SYNC</p>
            <Button variant="outline" class="w-full justify-center" @click="hardRefresh">
              <span>{{ t('refreshFromServer') }}</span>
            </Button>
          </div>

          <!-- Install App -->
          <div v-if="pwa.canInstall.value">
            <Button variant="outline" class="w-full justify-center" @click="pwa.install">
              <i class="fi fi-rr-download mr-2"></i>
              {{ t('installApp') }}
            </Button>
          </div>

          <!-- About Section -->
          <div>
            <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1 mb-2">{{ t('aboutSection') }}</p>
            <div class="rounded-xl bg-muted border border-border overflow-hidden">
              <div class="flex justify-between items-center p-4">
                <span class="text-sm text-foreground">{{ t('version') }}</span>
                <span class="text-sm text-muted-foreground">{{ APP_VERSION }}</span>
              </div>
              <div class="h-px bg-border ml-4"></div>
              <div class="flex justify-between items-center p-4">
                <span class="text-sm text-foreground">{{ t('madeBy') }}</span>
                <span class="text-sm text-muted-foreground">Uranik Sejdiu</span>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <Button class="w-full" :style="{ backgroundColor: colors.error, color: colors.destructiveForeground, border: 'none' }" @click="logout">{{ t('signOut') }}</Button>
          </div>
          <div class="h-10"></div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Add/Edit Modal -->
    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? t('editDhikr') : t('newDhikr') }}</DialogTitle>
        </DialogHeader>
        <p v-if="modalError" class="text-sm" :style="{ color: 'var(--error)' }">{{ modalError }}</p>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1">{{ t('nameLabel') }}</p>
            <input v-model="modalName" :placeholder="t('namePlaceholder')" class="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-foreground text-base outline-none ring-0 focus:ring-2 focus:ring-ring" />
          </div>
          <div class="space-y-1.5">
            <p class="text-xs font-semibold tracking-wider text-muted-foreground ml-1">{{ t('limitLabel') }}</p>
            <input v-model="modalLimit" type="number" :placeholder="t('limitPlaceholder')" class="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-foreground text-base outline-none ring-0 focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-2">
          <Button variant="ghost" @click="showModal = false">{{ t('cancel') }}</Button>
          <Button @click="saveDhikr" :style="{ backgroundColor: colors.primary, border: 'none', color: colors.primaryForeground, boxShadow: `0 10px 24px ${toRgba(colors.primary, 0.22)}` }">{{ t('saveBtn') }}</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Confirm Dialog -->
    <Dialog v-model:open="confirmDialogOpen">
      <DialogContent class="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>{{ confirmAction?.title }}</DialogTitle>
          <DialogDescription>{{ confirmAction?.message }}</DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" @click="confirmAction = null">{{ t('cancel') }}</Button>
          <Button :style="{ backgroundColor: colors.error, color: colors.destructiveForeground, border: 'none' }" @click="confirmAction?.onConfirm">{{ t('confirm') }}</Button>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<style>
body {
  -webkit-user-select: none;
  user-select: none;
}
input, textarea, [contenteditable] {
  -webkit-user-select: text;
  user-select: text;
}

</style>
