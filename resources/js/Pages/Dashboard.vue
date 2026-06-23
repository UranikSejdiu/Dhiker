<script setup>
import { Head, router, usePage } from '@inertiajs/vue3'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Fireworks from '../Components/Fireworks.vue'
import { APP_VERSION } from '../constants/version'
import FlagIcon from '../Components/FlagIcon.vue'
import { useLanguage } from '../composables/useLanguage'
import { useTheme } from '../composables/useTheme'
import { useSync } from '../composables/useSync'

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

const selectedDhikr = computed(() => props.dhikrs.find(d => d.id === selectedId.value) || null)

onMounted(() => {
  sync.loadFromServer(props.dhikrs)
  sync.loadFromStorage()
  if (props.dhikrs.length > 0) {
    selectedId.value = props.dhikrs[0].id
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
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && sync.hasPending.value) {
    sync.sync()
  }
}

function onBeforeUnload() {
  sync.syncBeforeUnload()
}

function onOnline() {
  if (sync.hasPending.value) {
    sync.sync()
  }
}

function onFocus() {
  if (sync.hasPending.value) {
    sync.sync()
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
  if (props.dhikrs.length < 2) return
  const idx = props.dhikrs.findIndex(d => d.id === selectedId.value)
  const next = dir === 'next' ? (idx + 1) % props.dhikrs.length : (idx - 1 + props.dhikrs.length) % props.dhikrs.length
  selectedId.value = props.dhikrs[next].id
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
            selectedId.value = props.dhikrs.length > 0 ? props.dhikrs[0].id : null
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

  <div :style="{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: colors.background, paddingBottom: '100px' }">

    <!-- Fireworks -->
    <Fireworks v-if="showFireworks" @complete="showFireworks = false" />

    <!-- Main counter view -->
    <template v-if="selectedDhikr">
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 20px 20px' }">
        <button @click="cycle('prev')" :style="{ padding: '10px', color: colors.textSecondary, fontSize: '30px', fontWeight: '300', background: 'none', border: 'none', cursor: 'pointer', lineHeight: '30px' }">
          <i class="fi fi-rr-angle-left"></i>
        </button>
        <div :style="{ color: colors.success, fontSize: '16px', fontWeight: '600', textAlign: 'center', flex: 1, padding: '0 10px', overflow: 'hidden', lineHeight: '22px' }">{{ selectedDhikr.name }}</div>
        <button @click="cycle('next')" :style="{ padding: '10px', color: colors.textSecondary, fontSize: '30px', fontWeight: '300', background: 'none', border: 'none', cursor: 'pointer', lineHeight: '30px' }">
          <i class="fi fi-rr-angle-right"></i>
        </button>
      </div>

      <div
        ref="fadeRef"
        @click="increment"
        :style="{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', userSelect: 'none', WebkitTapHighlightColor: 'transparent', cursor: 'pointer', opacity: 0, transform: 'translateY(10px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }"
      >
        <div :style="{ color: colors.textSecondary, fontSize: '160px', fontWeight: '200', letterSpacing: '-5px', textAlign: 'center', lineHeight: 1 }">
          {{ localTotal.toLocaleString() }}
        </div>
        <div v-if="showLimitWarning" :style="{ position: 'absolute', bottom: '100px', backgroundColor: `${colors.error}1A`, padding: '10px 20px', borderRadius: '20px', border: `1px solid ${colors.error}4D` }">
          <div :style="{ color: colors.error, fontSize: '14px', fontWeight: '500', textAlign: 'center' }">{{ t('limitReached') }}</div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <template v-else>
      <div :style="{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 40px' }">
        <div :style="{ fontSize: '56px', color: colors.primary, marginBottom: '16px', opacity: 0.6 }"><i class="fi fi-rr-star"></i></div>
        <div :style="{ color: colors.text, fontSize: '24px', fontWeight: '600', marginBottom: '8px' }">{{ t('noDhikrYet') }}</div>
        <div :style="{ color: colors.textSecondary, fontSize: '15px', marginBottom: '32px', textAlign: 'center' }">{{ t('addFirstDhikr') }}</div>
        <button @click="openCreateModal" :style="{ backgroundColor: colors.surface, border: `1px solid ${colors.primary}40`, borderRadius: '14px', padding: '14px 28px', color: colors.primary, fontSize: '16px', fontWeight: '600', cursor: 'pointer' }">{{ t('addDhikrBtn') }}</button>
      </div>
    </template>

    <!-- Toolbar -->
    <div :style="{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '8px 0 max(env(safe-area-inset-bottom, 20px), 20px)', pointerEvents: 'none', zIndex: 10 }">
      <div :style="{ display: 'flex', alignItems: 'center', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '32px', padding: '10px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', pointerEvents: 'auto' }">
        <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 22px', gap: '4px' }">
          <button @click="resetDaily" :style="{ width: '48px', height: '48px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary, fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }"><i class="fi fi-rr-refresh"></i></button>
          <span :style="{ color: colors.textMuted, fontSize: '10px', fontWeight: '500', textAlign: 'center' }">{{ t('resetLabel') }}</span>
        </div>
        <div :style="{ width: '1px', height: '32px', backgroundColor: colors.border, opacity: 0.5 }"></div>
        <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 22px', gap: '4px' }">
          <button @click="showDhikrsPanel = true" :style="{ width: '48px', height: '48px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary, fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }"><i class="fi fi-rr-menu-burger"></i></button>
          <span :style="{ color: colors.textMuted, fontSize: '10px', fontWeight: '500', textAlign: 'center' }">{{ t('dhikrsLabel') }}</span>
        </div>
        <div :style="{ width: '1px', height: '32px', backgroundColor: colors.border, opacity: 0.5 }"></div>
        <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 22px', gap: '4px' }">
          <button @click="showSettingsPanel = true" :style="{ width: '48px', height: '48px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary, fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }"><i class="fi fi-rr-settings"></i></button>
          <span :style="{ color: colors.textMuted, fontSize: '10px', fontWeight: '500', textAlign: 'center' }">{{ t('settingsLabel') }}</span>
        </div>
      </div>
    </div>

    <!-- Dhikrs Panel (bottom sheet) -->
    <div v-if="showDhikrsPanel" :style="{ position: 'fixed', inset: 0, backgroundColor: colors.overlay, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }" @click="showDhikrsPanel = false">
      <div :style="{ backgroundColor: colors.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', maxHeight: '85vh', borderTop: `1px solid ${colors.border}`, animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column' }" @click.stop>
        <div :style="{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }">
          <div :style="{ width: '40px', height: '4px', backgroundColor: `${colors.textSecondary}80`, borderRadius: '2px' }"></div>
        </div>
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${colors.border}` }">
          <div :style="{ color: colors.text, fontSize: '22px', fontWeight: '700' }">{{ t('myDhikrs') }}</div>
          <button @click="openCreateModal" :style="{ backgroundColor: colors.surfaceLight, padding: '8px 16px', borderRadius: '20px', border: `1px solid ${colors.border}`, color: colors.primary, fontWeight: '600', fontSize: '14px', cursor: 'pointer' }">{{ t('newBtn') }}</button>
        </div>
        <div :style="{ padding: '16px', overflowY: 'auto', flex: 1 }">
          <div v-if="dhikrs.length === 0" :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0 32px' }">
            <div :style="{ fontSize: '40px', color: colors.textMuted, marginBottom: '12px', opacity: 0.5 }"><i class="fi fi-rr-menu-burger"></i></div>
            <div :style="{ color: colors.textSecondary, fontSize: '16px', fontWeight: '600', marginBottom: '4px' }">{{ t('noDhikrsAdded') }}</div>
            <div :style="{ color: colors.textMuted, fontSize: '13px' }">{{ t('tapNewToCreate') }}</div>
          </div>
          <div
            v-for="d in dhikrs"
            :key="d.id"
            @click="selectedId = d.id; showDhikrsPanel = false"
            :style="{ backgroundColor: colors.surfaceLight, borderRadius: '14px', padding: '16px', border: `1px solid ${d.id === selectedId ? colors.primary + '60' : colors.border}`, marginBottom: '12px', cursor: 'pointer' }"
          >
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }">
              <div :style="{ color: colors.text, fontSize: '18px', fontWeight: '600', flex: 1, marginRight: '8px', overflow: 'hidden' }">{{ d.name }}</div>
              <div :style="{ display: 'flex', gap: '4px' }">
                <button @click.stop="openEditModal(d)" :style="{ padding: '6px', color: colors.textSecondary, fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }"><i class="fi fi-rr-edit"></i></button>
                <button @click.stop="deleteDhikr(d.id, d.name)" :style="{ padding: '6px', color: colors.error, fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }"><i class="fi fi-rr-trash"></i></button>
              </div>
            </div>
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
              <span :style="{ color: colors.textMuted, fontSize: '12px' }">{{ t('total') }} {{ sync.dhikrCounts.value[d.id]?.total_count ?? d.total_count }}</span>
              <span v-if="d.daily_limit !== null" :style="{ color: colors.primary, fontSize: '14px', fontWeight: '600' }">
                {{ sync.dhikrCounts.value[d.id]?.daily_count ?? d.daily_count }}/{{ d.daily_limit }}
              </span>
            </div>
            <div v-if="d.daily_limit !== null" :style="{ height: '4px', backgroundColor: colors.border, borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }">
              <div
                :style="{
                  height: '100%',
                  borderRadius: '2px',
                  transition: 'width 0.3s',
                  width: Math.min(((sync.dhikrCounts.value[d.id]?.daily_count ?? d.daily_count) || 0) / d.daily_limit * 100, 100) + '%',
                  backgroundColor: (sync.dhikrCounts.value[d.id]?.daily_count ?? d.daily_count) >= d.daily_limit ? colors.success : colors.primary
                }"
              />
            </div>
          </div>
          <div :style="{ height: '32px' }" />
        </div>
      </div>
    </div>

    <!-- Settings Panel (bottom sheet) -->
    <div v-if="showSettingsPanel" :style="{ position: 'fixed', inset: 0, backgroundColor: colors.overlay, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }" @click="showSettingsPanel = false">
      <div :style="{ backgroundColor: colors.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', maxHeight: '85vh', borderTop: `1px solid ${colors.border}`, animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column' }" @click.stop>
        <div :style="{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }">
          <div :style="{ width: '40px', height: '4px', backgroundColor: `${colors.textSecondary}80`, borderRadius: '2px' }"></div>
        </div>
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${colors.border}` }">
          <div :style="{ color: colors.text, fontSize: '22px', fontWeight: '700' }">{{ t('settings') }}</div>
          <button @click="showSettingsPanel = false" :style="{ color: colors.textSecondary, fontSize: '20px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }"><i class="fi fi-rr-cross-small"></i></button>
        </div>
        <div :style="{ padding: '24px', overflowY: 'auto', flex: 1 }">
          <!-- Account Section -->
          <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px', marginLeft: '4px' }">{{ t('accountSection') }}</div>
          <div :style="{ backgroundColor: colors.surfaceLight, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '24px' }">
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }">
              <span :style="{ color: colors.text, fontSize: '15px' }">{{ t('name') }}</span>
              <span :style="{ color: colors.textSecondary, fontSize: '15px', maxWidth: '55%', textAlign: 'right' }">{{ $page.props.auth.user.name }}</span>
            </div>
            <div :style="{ height: '1px', backgroundColor: colors.border, marginLeft: '16px' }"></div>
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }">
              <span :style="{ color: colors.text, fontSize: '15px' }">{{ t('email') }}</span>
              <span :style="{ color: colors.textSecondary, fontSize: '15px', maxWidth: '55%', textAlign: 'right' }">{{ $page.props.auth.user.email }}</span>
            </div>
          </div>

          <!-- Appearance Section -->
          <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px', marginLeft: '4px' }">{{ t('appearanceSection') }}</div>
          <div :style="{ backgroundColor: colors.surfaceLight, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '24px' }">
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }">
              <span :style="{ color: colors.text, fontSize: '15px' }">Theme</span>
              <div :style="{ display: 'flex', gap: '8px' }">
                <button
                  v-for="tn in themeNames"
                  :key="tn"
                  @click="setTheme(tn)"
                  :style="{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                    border: themeName === tn ? `2px solid ${colors.primary}` : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    backgroundColor: themes[tn].background
                  }"
                >
                  <div :style="{ width: '14px', height: '14px', borderRadius: '7px', backgroundColor: themes[tn].primary }" />
                </button>
              </div>
            </div>
          </div>

          <!-- Language Section -->
          <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px', marginLeft: '4px' }">{{ t('languageSection') }}</div>
          <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }">
            <button
              v-for="l in LANGUAGES_LIST"
              :key="l.code"
              @click="setLanguage(l.code)"
              :style="{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: language === l.code ? colors.surface : colors.surfaceLight,
                border: `1px solid ${language === l.code ? colors.primary : colors.border}`,
                borderRadius: '20px',
                padding: '10px 16px',
                gap: '8px',
                cursor: 'pointer'
              }"
            >
              <FlagIcon :countryCode="l.countryCode" :size="18" />
              <span :style="{ color: language === l.code ? colors.primary : colors.textSecondary, fontSize: '14px', fontWeight: '600' }">{{ l.name }}</span>
            </button>
          </div>

          <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px', marginLeft: '4px', marginTop: '24px' }">SYNC</div>
          <button @click="hardRefresh" :style="{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: colors.surfaceLight, borderRadius: '14px', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: '15px', cursor: 'pointer', textAlign: 'left' }">
            <span>{{ t('refreshFromServer') }}</span>
          </button>

          <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', marginBottom: '8px', marginLeft: '4px', marginTop: '24px' }">{{ t('aboutSection') }}</div>
          <div :style="{ backgroundColor: colors.surfaceLight, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden' }">
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }">
              <span :style="{ color: colors.text, fontSize: '15px' }">{{ t('version') }}</span>
              <span :style="{ color: colors.textSecondary, fontSize: '15px' }">{{ APP_VERSION }}</span>
            </div>
            <div :style="{ height: '1px', backgroundColor: colors.border, marginLeft: '16px' }"></div>
            <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }">
              <span :style="{ color: colors.text, fontSize: '15px' }">{{ t('madeBy') }}</span>
              <span :style="{ color: colors.textSecondary, fontSize: '15px' }">Uranik Sejdiu</span>
            </div>
          </div>

          <button @click="logout" :style="{ width: '100%', padding: '16px', borderRadius: '14px', textAlign: 'center', border: `1px solid ${colors.error}4D`, marginTop: '32px', color: colors.error, fontSize: '16px', fontWeight: '600', cursor: 'pointer', backgroundColor: `${colors.error}1A` }">
            {{ t('signOut') }}
          </button>
          <div :style="{ height: '40px' }" />
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" :style="{ position: 'fixed', inset: 0, backgroundColor: colors.overlay, zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }" @click="showModal = false">
      <div :style="{ backgroundColor: colors.surface, borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', border: `1px solid ${colors.border}` }" @click.stop>
        <div :style="{ color: colors.text, fontSize: '22px', fontWeight: '700', marginBottom: '20px' }">{{ editingId ? t('editDhikr') : t('newDhikr') }}</div>
        <div v-if="modalError" :style="{ color: colors.error, marginBottom: '16px', fontSize: '14px' }">{{ modalError }}</div>
        <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px', marginLeft: '4px' }">{{ t('nameLabel') }}</div>
        <input
          v-model="modalName"
          :placeholder="t('namePlaceholder')"
          :style="{ width: '100%', backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '14px', color: colors.text, fontSize: '16px', marginBottom: '16px', outline: 'none' }"
          @focus="(e) => e.target.style.borderColor = colors.primary"
          @blur="(e) => e.target.style.borderColor = colors.border"
          autofocus
        />
        <div :style="{ color: colors.textSecondary, fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px', marginLeft: '4px' }">{{ t('limitLabel') }}</div>
        <input
          v-model="modalLimit"
          type="number"
          :placeholder="t('limitPlaceholder')"
          :style="{ width: '100%', backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '14px', color: colors.text, fontSize: '16px', marginBottom: '16px', outline: 'none' }"
          @focus="(e) => e.target.style.borderColor = colors.primary"
          @blur="(e) => e.target.style.borderColor = colors.border"
        />
        <div :style="{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }">
          <button @click="showModal = false" :style="{ padding: '12px 20px', color: colors.textSecondary, fontWeight: '600', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer' }">{{ t('cancel') }}</button>
          <button @click="saveDhikr" :style="{ padding: '12px 24px', borderRadius: '12px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})`, color: colors.background, fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer' }">{{ t('saveBtn') }}</button>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="confirmAction" :style="{ position: 'fixed', inset: 0, backgroundColor: colors.overlay, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }" @click="confirmAction = null">
      <div :style="{ backgroundColor: colors.surface, borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', border: `1px solid ${colors.border}` }" @click.stop>
        <div :style="{ color: colors.text, fontSize: '20px', fontWeight: '700', marginBottom: '12px' }">{{ confirmAction.title }}</div>
        <div :style="{ color: colors.textSecondary, fontSize: '15px', marginBottom: '24px', lineHeight: '22px' }">{{ confirmAction.message }}</div>
        <div :style="{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }">
          <button @click="confirmAction = null" :style="{ padding: '12px 20px', color: colors.textSecondary, fontWeight: '600', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer' }">{{ t('cancel') }}</button>
          <button @click="confirmAction.onConfirm" :style="{ padding: '12px 24px', borderRadius: '12px', backgroundColor: colors.error, color: '#fff', fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer' }">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>

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
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
