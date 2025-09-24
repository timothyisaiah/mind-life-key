<template>
    <q-page class="recurring-transactions-page">
        <!-- Pull to Refresh -->
        <q-pull-to-refresh @refresh="onRefresh">
            <!-- Header -->
            <div class="page-header q-pa-md">
                <div class="row items-center justify-between">
                    <div>
                        <h4 class="text-h4 text-weight-bold q-ma-none">Recurring Transactions</h4>
                        <p class="text-subtitle1 text-grey-6 q-ma-none">
                            Manage your recurring income and expenses
                            <q-icon v-if="isRefreshing" name="refresh" size="sm"
                                class="text-white animate-spin q-ml-xs" />
                            <span v-else class="text-white q-ml-xs">• Live</span>
                        </p>
                    </div>
                    <div class="row q-gutter-sm">
                        <q-btn color="primary" icon="add" label="Add Recurring" @click="showAddRecurringDialog" />
                        <q-btn color="secondary" icon="refresh" label="Process Now"
                            @click="processRecurringTransactions" />
                    </div>
                </div>
            </div>

            <!-- Notifications Section -->
            <div class="q-pa-md" v-if="upcomingBills.length > 0 || overdueBills.length > 0"
                :key="`notifications-${refreshKey}`">
                <div class="row q-gutter-md">
                    <!-- Overdue Bills -->
                    <div class="col-12 col-md-6" v-if="overdueBills.length > 0">
                        <q-card class="notification-card overdue">
                            <q-card-section>
                                <div class="text-h6 text-negative q-mb-md">
                                    <q-icon name="warning" class="q-mr-sm" />
                                    Overdue Bills ({{ overdueBills.length }})
                                </div>
                                <q-list>
                                    <q-item v-for="bill in overdueBills" :key="bill.id" class="q-px-none">
                                        <q-item-section>
                                            <q-item-label class="text-weight-bold">{{ bill.description }}</q-item-label>
                                            <q-item-label caption>
                                                Due: {{ formatDate(bill.nextDue) }} • {{ bill.frequency }}
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-item-label class="text-negative text-weight-bold">
                                                {{ formatCurrency(bill.amount) }}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Upcoming Bills -->
                    <div class="col-12 col-md-6" v-if="upcomingBills.length > 0">
                        <q-card class="notification-card upcoming">
                            <q-card-section>
                                <div class="text-h6 text-warning q-mb-md">
                                    <q-icon name="schedule" class="q-mr-sm" />
                                    Upcoming Bills ({{ upcomingBills.length }})
                                </div>
                                <q-list>
                                    <q-item v-for="bill in upcomingBills" :key="bill.id" class="q-px-none">
                                        <q-item-section>
                                            <q-item-label class="text-weight-bold">{{ bill.description }}</q-item-label>
                                            <q-item-label caption>
                                                Due: {{ formatDate(bill.nextDue) }} • {{ bill.frequency }}
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-item-label class="text-negative text-weight-bold">
                                                {{ formatCurrency(bill.amount) }}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>

            <!-- Recurring Transactions List -->
            <div class="q-pa-md">
                <q-card>
                    <q-card-section>
                        <div class="text-h6 q-mb-md">
                            Active Recurring Transactions ({{ activeRecurringTransactions.length }})
                        </div>

                        <div v-if="activeRecurringTransactions.length === 0" class="text-center text-grey-6 q-py-xl">
                            <q-icon name="repeat" size="4rem" class="q-mb-md" />
                            <div class="text-h6">No recurring transactions yet</div>
                            <div class="text-body2">Set up recurring transactions to automate your finances</div>
                        </div>

                        <div v-else>
                            <q-list separator :key="refreshKey">
                                <q-item v-for="recurring in activeRecurringTransactions" :key="recurring.id"
                                    class="recurring-item">
                                    <q-item-section avatar>
                                        <q-avatar :color="recurring.type === 'income' ? 'positive' : 'negative'"
                                            text-color="white"
                                            :icon="recurring.type === 'income' ? 'trending_up' : 'trending_down'" />
                                    </q-item-section>

                                    <q-item-section>
                                        <q-item-label class="text-weight-bold">{{ recurring.description
                                            }}</q-item-label>
                                        <q-item-label caption>
                                            {{ getCategoryName(recurring.categoryId) }} • {{ recurring.frequency }}
                                            <span v-if="recurring.nextDue">• Next: {{ formatDate(recurring.nextDue)
                                                }}</span>
                                        </q-item-label>
                                    </q-item-section>

                                    <q-item-section side>
                                        <div class="text-right">
                                            <q-item-label
                                                :class="recurring.type === 'income' ? 'text-positive' : 'text-negative'"
                                                class="text-h6 text-weight-bold">
                                                {{ recurring.type === 'income' ? '+' : '-' }}{{
                                                    formatCurrency(recurring.amount) }}
                                            </q-item-label>
                                            <q-chip :color="getStatusColor(recurring)" text-color="white" size="sm"
                                                :label="getStatusText(recurring)" />
                                        </div>
                                    </q-item-section>

                                    <q-item-section side>
                                        <q-btn-group flat>
                                            <q-btn flat round icon="edit" color="primary"
                                                @click="editRecurringTransaction(recurring)" />
                                            <q-btn flat round icon="delete" color="negative"
                                                @click="confirmDeleteRecurringTransaction(recurring)" />
                                        </q-btn-group>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Add/Edit Recurring Transaction Dialog -->
            <q-dialog v-model="showRecurringDialog" persistent>
                <q-card style="min-width: 500px">
                    <q-card-section>
                        <div class="text-h6">
                            {{ editingRecurring ? 'Edit Recurring Transaction' : 'Add Recurring Transaction' }}
                        </div>
                    </q-card-section>
                    <q-card-section>
                        <q-form @submit="saveRecurringTransaction" class="q-gutter-md">
                            <q-input v-model="recurringForm.description" label="Description" outlined
                                :rules="[val => !!val || 'Description is required']" />
                            <q-input v-model.number="recurringForm.amount" label="Amount" type="number" step="0.01"
                                outlined :rules="[val => val > 0 || 'Amount must be greater than 0']" />
                            <q-select v-model="recurringForm.type" :options="typeOptions" label="Type" outlined
                                emit-value map-options :rules="[val => !!val || 'Type is required']" />
                            <q-select v-model="recurringForm.categoryId" :options="categoryOptions" label="Category"
                                outlined emit-value map-options :rules="[val => !!val || 'Category is required']" />
                            <q-select v-model="recurringForm.frequency" :options="frequencyOptions" label="Frequency"
                                outlined emit-value map-options :rules="[val => !!val || 'Frequency is required']" />
                            <q-input v-model="recurringForm.startDate" label="Start Date" type="date" outlined
                                :rules="[val => !!val || 'Start date is required']" />
                            <q-input v-model="recurringForm.notes" label="Notes (optional)" outlined type="textarea"
                                rows="3" />
                            <q-checkbox v-model="recurringForm.isActive" label="Active" />
                        </q-form>
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancel" @click="closeRecurringDialog" />
                        <q-btn color="primary" label="Save" @click="saveRecurringTransaction" />
                    </q-card-actions>
                </q-card>
            </q-dialog>

            <!-- Delete Confirmation Dialog -->
            <q-dialog v-model="showDeleteDialog" persistent>
                <q-card>
                    <q-card-section>
                        <div class="text-h6">Delete Recurring Transaction</div>
                    </q-card-section>
                    <q-card-section>
                        Are you sure you want to delete "{{ recurringToDelete?.description }}"?
                        This will not affect any transactions that have already been created.
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancel" @click="showDeleteDialog = false" />
                        <q-btn color="negative" label="Delete" @click="deleteRecurringTransaction" />
                    </q-card-actions>
                </q-card>
            </q-dialog>
        </q-pull-to-refresh>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatCurrency, formatDate } from 'src/utils/formatters'

const financialStore = useFinancialStore()

// State
const showRecurringDialog = ref(false)
const showDeleteDialog = ref(false)
const editingRecurring = ref(null)
const recurringToDelete = ref(null)

// Live page state
const isRefreshing = ref(false)
const lastUpdateTime = ref(new Date())
const refreshKey = ref(0)

const recurringForm = ref({
    description: '',
    amount: 0,
    type: 'expense',
    categoryId: null,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    isActive: true
})

// Computed
const recurringTransactions = computed(() => financialStore.recurringTransactions)
const categories = computed(() => financialStore.categories)
const upcomingBills = computed(() => financialStore.upcomingBills)
const overdueBills = computed(() => financialStore.overdueBills)

const activeRecurringTransactions = computed(() => {
    return recurringTransactions.value.filter(rt => rt.isActive !== false)
})

const typeOptions = [
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' }
]

const frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' }
]

const categoryOptions = computed(() => {
    return categories.value.map(cat => ({
        label: cat.name,
        value: cat.id
    }))
})

// Methods
const getCategoryName = (categoryId) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category ? category.name : 'Unknown'
}

const getStatusColor = (recurring) => {
    const today = new Date().toISOString().split('T')[0]
    if (recurring.nextDue < today) return 'negative'
    if (recurring.nextDue === today) return 'warning'
    return 'positive'
}

const getStatusText = (recurring) => {
    const today = new Date().toISOString().split('T')[0]
    if (recurring.nextDue < today) return 'Overdue'
    if (recurring.nextDue === today) return 'Due Today'
    return 'Active'
}

const showAddRecurringDialog = () => {
    editingRecurring.value = null
    recurringForm.value = {
        description: '',
        amount: 0,
        type: 'expense',
        categoryId: null,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
        isActive: true
    }
    showRecurringDialog.value = true
}

const editRecurringTransaction = (recurring) => {
    editingRecurring.value = recurring
    recurringForm.value = {
        description: recurring.description,
        amount: recurring.amount,
        type: recurring.type,
        categoryId: recurring.categoryId,
        frequency: recurring.frequency,
        startDate: recurring.startDate,
        notes: recurring.notes || '',
        isActive: recurring.isActive !== false
    }
    showRecurringDialog.value = true
}

const closeRecurringDialog = () => {
    showRecurringDialog.value = false
    editingRecurring.value = null
    recurringForm.value = {
        description: '',
        amount: 0,
        type: 'expense',
        categoryId: null,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
        isActive: true
    }
}

const saveRecurringTransaction = () => {
    if (recurringForm.value.description && recurringForm.value.amount > 0 && recurringForm.value.categoryId) {
        if (editingRecurring.value) {
            financialStore.updateRecurringTransaction(editingRecurring.value.id, recurringForm.value)
        } else {
            financialStore.addRecurringTransaction(recurringForm.value)
        }
        closeRecurringDialog()
        // Force immediate refresh
        setTimeout(() => {
            triggerPageRefresh()
        }, 100)
    }
}

const confirmDeleteRecurringTransaction = (recurring) => {
    recurringToDelete.value = recurring
    showDeleteDialog.value = true
}

const deleteRecurringTransaction = () => {
    if (recurringToDelete.value) {
        financialStore.deleteRecurringTransaction(recurringToDelete.value.id)
        showDeleteDialog.value = false
        recurringToDelete.value = null
        // Force immediate refresh
        setTimeout(() => {
            triggerPageRefresh()
        }, 100)
    }
}

const processRecurringTransactions = () => {
    const processed = financialStore.processRecurringTransactions()
    if (processed.length > 0) {
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

// Watch for changes in recurring transactions data
watch(() => financialStore.recurringTransactions, () => {
    triggerPageRefresh()
}, { deep: true })

watch(() => financialStore.transactions, () => {
    triggerPageRefresh()
}, { deep: true })

onMounted(() => {
    financialStore.loadFromLocalStorage()
    // Process recurring transactions on page load
    processRecurringTransactions()
})
</script>

<style scoped>
.recurring-transactions-page {
    background-color: var(--q-background);
    color: var(--q-text-primary);
    min-height: 100vh;
}

.page-header {
    background: var(--q-primary);
    color: white;
}

.notification-card {
    border-left: 4px solid;
}

.notification-card.overdue {
    border-left-color: #F44336;
}

.notification-card.upcoming {
    border-left-color: #FF9800;
}

.recurring-item {
    transition: background-color 0.2s;
}

.recurring-item:hover {
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
