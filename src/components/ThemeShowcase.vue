<template>
    <div class="theme-showcase">
        <q-card class="theme-card q-pa-md">
            <q-card-section>
                <div class="text-h6 text-weight-bold q-mb-md">
                    <q-icon name="palette" class="q-mr-sm" />
                    Theme Showcase
                </div>

                <!-- Color Palette Display -->
                <div class="row q-col-gutter-md q-mb-lg">
                    <div class="col-12">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Color Palette</div>
                        <div class="row q-col-gutter-sm">
                            <div class="col-2" v-for="(color, name) in themeColors" :key="name">
                                <div class="color-swatch" :style="{ backgroundColor: color }">
                                    <div class="color-label">{{ name }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Typography Examples -->
                <div class="row q-col-gutter-md q-mb-lg">
                    <div class="col-12 col-md-6">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Typography</div>
                        <div class="typography-examples">
                            <div class="text-h4 text-theme-primary">Primary Text</div>
                            <div class="text-h6 text-theme-secondary">Secondary Text</div>
                            <div class="text-body1 text-theme-primary">Body text with proper contrast</div>
                            <div class="text-caption text-theme-secondary">Caption text for additional info</div>
                        </div>
                    </div>

                    <div class="col-12 col-md-6">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Financial Colors</div>
                        <div class="financial-examples">
                            <div class="text-h5 text-profit q-mb-sm">
                                <q-icon name="trending_up" class="q-mr-sm" />
                                +$2,450.00 Profit
                            </div>
                            <div class="text-h5 text-loss q-mb-sm">
                                <q-icon name="trending_down" class="q-mr-sm" />
                                -$890.50 Loss
                            </div>
                            <div class="text-body2 text-theme-secondary">
                                These colors automatically adapt to the current theme
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Component Examples -->
                <div class="row q-col-gutter-md q-mb-lg">
                    <div class="col-12 col-md-4">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Buttons</div>
                        <div class="column q-gutter-sm">
                            <q-btn class="btn-theme-primary" label="Primary" />
                            <q-btn class="btn-theme-secondary" label="Secondary" />
                            <q-btn class="btn-theme-accent" label="Accent" />
                        </div>
                    </div>

                    <div class="col-12 col-md-4">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Form Elements</div>
                        <div class="column q-gutter-sm">
                            <q-input v-model="sampleText" label="Sample Input" class="theme-input" outlined />
                            <q-select v-model="sampleSelect" :options="['Option 1', 'Option 2', 'Option 3']"
                                label="Sample Select" outlined />
                        </div>
                    </div>

                    <div class="col-12 col-md-4">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Cards & Surfaces</div>
                        <div class="column q-gutter-sm">
                            <q-card class="theme-card q-pa-sm">
                                <div class="text-body2">Sample card content</div>
                            </q-card>
                            <div class="chart-container">
                                <div class="text-caption">Chart container</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Theme Controls -->
                <div class="row q-col-gutter-md">
                    <div class="col-12">
                        <div class="text-subtitle2 text-weight-bold q-mb-sm">Theme Controls</div>
                        <div class="row items-center q-gutter-md">
                            <ThemeToggle :show-advanced="true" />
                            <div class="text-body2 text-theme-secondary">
                                Current theme: <span class="text-weight-bold">{{ currentTheme }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useThemeStore } from 'src/stores/theme'
import ThemeToggle from './ThemeToggle.vue'

const themeStore = useThemeStore()

const sampleText = ref('Sample text input')
const sampleSelect = ref('Option 1')

const currentTheme = computed(() => themeStore.currentTheme)
const themeColors = computed(() => themeStore.themeColors)
</script>

<style scoped>
.theme-showcase {
    max-width: 100%;
}

.color-swatch {
    height: 60px;
    border-radius: 8px;
    border: 1px solid var(--q-border);
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    transition: transform 0.2s ease;
}

.color-swatch:hover {
    transform: scale(1.05);
}

.color-label {
    background-color: var(--q-surface);
    color: var(--q-text-primary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    margin-bottom: 4px;
    text-transform: capitalize;
}

.typography-examples {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.financial-examples {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .color-swatch {
        height: 50px;
    }

    .color-label {
        font-size: 9px;
        padding: 1px 4px;
    }
}
</style>
