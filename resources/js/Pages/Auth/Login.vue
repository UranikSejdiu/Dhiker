<script setup>
import { Head, useForm } from '@inertiajs/vue3'
import { ref, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import { useTheme } from '../../composables/useTheme'

const props = defineProps({
  status: String,
  canResetPassword: Boolean,
})

const form = useForm({
  email: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const headerRef = ref(null)
const formRef = ref(null)

const { t } = useLanguage()
const { colors } = useTheme()

const submit = () => {
  loading.value = true
  form.post(route('login'), {
    onFinish: () => { loading.value = false },
    onError: () => { loading.value = false },
  })
}

const handleGoogle = () => {
  loading.value = true
  window.location.href = route('google.redirect')
}

onMounted(() => {
  setTimeout(() => {
    if (headerRef.value) { headerRef.value.style.opacity = '1'; headerRef.value.style.transform = 'scale(1)' }
    if (formRef.value) { formRef.value.style.opacity = '1'; formRef.value.style.transform = 'translateY(0)' }
  }, 100)
})
</script>

<template>
  <Head :title="t('signInBtn')" />
  <div class="min-h-screen flex items-center justify-center px-7" :style="{ backgroundColor: colors.background }">
    <div class="w-full max-w-[420px]">
      <div class="w-[60px] h-[3px] rounded-sm mx-auto mb-2" :style="{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})` }"></div>

      <div ref="headerRef" class="text-center mb-10" style="opacity: 0; transform: scale(0.8); transition: all 0.8s ease">
        <div class="w-[90px] h-[90px] rounded-full mx-auto mb-4 flex items-center justify-center" :style="{ backgroundColor: colors.surface, border: `2px solid ${colors.border}`, boxShadow: `0 4px 12px ${colors.primary}40` }">
          <i class="fi fi-sr-star text-[42px]" :style="{ color: colors.primary }"></i>
        </div>
        <div class="text-[32px] font-bold tracking-wider mb-2" :style="{ color: colors.text }">{{ t('appTitle') }}</div>
        <div class="text-[22px] mb-[6px] font-light" :style="{ color: colors.primary }">بِسْمِ اللهِ</div>
        <div class="text-sm tracking-wide" :style="{ color: colors.textSecondary }">{{ t('subtitle') }}</div>
      </div>

      <div ref="formRef" style="opacity: 0; transform: translateY(30px); transition: all 0.8s ease 0.1s">
        <div v-if="status" class="mb-5 p-3.5 rounded-xl text-center text-sm leading-5" :style="{ backgroundColor: `${colors.primary}1F`, border: `1px solid ${colors.primary}40`, color: colors.primary }">
          {{ status }}
        </div>
        <div v-if="form.errors.email || form.errors.password" class="mb-5 p-3.5 rounded-xl text-center text-sm leading-5" :style="{ backgroundColor: `${colors.error}1F`, border: `1px solid ${colors.error}40`, color: colors.error }">
          {{ form.errors.email || form.errors.password }}
        </div>

        <form @submit.prevent="submit">
          <div class="mb-[18px]">
            <label class="block text-xs font-semibold tracking-[0.5px] uppercase mb-2" :style="{ color: colors.primary }">{{ t('emailLabel') }}</label>
            <input
              v-model="form.email"
              type="email"
              :placeholder="t('emailLabel')"
              class="w-full rounded-xl px-[18px] py-4 text-base outline-none transition-all duration-200"
              :style="{ backgroundColor: colors.surface, border: `1.5px solid ${colors.border}`, color: colors.text }"
              @focus="(e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 8px ${colors.primary}30` }"
              @blur="(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none' }"
              autocomplete="email"
              :disabled="loading"
            />
          </div>

          <div class="mb-[18px]">
            <label class="block text-xs font-semibold tracking-[0.5px] uppercase mb-2" :style="{ color: colors.primary }">{{ t('passwordLabel') }}</label>
            <input
              v-model="form.password"
              type="password"
              :placeholder="t('passwordLabel')"
              class="w-full rounded-xl px-[18px] py-4 text-base outline-none transition-all duration-200"
              :style="{ backgroundColor: colors.surface, border: `1.5px solid ${colors.border}`, color: colors.text }"
              @focus="(e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 8px ${colors.primary}30` }"
              @blur="(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none' }"
              autocomplete="current-password"
              :disabled="loading"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-xl py-[17px] text-center border-none text-[17px] font-bold tracking-[0.8px] mt-2 mb-6 transition-all duration-200"
            :style="{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})`, color: colors.background, boxShadow: `0 4px 12px ${colors.primary}60`, opacity: loading ? 0.7 : 1 }"
            :disabled="loading"
          >
            {{ loading ? '...' : t('signInBtn') }}
          </button>
        </form>

        <button
          @click="handleGoogle"
          class="w-full flex items-center justify-center rounded-xl px-[15px] py-[15px] mb-6 transition-all duration-200"
          style="background-color: #FFFFFF; border: 1px solid #DADCE0; box-shadow: 0 2px 4px rgba(0,0,0,0.08)"
          :style="{ opacity: loading ? 0.7 : 1 }"
          :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" class="mr-4">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="text-base font-medium tracking-[0.3px]" style="color: #1F1F1F">{{ t('continueGoogle') }}</span>
        </button>

        <div class="flex items-center mb-6">
          <div class="flex-1 h-px" :style="{ backgroundColor: colors.border }"></div>
          <span class="mx-4 text-xs" :style="{ color: `${colors.primary}4F` }"><i class="fi fi-rr-star" :style="{ color: colors.primary, opacity: 0.5 }"></i></span>
          <div class="flex-1 h-px" :style="{ backgroundColor: colors.border }"></div>
        </div>

        <div class="text-center py-2" :style="{ color: colors.textSecondary, fontSize: '15px' }">
          {{ t('noAccount') }}
          <a :href="route('register')" class="font-semibold" :style="{ color: colors.primary }">{{ t('signUpBtn') }}</a>
        </div>

        <div class="w-4/5 h-px mx-auto mt-8" :style="{ background: `linear-gradient(90deg, transparent, ${colors.primary}1F, transparent)` }"></div>
      </div>
    </div>
  </div>
</template>
