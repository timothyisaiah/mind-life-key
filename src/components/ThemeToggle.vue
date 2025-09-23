<template>
    <div class="theme-toggle-container">
        <q-btn flat round :icon="isDarkMode ? 'light_mode' : 'dark_mode'" :color="isDarkMode ? 'warning' : 'primary'"
            @click="toggleTheme" class="theme-toggle-btn"
            :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <q-tooltip>
                {{ isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}
            </q-tooltip>
        </q-btn>

        <!-- Optional: Theme selector dropdown -->
        <q-btn-dropdown flat round icon="palette" color="grey-6" class="theme-selector-btn" v-if="showAdvanced">
            <q-list class="theme-options">
                <q-item-label header class="text-weight-bold">
                    <q-icon name="palette" class="q-mr-sm" />
                    Theme Options
                </q-item-label>

                <q-item clickable @click="setTheme('light')" :active="!isDarkMode">
                    <q-item-section avatar>
                        <q-icon name="light_mode" :color="!isDarkMode ? 'primary' : 'grey-6'" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Light Mode</q-item-label>
                        <q-item-label caption>Clean & Professional</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="!isDarkMode">
                        <q-icon name="check" color="primary" />
                    </q-item-section>
                </q-item>

                <q-item clickable @click="setTheme('dark')" :active="isDarkMode">
                    <q-item-section avatar>
                        <q-icon name="dark_mode" :color="isDarkMode ? 'warning' : 'grey-6'" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Dark Mode</q-item-label>
                        <q-item-label caption>Modern & Sleek</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="isDarkMode">
                        <q-icon name="check" color="warning" />
                    </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

                <q-item clickable @click="setSystemPreference">
                    <q-item-section avatar>
                        <q-icon name="settings" color="info" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>System Preference</q-item-label>
                        <q-item-label caption>Follow OS setting</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-btn-dropdown>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from 'src/stores/theme'

defineProps({
    showAdvanced: {
        type: Boolean,
        default: false
    }
})

const themeStore = useThemeStore()

const isDarkMode = computed(() => themeStore.isDarkMode)

function toggleTheme() {
    themeStore.toggleTheme()
}

function setTheme(theme) {
    themeStore.setTheme(theme)
}

function setSystemPreference() {
    themeStore.setSystemPreference()
}
</script>

<style scoped>
.theme-toggle-container {
    display: flex;
    align-items: center;
    gap: 4px;
}

.theme-toggle-btn {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.theme-toggle-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transition: all 0.3s ease;
    transform: translate(-50%, -50%);
    border-radius: 50%;
}

.theme-toggle-btn:hover::before {
    width: 100%;
    height: 100%;
}

.theme-selector-btn {
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.theme-selector-btn:hover {
    opacity: 1;
}

.theme-options {
    min-width: 200px;
    background-color: var(--q-surface);
    border: 1px solid var(--q-border);
    border-radius: 8px;
    box-shadow: 0 4px 16px var(--q-shadow);
}

.theme-options .q-item {
    border-radius: 6px;
    margin: 2px 4px;
    transition: all 0.2s ease;
}

.theme-options .q-item:hover {
    background-color: var(--q-hover);
}

.theme-options .q-item.active {
    background-color: rgba(var(--q-primary), 0.1);
    border: 1px solid var(--q-primary);
}

/* Animation for theme switch */
.theme-toggle-btn {
    animation: none;
}

.theme-toggle-btn:active {
    animation: themeSwitch 0.3s ease;
}

@keyframes themeSwitch {
    0% {
        transform: scale(1) rotate(0deg);
    }

    50% {
        transform: scale(1.1) rotate(180deg);
    }

    100% {
        transform: scale(1) rotate(360deg);
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .theme-toggle-container {
        gap: 2px;
    }

    .theme-options {
        min-width: 180px;
    }
}
</style>
