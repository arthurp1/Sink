<script setup>
const _props = defineProps({
  currentView: { type: String, required: true },
})

const emit = defineEmits(['update:view'])

const route = useRoute()

function handleViewChange(view) {
  emit('update:view', view)
}
</script>

<template>
  <section class="flex justify-between">
    <!-- <Tabs
      v-if="route.path !== '/dashboard/link'"
      :default-value="route.path"
      @update:model-value="navigateTo"
    >
      <TabsList>
        <TabsTrigger
          value="/dashboard/links"
        >
          {{ $t('nav.links') }}
        </TabsTrigger>
        <TabsTrigger value="/dashboard/analysis">
          {{ $t('nav.analysis') }}
        </TabsTrigger>
      </TabsList>
    </Tabs> -->
    <Tabs
      v-if="route.path === '/dashboard/links'"
      :default-value="currentView"
      @update:model-value="handleViewChange"
    >
      <TabsList>
        <TabsTrigger value="card">
          Card View
        </TabsTrigger>
        <TabsTrigger value="table">
          Table View
        </TabsTrigger>
      </TabsList>
    </Tabs>
    <slot name="left" />
    <div>
      <slot />
    </div>
  </section>
</template>
