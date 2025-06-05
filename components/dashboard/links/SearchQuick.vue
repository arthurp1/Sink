<script setup>
defineProps({
  searchTerm: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:searchTerm'])
</script>

<template>
  <div class="relative ml-auto flex-1 md:grow-0">
    <Input
      type="search"
      :placeholder="$t('links.search_placeholder')"
      :model-value="searchTerm"
      class="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
      @update:model-value="emit('update:searchTerm', $event)"
    />
  </div>
</template>
