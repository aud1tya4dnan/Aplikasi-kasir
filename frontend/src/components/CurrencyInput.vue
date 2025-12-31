<template>
  <div class="relative">
    <span v-if="showPrefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
      Rp
    </span>
    <input
      :value="displayValue"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      type="text"
      inputmode="numeric"
      :class="[
        'input',
        showPrefix ? 'pl-12' : '',
      ]"
      :placeholder="placeholder"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: number
  placeholder?: string
  showPrefix?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0',
  showPrefix: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isFocused = ref(false)

// Format number with thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// Display formatted or unformatted based on focus
const displayValue = computed(() => {
  if (isFocused.value) {
    // Show raw number when focused for easier editing
    return props.modelValue === 0 ? '' : String(props.modelValue)
  } else {
    // Show formatted number when not focused
    return props.modelValue === 0 ? '' : formatNumber(props.modelValue)
  }
})

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  // Remove all non-digit characters
  const value = input.value.replace(/\D/g, '')
  const numValue = value === '' ? 0 : parseInt(value, 10)
  emit('update:modelValue', numValue)
}

function handleFocus() {
  isFocused.value = true
}

function handleBlur() {
  isFocused.value = false
}

// Update display when model value changes externally
watch(() => props.modelValue, () => {
  // Reactive update
})
</script>

<style scoped>
/* Inherit input styles from global CSS */
</style>
