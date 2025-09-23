<template>
  <q-page class="transactions-page">
    <!-- Pull to Refresh -->
    <q-pull-to-refresh @refresh="onRefresh">
      <!-- Header -->
      <div class="page-header q-pa-md">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 text-weight-bold q-ma-none">Transactions</h4>
            <p class="text-subtitle1 text-grey-6 q-ma-none">
              Manage your income and expenses
              <q-icon v-if="isRefreshing" name="refresh" size="sm" class="text-white animate-spin q-ml-xs" />
              <span v-else class="text-white q-ml-xs">• Live</span>
            </p>
          </div>
          <div class="row q-gutter-sm">
            <q-btn color="primary" icon="add" label="Add Income" @click="showAddTransactionDialog('income')" />
            <q-btn color="negative" icon="remove" label="Add Expense" @click="showAddTransactionDialog('expense')" />
            <!-- <q-btn flat color="white" icon="refresh" @click="triggerPageRefresh" :loading="isRefreshing" /> -->
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="q-pa-md">
        <q-card>
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-3">
                <q-select v-model="filters.type" :options="typeOptions" label="Type" outlined clearable emit-value
                  map-options />
              </div>
              <div class="col-12 col-md-3">
                <q-select v-model="filters.categoryId" :options="categoryOptions" label="Category" outlined clearable
                  emit-value map-options />
              </div>
              <div class="col-12 col-md-3">
                <q-input v-model="filters.startDate" label="Start Date" type="date" outlined />
              </div>
              <div class="col-12 col-md-3">
                <q-input v-model="filters.endDate" label="End Date" type="date" outlined />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Transactions List -->
      <div class="q-pa-md">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              Transactions ({{ filteredTransactions.length }})
            </div>

            <div v-if="filteredTransactions.length === 0" class="text-center text-grey-6 q-py-xl">
              <q-icon name="receipt_long" size="4rem" class="q-mb-md" />
              <div class="text-h6">No transactions found</div>
              <div class="text-body2">Add your first transaction to get started</div>
            </div>

            <div v-else>
              <q-list separator :key="refreshKey">
                <q-item v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction-item">
                  <q-item-section avatar>
                    <q-avatar :color="transaction.type === 'income' ? 'positive' : 'negative'" text-color="white"
                      :icon="transaction.type === 'income' ? 'add_circle' : 'remove_circle'" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ transaction.description }}</q-item-label>
                    <q-item-label caption>
                      {{ getCategoryName(transaction.categoryId) }} • {{ formatDate(transaction.date)
                      }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="text-right">
                      <q-item-label :class="transaction.type === 'income' ? 'text-positive' : 'text-negative'"
                        class="text-h6 text-weight-bold">
                        {{ transaction.type === 'income' ? '+' : '-' }}{{
                          formatCurrency(transaction.amount) }}
                      </q-item-label>
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn-group flat>
                      <q-btn flat round icon="edit" color="primary" @click="editTransaction(transaction)" />
                      <q-btn flat round icon="delete" color="negative" @click="confirmDeleteTransaction(transaction)" />
                    </q-btn-group>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-pull-to-refresh>

    <!-- Add/Edit Transaction Dialog -->
    <q-dialog v-model="showTransactionDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">
            {{ editingTransaction ? 'Edit Transaction' : (transactionDialogType === 'income' ? 'Add Income'
              : 'Add Expense') }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="saveTransaction" class="q-col-gutter-md">
            <q-input v-model="transactionForm.description" label="Description" outlined
              :rules="[val => !!val || 'Description is required']" />
            <q-input v-model.number="transactionForm.amount" label="Amount" type="number" step="0.01" outlined
              :rules="[val => val > 0 || 'Amount must be greater than 0']" />
            <q-select v-model="transactionForm.categoryId" :options="categoryOptions" label="Category" outlined
              emit-value map-options :rules="[val => !!val || 'Category is required']" />
            <q-input v-model="transactionForm.date" label="Date" type="date" outlined />
            <q-input v-model="transactionForm.notes" label="Notes (optional)" outlined type="textarea" rows="3" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeTransactionDialog" />
          <q-btn color="primary" label="Save" @click="saveTransaction" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Transaction</div>
        </q-card-section>
        <q-card-section>
          Are you sure you want to delete "{{ transactionToDelete?.description }}"?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showDeleteDialog = false" />
          <q-btn color="negative" label="Delete" @click="deleteTransaction" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatCurrency, formatDate } from 'src/utils/formatters'

const financialStore = useFinancialStore()

// State
const showTransactionDialog = ref(false)
const showDeleteDialog = ref(false)
const transactionDialogType = ref('expense')
const editingTransaction = ref(null)
const transactionToDelete = ref(null)

// Live page state
const isRefreshing = ref(false)
const lastUpdateTime = ref(new Date())
const refreshKey = ref(0)

const filters = ref({
  type: null,
  categoryId: null,
  startDate: null,
  endDate: null
})

const transactionForm = ref({
  description: '',
  amount: 0,
  categoryId: null,
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  notes: ''
})

// Computed
const transactions = computed(() => financialStore.transactions)
const categories = computed(() => financialStore.categories)

const typeOptions = [
  { label: 'All', value: null },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' }
]

const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    label: cat.name,
    value: cat.id
  }))
})

const filteredTransactions = computed(() => {
  let filtered = [...transactions.value]

  if (filters.value.type) {
    filtered = filtered.filter(t => t.type === filters.value.type)
  }

  if (filters.value.categoryId) {
    filtered = filtered.filter(t => t.categoryId === filters.value.categoryId)
  }

  if (filters.value.startDate) {
    filtered = filtered.filter(t => t.date >= filters.value.startDate)
  }

  if (filters.value.endDate) {
    filtered = filtered.filter(t => t.date <= filters.value.endDate)
  }

  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Methods
const getCategoryName = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : 'Unknown'
}

const showAddTransactionDialog = (type) => {
  transactionDialogType.value = type
  editingTransaction.value = null
  transactionForm.value = {
    description: '',
    amount: 0,
    categoryId: null,
    date: new Date().toISOString().split('T')[0],
    type: type,
    notes: ''
  }
  showTransactionDialog.value = true
}

const editTransaction = (transaction) => {
  editingTransaction.value = transaction
  transactionDialogType.value = transaction.type
  transactionForm.value = {
    description: transaction.description,
    amount: transaction.amount,
    categoryId: transaction.categoryId,
    date: transaction.date,
    type: transaction.type,
    notes: transaction.notes || ''
  }
  showTransactionDialog.value = true
}

const closeTransactionDialog = () => {
  showTransactionDialog.value = false
  editingTransaction.value = null
  transactionForm.value = {
    description: '',
    amount: 0,
    categoryId: null,
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    notes: ''
  }
}

const saveTransaction = () => {
  if (transactionForm.value.description && transactionForm.value.amount > 0 && transactionForm.value.categoryId) {
    if (editingTransaction.value) {
      financialStore.updateTransaction(editingTransaction.value.id, transactionForm.value)
    } else {
      financialStore.addTransaction(transactionForm.value)
    }
    closeTransactionDialog()
    // Force immediate refresh
    setTimeout(() => {
      triggerPageRefresh()
    }, 100)
  }
}

const confirmDeleteTransaction = (transaction) => {
  transactionToDelete.value = transaction
  showDeleteDialog.value = true
}

const deleteTransaction = () => {
  if (transactionToDelete.value) {
    financialStore.deleteTransaction(transactionToDelete.value.id)
    showDeleteDialog.value = false
    transactionToDelete.value = null
    // Force immediate refresh
    setTimeout(() => {
      triggerPageRefresh()
    }, 100)
  }
}

// Live page methods
const triggerPageRefresh = async () => {
  isRefreshing.value = true
  lastUpdateTime.value = new Date()
  refreshKey.value++

  // Force re-computation of all data
  await nextTick()

  // Small delay to show refresh indicator
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}

const onRefresh = async (done) => {
  await triggerPageRefresh()
  done()
}

// Watch for changes in transactions data
watch(() => financialStore.transactions, () => {
  triggerPageRefresh()
}, { deep: true, immediate: false })

// Watch for changes in categories
watch(() => financialStore.categories, () => {
  triggerPageRefresh()
}, { deep: true, immediate: false })

onMounted(() => {
  financialStore.loadFromLocalStorage()
})
</script>

<style scoped>
.transactions-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.transaction-item {
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
