<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Currency Settings -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Currency Settings</div>

            <!-- Current Currency -->
            <div class="q-mb-lg">
              <div class="text-subtitle2 q-mb-sm">Display Currency</div>
              <q-select v-model="selectedCurrency" :options="currencyOptions" option-value="code" option-label="name"
                emit-value map-options outlined @update:model-value="updateDisplayCurrency">
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.code }} - {{ scope.opt.symbol
                        }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Exchange Rates -->
            <div class="q-mb-lg">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2">Exchange Rates</div>
                <q-btn color="primary" icon="refresh" label="Update Rates" @click="updateRates"
                  :loading="updatingRates" />
              </div>

              <q-list bordered separator>
                <q-item v-for="currency in supportedCurrencies" :key="currency.code">
                  <q-item-section>
                    <q-item-label>{{ currency.name }} ({{ currency.code }})</q-item-label>
                    <q-item-label caption>{{ currency.symbol }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-right">
                      {{ formatCurrencyAmount(1, currency.code) }} = {{ formatCurrencyAmount(1 /
                        currency.rate, 'UGX') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-if="lastExchangeRateUpdate" class="text-caption text-grey-6 q-mt-sm">
                Last updated: {{ formatDate(lastExchangeRateUpdate) }}
              </div>
            </div>

            <!-- Add Custom Currency -->
            <div class="q-mb-lg">
              <div class="text-subtitle2 q-mb-sm">Add Custom Currency</div>
              <q-form @submit="addCustomCurrency" class="q-gutter-md">
                <div class="row q-gutter-md">
                  <div class="col-6">
                    <q-input v-model="newCurrency.code" label="Currency Code" outlined
                      :rules="[val => val && val.length === 3 || 'Enter 3-letter currency code']" />
                  </div>
                  <div class="col-6">
                    <q-input v-model="newCurrency.symbol" label="Currency Symbol" outlined
                      :rules="[val => val || 'Enter currency symbol']" />
                  </div>
                </div>
                <div class="row q-gutter-md">
                  <div class="col-6">
                    <q-input v-model="newCurrency.name" label="Currency Name" outlined
                      :rules="[val => val || 'Enter currency name']" />
                  </div>
                  <div class="col-6">
                    <q-input v-model.number="newCurrency.rate" label="Rate (per 1 UGX)" type="number" step="0.000001"
                      outlined :rules="[val => val > 0 || 'Enter valid exchange rate']" />
                  </div>
                </div>
                <q-btn type="submit" color="primary" label="Add Currency" />
              </q-form>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Currency Converter -->
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Currency Converter</div>

            <q-form class="q-gutter-md">
              <q-input v-model.number="converterAmount" label="Amount" type="number" outlined
                :rules="[val => val > 0 || 'Enter valid amount']" />

              <q-select v-model="converterFrom" :options="currencyOptions" option-value="code" option-label="name"
                emit-value map-options label="From" outlined />

              <q-select v-model="converterTo" :options="currencyOptions" option-value="code" option-label="name"
                emit-value map-options label="To" outlined />

              <q-btn color="primary" label="Convert" @click="convertAmount" class="full-width" />

              <div v-if="convertedAmount !== null" class="q-mt-md">
                <q-banner class="bg-primary text-white" rounded>
                  <template v-slot:avatar>
                    <q-icon name="currency_exchange" />
                  </template>
                  <div class="text-h6">
                    {{ formatCurrencyAmount(convertedAmount, converterTo) }}
                  </div>
                </q-banner>
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- Currency Statistics -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Portfolio Summary</div>

            <div class="q-gutter-sm">
              <div class="row justify-between">
                <span>Total Income:</span>
                <span class="text-weight-bold text-positive">
                  {{ formatCurrencyAmount(totalIncome, selectedCurrency) }}
                </span>
              </div>
              <div class="row justify-between">
                <span>Total Expenses:</span>
                <span class="text-weight-bold text-negative">
                  {{ formatCurrencyAmount(totalExpenses, selectedCurrency) }}
                </span>
              </div>
              <q-separator />
              <div class="row justify-between">
                <span>Net Worth:</span>
                <span class="text-weight-bold" :class="netWorth >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatCurrencyAmount(netWorth, selectedCurrency) }}
                </span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatDate } from 'src/utils/formatters'

const financialStore = useFinancialStore()

// State
const selectedCurrency = ref('UGX')
const updatingRates = ref(false)
const convertedAmount = ref(null)
const converterAmount = ref(1000)
const converterFrom = ref('UGX')
const converterTo = ref('USD')

const newCurrency = ref({
  code: '',
  name: '',
  symbol: '',
  rate: 0
})

// Computed
const supportedCurrencies = computed(() => financialStore.supportedCurrencies)
const lastExchangeRateUpdate = computed(() => financialStore.lastExchangeRateUpdate)
const totalIncome = computed(() => financialStore.totalIncome)
const totalExpenses = computed(() => financialStore.totalExpenses)
const netWorth = computed(() => financialStore.netWorth)

const currencyOptions = computed(() =>
  (supportedCurrencies.value || []).map(currency => ({
    code: currency.code,
    name: `${currency.name} (${currency.code})`,
    symbol: currency.symbol
  }))
)

// Methods
const updateDisplayCurrency = (currencyCode) => {
  financialStore.setUserCurrency(currencyCode)
}

const updateRates = async () => {
  updatingRates.value = true
  try {
    await financialStore.updateExchangeRates()
  } finally {
    updatingRates.value = false
  }
}

const addCustomCurrency = () => {
  if (newCurrency.value.code && newCurrency.value.name && newCurrency.value.symbol && newCurrency.value.rate > 0) {
    financialStore.addCustomCurrency(newCurrency.value)
    newCurrency.value = { code: '', name: '', symbol: '', rate: 0 }
  }
}

const convertAmount = () => {
  if (converterAmount.value > 0 && converterFrom.value && converterTo.value) {
    convertedAmount.value = financialStore.convertCurrency(
      converterAmount.value,
      converterFrom.value,
      converterTo.value
    )
  }
}

const formatCurrencyAmount = (amount, currency) => {
  return financialStore.formatCurrencyAmount(amount, currency)
}

onMounted(() => {
  selectedCurrency.value = financialStore.userSettings.currency
})
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
