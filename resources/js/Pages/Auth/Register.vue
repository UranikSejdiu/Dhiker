<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3'
import { ref, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import { useTheme, toRgba } from '../../composables/useTheme'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'

const form = useForm({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const loading = ref(false)
const headerRef = ref(null)
const formRef = ref(null)

const { t } = useLanguage()
const { colors } = useTheme()

const submit = () => {
  loading.value = true
  form.post(route('register'), {
    onFinish: () => form.reset('password', 'password_confirmation'),
    onError: () => { loading.value = false },
  })
}

const handleGoogle = () => {
  loading.value = true
  window.location.href = route('google.redirect')
}

onMounted(() => {
  setTimeout(() => {
    if (headerRef.value) {
      headerRef.value.style.opacity = '1'
      headerRef.value.style.transform = 'scale(1)'
    }
    if (formRef.value) {
      formRef.value.style.opacity = '1'
      formRef.value.style.transform = 'translateY(0)'
    }
  }, 100)
})
</script>

<template>
  <Head :title="t('signUpBtn')" />

  <div
    class="min-h-screen flex items-center justify-center px-7"
    :style="{
      backgroundColor: 'var(--background)',
      backgroundImage: `radial-gradient(circle at top, ${toRgba(colors.primary, 0.12)} 0%, transparent 34%), radial-gradient(circle at bottom, ${toRgba(colors.accent, 0.08)} 0%, transparent 30%)`
    }"
  >
    <div
      class="w-full max-w-[420px]"
      :style="{
        borderRadius: '28px',
        padding: '28px 24px',
        backgroundColor: toRgba(colors.surface, 0.82),
        border: `1px solid ${colors.border}`,
        boxShadow: `0 18px 60px ${toRgba('#000000', 0.24)}`,
        backdropFilter: 'blur(14px)'
      }"
    >
      <div class="w-[60px] h-[3px] rounded-sm mx-auto mb-5" :style="{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})` }"></div>

      <div ref="headerRef" class="text-center mb-10" :style="{ opacity: 0, transform: 'scale(0.8)', transition: 'all 0.8s ease' }">
        <div class="w-[90px] h-[90px] rounded-full mx-auto mb-4 flex items-center justify-center" :style="{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: `0 10px 30px ${toRgba(colors.primary, 0.18)}` }">
          <span class="text-[42px]" :style="{ color: colors.primary }">☪</span>
        </div>
        <div class="text-[32px] font-bold tracking-wider mb-2" :style="{ color: colors.text }">{{ t('appTitle') }}</div>
        <div class="text-[22px] mb-1.5 font-light" :style="{ color: colors.primary }">بِسْمِ اللهِ</div>
        <div class="text-sm tracking-wide" :style="{ color: colors.textSecondary }">{{ t('subtitle') }}</div>
      </div>

      <div ref="formRef" :style="{ opacity: 0, transform: 'translateY(30px)', transition: 'all 0.8s ease 0.1s' }">
        <div
          v-if="form.errors.name || form.errors.email || form.errors.password || form.errors.password_confirmation"
          class="mb-5 p-3.5 rounded-xl text-center text-sm leading-tight"
          :style="{ backgroundColor: toRgba(colors.error, 0.10), border: `1px solid ${toRgba(colors.error, 0.24)}`, color: colors.error }"
        >
          {{ form.errors.name || form.errors.email || form.errors.password || form.errors.password_confirmation }}
        </div>

        <form @submit.prevent="submit">
          <div class="mb-[18px]">
            <label class="block text-xs font-semibold tracking-wider uppercase mb-2" :style="{ color: colors.primary }">{{ t('nameLabel') }}</label>
            <Input
              v-model="form.name"
              type="text"
              :placeholder="t('namePlaceholder')"
              autocomplete="name"
              :disabled="loading"
              class="h-12 rounded-xl bg-background/90 text-base"
            />
          </div>

          <div class="mb-[18px]">
            <label class="block text-xs font-semibold tracking-wider uppercase mb-2" :style="{ color: colors.primary }">{{ t('emailLabel') }}</label>
            <Input
              v-model="form.email"
              type="email"
              :placeholder="t('emailLabel')"
              autocomplete="email"
              :disabled="loading"
              class="h-12 rounded-xl bg-background/90 text-base"
            />
          </div>

          <div class="mb-[18px]">
            <label class="block text-xs font-semibold tracking-wider uppercase mb-2" :style="{ color: colors.primary }">{{ t('passwordLabel') }}</label>
            <Input
              v-model="form.password"
              type="password"
              :placeholder="t('passwordLabel')"
              autocomplete="new-password"
              :disabled="loading"
              class="h-12 rounded-xl bg-background/90 text-base"
            />
          </div>

          <div class="mb-[18px]">
            <label class="block text-xs font-semibold tracking-wider uppercase mb-2" :style="{ color: colors.primary }">{{ t('confirmPassword') }}</label>
            <Input
              v-model="form.password_confirmation"
              type="password"
              :placeholder="t('confirmPassword')"
              autocomplete="new-password"
              :disabled="loading"
              class="h-12 rounded-xl bg-background/90 text-base"
            />
          </div>

          <Button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 mb-6 text-base"
            :style="{ backgroundColor: colors.primary, border: 'none', color: colors.primaryForeground, boxShadow: `0 10px 24px ${toRgba(colors.primary, 0.24)}`, opacity: loading ? 0.7 : 1 }"
          >
            {{ loading ? '...' : t('signUpBtn') }}
          </Button>
        </form>

        <Button
          variant="outline"
          :disabled="loading"
          class="w-full mb-6 h-auto py-3.5"
          @click="handleGoogle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" class="mr-4 shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="text-base font-medium tracking-wide">{{ t('continueGoogle') }}</span>
        </Button>

        <div class="flex items-center mb-6">
          <div class="flex-1 h-px" :style="{ backgroundColor: colors.border }"></div>
          <span class="mx-4 text-xs" :style="{ color: toRgba(colors.primary, 0.45) }"><i class="fi fi-rr-star" :style="{ color: colors.primary, opacity: 0.65 }"></i></span>
          <div class="flex-1 h-px" :style="{ backgroundColor: colors.border }"></div>
        </div>

        <div class="text-center py-2 text-sm" :style="{ color: colors.textSecondary }">
          {{ t('hasAccount') }}
          <a :href="route('login')" class="font-semibold" :style="{ color: colors.primary }">{{ t('signInBtn') }}</a>
        </div>

        <div class="w-4/5 h-px mx-auto mt-8" :style="{ background: `linear-gradient(90deg, transparent, ${toRgba(colors.primary, 0.12)}, transparent)` }"></div>
      </div>
    </div>
  </div>
</template>
