<script setup>
import { AlertCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { storeSiteToken } from '~/utils/auth'

const { t } = useI18n()

const LoginSchema = z.object({
  token: z.string().describe('SiteToken'),
})
const loginFieldConfig = {
  token: {
    inputProps: {
      type: 'password',
      placeholder: '********',
    },
  },
}

const { previewMode } = useRuntimeConfig().public
const isLoading = ref(false)

// Prefill the token if in dev/preview mode
onMounted(() => {
  if (previewMode && process.env.NODE_ENV !== 'production') {
    // Automatically prefill the SinkCool token in development/preview mode
    setTimeout(() => {
      document.querySelector('input[type="password"]').value = 'SinkCool'
    }, 100)
  }
})

async function onSubmit(form) {
  isLoading.value = true
  try {
    // Store token in our utility
    storeSiteToken(form.token)
    // Also store in original location for backward compatibility
    localStorage.setItem('SinkSiteToken', form.token)

    // Verify the token with the API
    await useAPI('/api/verify')

    // Navigate to dashboard on success
    navigateTo('/dashboard')
  }
  catch (e) {
    console.error(e)
    toast.error(t('login.failed'), {
      description: e.message,
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl">
        {{ $t('login.title') }}
      </CardTitle>
      <CardDescription>
        {{ $t('login.description') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <AutoForm
        class="space-y-6"
        :schema="LoginSchema"
        :field-config="loginFieldConfig"
        @submit="onSubmit"
      >
        <Alert v-if="previewMode">
          <AlertCircle class="w-4 h-4" />
          <AlertTitle>{{ $t('login.tips') }}</AlertTitle>
          <AlertDescription>
            {{ $t('login.preview_token') }} <code class="font-mono text-green-500">SinkCool</code> .
          </AlertDescription>
        </Alert>
        <Button class="w-full" :disabled="isLoading">
          {{ isLoading ? $t('login.loading') : $t('login.submit') }}
        </Button>
      </AutoForm>
    </CardContent>
  </Card>
</template>
