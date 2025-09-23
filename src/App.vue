<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from 'src/stores/theme'

const themeStore = useThemeStore()

// Initialize theme system when app starts
onMounted(() => {
  themeStore.initializeTheme()
})
</script>
