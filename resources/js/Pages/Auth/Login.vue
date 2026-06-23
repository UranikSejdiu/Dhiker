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
  <div :style="{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px', backgroundColor: colors.background }">
    <div :style="{ width: '100%', maxWidth: '420px' }">
      <div :style="{ width: '60px', height: '3px', borderRadius: '3px', margin: '0 auto 8px', background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})` }"></div>

      <div ref="headerRef" :style="{ textAlign: 'center', marginBottom: '40px', opacity: 0, transform: 'scale(0.8)', transition: 'all 0.8s ease' }">
        <div :style="{ width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, border: `2px solid ${colors.border}`, boxShadow: `0 4px 12px ${colors.primary}40` }">
          <span :style="{ fontSize: '42px', color: colors.primary }">☪</span>
        </div>
        <div :style="{ fontSize: '32px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px', color: colors.text }">{{ t('appTitle') }}</div>
        <div :style="{ fontSize: '22px', marginBottom: '6px', fontWeight: '300', color: colors.primary }">بِسْمِ اللهِ</div>
        <div :style="{ fontSize: '14px', letterSpacing: '0.025em', color: colors.textSecondary }">{{ t('subtitle') }}</div>
      </div>

      <div ref="formRef" :style="{ opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s ease 0.1s' }">
        <div v-if="status" :style="{ marginBottom: '20px', padding: '14px', borderRadius: '12px', textAlign: 'center', fontSize: '14px', lineHeight: '1.25', backgroundColor: `${colors.primary}1F`, border: `1px solid ${colors.primary}40`, color: colors.primary }">
          {{ status }}
        </div>
        <div v-if="form.errors.email || form.errors.password" :style="{ marginBottom: '20px', padding: '14px', borderRadius: '12px', textAlign: 'center', fontSize: '14px', lineHeight: '1.25', backgroundColor: `${colors.error}1F`, border: `1px solid ${colors.error}40`, color: colors.error }">
          {{ form.errors.email || form.errors.password }}
        </div>

        <form @submit.prevent="submit">
          <div :style="{ marginBottom: '18px' }">
            <label :style="{ display: 'block', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', color: colors.primary }">{{ t('emailLabel') }}</label>
            <input
              v-model="form.email"
              type="email"
              :placeholder="t('emailLabel')"
              autocomplete="email"
              :disabled="loading"
              :style="{ width: '100%', borderRadius: '12px', padding: '16px 18px', fontSize: '16px', outline: 'none', transition: 'all 0.2s', backgroundColor: colors.surface, border: `1.5px solid ${colors.border}`, color: colors.text }"
              @focus="(e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 8px ${colors.primary}30` }"
              @blur="(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none' }"
            />
          </div>

          <div :style="{ marginBottom: '18px' }">
            <label :style="{ display: 'block', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', color: colors.primary }">{{ t('passwordLabel') }}</label>
            <input
              v-model="form.password"
              type="password"
              :placeholder="t('passwordLabel')"
              autocomplete="current-password"
              :disabled="loading"
              :style="{ width: '100%', borderRadius: '12px', padding: '16px 18px', fontSize: '16px', outline: 'none', transition: 'all 0.2s', backgroundColor: colors.surface, border: `1.5px solid ${colors.border}`, color: colors.text }"
              @focus="(e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 8px ${colors.primary}30` }"
              @blur="(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none' }"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            :style="{ width: '100%', borderRadius: '12px', padding: '17px', textAlign: 'center', border: 'none', fontSize: '17px', fontWeight: '700', letterSpacing: '0.8px', marginTop: '8px', marginBottom: '24px', transition: 'all 0.2s', background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})`, color: colors.background, boxShadow: `0 4px 12px ${colors.primary}60`, opacity: loading ? 0.7 : 1 }"
          >
            {{ loading ? '...' : t('signInBtn') }}
          </button>
        </form>

        <button
          @click="handleGoogle"
          :disabled="loading"
          :style="{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '15px', marginBottom: '24px', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, backgroundColor: '#FFFFFF', border: '1px solid #DADCE0', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" :style="{ marginRight: '16px' }">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span :style="{ fontSize: '16px', fontWeight: '500', letterSpacing: '0.3px', color: '#1F1F1F' }">{{ t('continueGoogle') }}</span>
        </button>

        <div :style="{ display: 'flex', alignItems: 'center', marginBottom: '24px' }">
          <div :style="{ flex: 1, height: '1px', backgroundColor: colors.border }"></div>
          <span :style="{ margin: '0 16px', fontSize: '12px', color: `${colors.primary}4F` }"><i class="fi fi-rr-star" :style="{ color: colors.primary, opacity: 0.5 }"></i></span>
          <div :style="{ flex: 1, height: '1px', backgroundColor: colors.border }"></div>
        </div>

        <div :style="{ textAlign: 'center', padding: '8px 0', color: colors.textSecondary, fontSize: '15px' }">
          {{ t('noAccount') }}
          <a :href="route('register')" :style="{ fontWeight: '600', color: colors.primary }">{{ t('signUpBtn') }}</a>
        </div>

        <div :style="{ width: '80%', height: '1px', margin: '32px auto 0', background: `linear-gradient(90deg, transparent, ${colors.primary}1F, transparent)` }"></div>
      </div>
    </div>
  </div>
</template>
