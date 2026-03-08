import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import { formatCurrency } from 'src/utils/formatters'
import { apiRequest, getAuthToken } from 'src/utils/apiClient'

export const useFinancialStore = defineStore('financial', () => {
  // State
  const transactions = ref([])
  const budgets = ref([])
  const goals = ref([])
  const recurringTransactions = ref([])
  const userAchievements = ref([])
  const autoAllocationSettings = ref({
    enabled: false,
    percentage: 10, // Percentage of extra income to auto-allocate
    priorityOrder: [], // Array of goal IDs in priority order
  })
  const notificationSettings = ref({
    billReminders: true,
    budgetAlerts: true,
    savingsEncouragement: true,
    achievementNotifications: true,
    reminderDays: 3, // Days before bill due date to remind
    budgetThreshold: 80, // Percentage of budget to trigger alert
    savingsThreshold: 50, // Percentage of goal to trigger encouragement
  })
  const notifications = ref([])
  const categories = ref([
    { id: 1, name: 'Food & Dining', type: 'expense', color: '#FF6B6B' },
    { id: 2, name: 'Transportation', type: 'expense', color: '#4ECDC4' },
    { id: 3, name: 'Housing', type: 'expense', color: '#45B7D1' },
    { id: 4, name: 'Entertainment', type: 'expense', color: '#96CEB4' },
    { id: 5, name: 'Healthcare', type: 'expense', color: '#FFEAA7' },
    { id: 6, name: 'Shopping', type: 'expense', color: '#DDA0DD' },
    { id: 7, name: 'Salary', type: 'income', color: '#98D8C8' },
    { id: 8, name: 'Freelance', type: 'income', color: '#F7DC6F' },
    { id: 9, name: 'Investment', type: 'income', color: '#BB8FCE' },
    { id: 10, name: 'Other', type: 'expense', color: '#85C1E9' },
  ])
  const userSettings = ref({
    currency: 'UGX',
    startingBalance: 0,
    currentBalance: 0,
  })

  // Multi-currency support
  const supportedCurrencies = ref([
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 1 }, // Default currency
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.00027 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.00025 },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.00021 },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 0.35 },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 0.63 },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', rate: 0.98 },
  ])

  const exchangeRates = ref({})
  const lastExchangeRateUpdate = ref(null)

  // Encryption key (in production, this should be user-specific and securely stored)
  const ENCRYPTION_KEY = 'mindlifekey-2024'
  const STORAGE_KEY = 'mindlifekey_data'
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const pendingCreates = new Map()
  const lastRecurringProcessDate = ref(null)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  const isUuid = (value) => {
    return typeof value === 'string' && uuidPattern.test(value)
  }

  const generateUuid = () => {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID()
    }

    const getRandom = () => Math.floor(Math.random() * 256)
    const bytes = new Array(16).fill(0).map(() => getRandom())
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const toHex = (byte) => byte.toString(16).padStart(2, '0')
    const hex = bytes.map(toHex).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  const normalizeLegacyIds = () => {
    const goalMap = new Map()
    const budgetMap = new Map()
    const recurringMap = new Map()

    const normalizeList = (listRef, map) => {
      listRef.value = listRef.value.map((item) => {
        if (item && !isUuid(item.id)) {
          const newId = generateUuid()
          map.set(item.id, newId)
          return { ...item, id: newId }
        }
        return item
      })
    }

    normalizeList(goals, goalMap)
    normalizeList(budgets, budgetMap)
    normalizeList(recurringTransactions, recurringMap)

    transactions.value = transactions.value.map((transaction) => {
      const updates = {}
      if (transaction && !isUuid(transaction.id)) {
        updates.id = generateUuid()
      }
      if (
        transaction?.recurringTransactionId &&
        recurringMap.has(transaction.recurringTransactionId)
      ) {
        updates.recurringTransactionId = recurringMap.get(transaction.recurringTransactionId)
      }
      return Object.keys(updates).length ? { ...transaction, ...updates } : transaction
    })

    if (autoAllocationSettings.value?.priorityOrder?.length) {
      autoAllocationSettings.value.priorityOrder = autoAllocationSettings.value.priorityOrder.map(
        (id) => goalMap.get(id) || id,
      )
    }

    notifications.value = notifications.value.map((notification) => {
      if (!notification?.data) return notification

      const dataUpdates = {}
      if (notification.data.goalId && goalMap.has(notification.data.goalId)) {
        dataUpdates.goalId = goalMap.get(notification.data.goalId)
      }
      if (notification.data.budgetId && budgetMap.has(notification.data.budgetId)) {
        dataUpdates.budgetId = budgetMap.get(notification.data.budgetId)
      }
      if (notification.data.recurringId && recurringMap.has(notification.data.recurringId)) {
        dataUpdates.recurringId = recurringMap.get(notification.data.recurringId)
      }

      if (Object.keys(dataUpdates).length === 0) return notification
      return {
        ...notification,
        data: { ...notification.data, ...dataUpdates },
      }
    })
  }

  // Currency conversion functions
  const convertCurrency = (amount, fromCurrency, toCurrency = userSettings.value.currency) => {
    if (fromCurrency === toCurrency) return amount

    const fromRate = supportedCurrencies.value.find((c) => c.code === fromCurrency)?.rate || 1
    const toRate = supportedCurrencies.value.find((c) => c.code === toCurrency)?.rate || 1

    // Convert to UGX first, then to target currency
    const amountInUGX = amount / fromRate
    return amountInUGX * toRate
  }

  const formatCurrencyAmount = (amount, currency = userSettings.value.currency) => {
    const currencyInfo = supportedCurrencies.value.find((c) => c.code === currency)
    if (!currencyInfo) return `${amount}`

    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency === 'UGX' ? 0 : 2,
      maximumFractionDigits: currency === 'UGX' ? 0 : 2,
    }).format(amount)

    return `${currencyInfo.symbol} ${formattedAmount}`
  }

  const getCurrentCurrency = computed(() => {
    return (
      supportedCurrencies.value.find((c) => c.code === userSettings.value.currency) ||
      supportedCurrencies.value[0]
    )
  })

  // Computed
  const totalIncome = computed(() => {
    return transactions.value
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => {
        const convertedAmount = convertCurrency(t.amount, t.currency || 'UGX')
        return sum + convertedAmount
      }, 0)
  })

  const totalExpenses = computed(() => {
    return transactions.value
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => {
        const convertedAmount = convertCurrency(t.amount, t.currency || 'UGX')
        return sum + convertedAmount
      }, 0)
  })

  const netWorth = computed(() => {
    return userSettings.value.startingBalance + totalIncome.value - totalExpenses.value
  })

  const monthlyIncome = computed(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return transactions.value
      .filter((t) => {
        const transactionDate = new Date(t.date)
        return (
          t.type === 'income' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, t) => {
        const convertedAmount = convertCurrency(t.amount, t.currency || 'UGX')
        return sum + convertedAmount
      }, 0)
  })

  const monthlyExpenses = computed(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return transactions.value
      .filter((t) => {
        const transactionDate = new Date(t.date)
        return (
          t.type === 'expense' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, t) => {
        const convertedAmount = convertCurrency(t.amount, t.currency || 'UGX')
        return sum + convertedAmount
      }, 0)
  })

  const expensesByCategory = computed(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const categoryTotals = {}

    transactions.value
      .filter((t) => {
        const transactionDate = new Date(t.date)
        return (
          t.type === 'expense' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        )
      })
      .forEach((t) => {
        const category = categories.value.find((c) => c.id === t.categoryId)
        if (category) {
          if (!categoryTotals[category.name]) {
            categoryTotals[category.name] = {
              amount: 0,
              color: category.color,
            }
          }
          categoryTotals[category.name].amount += t.amount
        }
      })

    return Object.entries(categoryTotals).map(([name, data]) => ({
      name,
      amount: data.amount,
      color: data.color,
    }))
  })

  // Actions
  const addTransaction = (transaction) => {
    const newTransaction = {
      id: generateUuid(),
      ...transaction,
      date: transaction.date || new Date().toISOString().split('T')[0],
      currency: transaction.currency || 'UGX', // Default to UGX
    }
    transactions.value.push(newTransaction)
    saveToLocalStorage()
    const apiPayload = normalizeAmountFields(newTransaction, ['amount'])
    void createRemoteRecord('/api/transactions', newTransaction, transactions, apiPayload)
  }

  const updateTransaction = (id, updates) => {
    const index = transactions.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      transactions.value[index] = { ...transactions.value[index], ...updates }
      saveToLocalStorage()
      const apiPayload = normalizeAmountFields(updates, ['amount'])
      void updateRemoteRecord('/api/transactions', id, apiPayload, transactions)
    }
  }

  const deleteTransaction = (id) => {
    const index = transactions.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      transactions.value.splice(index, 1)
      saveToLocalStorage()
      void deleteRemoteRecord('/api/transactions', id)
    }
  }

  const addGoal = (goal) => {
    const newGoal = {
      id: generateUuid(),
      ...goal,
      currentAmount: goal.currentAmount || 0,
      createdAt: new Date().toISOString(),
    }
    goals.value.push(newGoal)
    saveToLocalStorage()
    const apiPayload = normalizeAmountFields(newGoal, ['targetAmount', 'currentAmount'])
    void createRemoteRecord('/api/goals', newGoal, goals, apiPayload)
  }

  const updateGoal = (id, updates) => {
    const index = goals.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      goals.value[index] = { ...goals.value[index], ...updates }
      saveToLocalStorage()
      const apiPayload = normalizeAmountFields(updates, ['targetAmount', 'currentAmount'])
      void updateRemoteRecord('/api/goals', id, apiPayload, goals)
    }
  }

  const deleteGoal = (id) => {
    const index = goals.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      goals.value.splice(index, 1)
      // Remove from auto-allocation priority order
      const priorityIndex = autoAllocationSettings.value.priorityOrder.indexOf(id)
      if (priorityIndex > -1) {
        autoAllocationSettings.value.priorityOrder.splice(priorityIndex, 1)
      }
      saveToLocalStorage()
      void deleteRemoteRecord('/api/goals', id)
      void persistAutoAllocationSettings()
    }
  }

  // Enhanced Goal Features
  const addMoneyToGoal = (goalId, amount) => {
    const goal = goals.value.find((g) => g.id === goalId)
    if (goal) {
      const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount)
      const actualAdded = newAmount - goal.currentAmount

      updateGoal(goalId, { currentAmount: newAmount })

      // Check for achievements
      checkGoalAchievements(goalId)

      return actualAdded
    }
    return 0
  }

  const checkGoalAchievements = (goalId) => {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) return

    const achievements = [
      {
        id: 'first_goal_created',
        title: 'Goal Setter',
        description: 'Created your first savings goal',
        icon: 'flag',
        condition: () => goals.value.length >= 1,
        earned: false,
      },
      {
        id: 'goal_25_percent',
        title: 'Quarter Way There',
        description: `Reached 25% of ${goal.name}`,
        icon: 'trending_up',
        condition: () => goal.currentAmount >= goal.targetAmount * 0.25,
        earned: false,
      },
      {
        id: 'goal_50_percent',
        title: 'Halfway Hero',
        description: `Reached 50% of ${goal.name}`,
        icon: 'star_half',
        condition: () => goal.currentAmount >= goal.targetAmount * 0.5,
        earned: false,
      },
      {
        id: 'goal_75_percent',
        title: 'Almost There',
        description: `Reached 75% of ${goal.name}`,
        icon: 'star',
        condition: () => goal.currentAmount >= goal.targetAmount * 0.75,
        earned: false,
      },
      {
        id: 'goal_completed',
        title: 'Goal Crusher',
        description: `Completed ${goal.name}`,
        icon: 'emoji_events',
        condition: () => goal.currentAmount >= goal.targetAmount,
        earned: false,
      },
      {
        id: 'multiple_goals',
        title: 'Multi-Goal Master',
        description: 'Have 3 or more active goals',
        icon: 'flag',
        condition: () => goals.value.filter((g) => g.currentAmount < g.targetAmount).length >= 3,
        earned: false,
      },
      {
        id: 'early_achiever',
        title: 'Early Bird',
        description: 'Completed a goal before its target date',
        icon: 'schedule',
        condition: () => {
          const targetDate = new Date(goal.targetDate)
          const today = new Date()
          return goal.currentAmount >= goal.targetAmount && today < targetDate
        },
        earned: false,
      },
    ]

    achievements.forEach((achievement) => {
      if (achievement.condition() && !userAchievements.value.find((a) => a.id === achievement.id)) {
        const newAchievement = {
          ...achievement,
          earned: true,
          earnedAt: new Date().toISOString(),
          goalId: goalId,
        }
        userAchievements.value.push(newAchievement)
        saveToLocalStorage()
        void createAchievementRemote(newAchievement)
      }
    })
  }

  const autoAllocateExtraIncome = (amount) => {
    if (!autoAllocationSettings.value.enabled || amount <= 0) return

    const allocationAmount = amount * (autoAllocationSettings.value.percentage / 100)
    const activeGoals = goals.value.filter((g) => g.currentAmount < g.targetAmount)

    if (activeGoals.length === 0) return

    // Sort goals by priority order, then by target date
    const sortedGoals = activeGoals.sort((a, b) => {
      const aPriority = autoAllocationSettings.value.priorityOrder.indexOf(a.id)
      const bPriority = autoAllocationSettings.value.priorityOrder.indexOf(b.id)

      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority
      }
      if (aPriority !== -1) return -1
      if (bPriority !== -1) return 1

      return new Date(a.targetDate) - new Date(b.targetDate)
    })

    let remainingAmount = allocationAmount
    for (const goal of sortedGoals) {
      if (remainingAmount <= 0) break

      const needed = goal.targetAmount - goal.currentAmount
      const toAllocate = Math.min(remainingAmount, needed)

      if (toAllocate > 0) {
        addMoneyToGoal(goal.id, toAllocate)
        remainingAmount -= toAllocate
      }
    }

    return allocationAmount - remainingAmount
  }

  const updateAutoAllocationSettings = (settings) => {
    autoAllocationSettings.value = { ...autoAllocationSettings.value, ...settings }
    saveToLocalStorage()
    void persistAutoAllocationSettings()
  }

  const setGoalPriority = (goalIds) => {
    autoAllocationSettings.value.priorityOrder = goalIds
    saveToLocalStorage()
    void persistAutoAllocationSettings()
  }

  const addBudget = (budget) => {
    const newBudget = {
      id: generateUuid(),
      ...budget,
      spent: 0,
    }
    budgets.value.push(newBudget)
    saveToLocalStorage()
    const apiPayload = normalizeAmountFields(newBudget, ['amount', 'spent'])
    void createRemoteRecord('/api/budgets', newBudget, budgets, apiPayload)
  }

  const updateBudget = (id, updates) => {
    const index = budgets.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      budgets.value[index] = { ...budgets.value[index], ...updates }
      saveToLocalStorage()
      const apiPayload = normalizeAmountFields(updates, ['amount', 'spent'])
      void updateRemoteRecord('/api/budgets', id, apiPayload, budgets)
    }
  }

  const deleteBudget = (id) => {
    const index = budgets.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      budgets.value.splice(index, 1)
      saveToLocalStorage()
      void deleteRemoteRecord('/api/budgets', id)
    }
  }

  // Recurring Transactions Actions
  const addRecurringTransaction = (recurringTransaction) => {
    const newRecurringTransaction = {
      id: generateUuid(),
      ...recurringTransaction,
      createdAt: new Date().toISOString(),
      lastProcessed: null,
      nextDue: calculateNextDueDate(recurringTransaction.frequency, recurringTransaction.startDate),
    }
    recurringTransactions.value.push(newRecurringTransaction)
    saveToLocalStorage()
    const apiPayload = normalizeAmountFields(
      {
        description: newRecurringTransaction.description,
        amount: newRecurringTransaction.amount,
        type: newRecurringTransaction.type,
        categoryId: newRecurringTransaction.categoryId,
        frequency: newRecurringTransaction.frequency,
        startDate: newRecurringTransaction.startDate,
        notes: newRecurringTransaction.notes,
        isActive: newRecurringTransaction.isActive,
      },
      ['amount'],
    )
    void createRemoteRecord(
      '/api/recurring-transactions',
      newRecurringTransaction,
      recurringTransactions,
      apiPayload,
    )
  }

  const updateRecurringTransaction = (id, updates) => {
    const index = recurringTransactions.value.findIndex((rt) => rt.id === id)
    if (index !== -1) {
      recurringTransactions.value[index] = {
        ...recurringTransactions.value[index],
        ...updates,
        nextDue: updates.frequency
          ? calculateNextDueDate(
              updates.frequency,
              updates.startDate || recurringTransactions.value[index].startDate,
            )
          : recurringTransactions.value[index].nextDue,
      }
      saveToLocalStorage()
      const apiPayload = normalizeAmountFields(updates, ['amount'])
      void updateRemoteRecord('/api/recurring-transactions', id, apiPayload, recurringTransactions)
    }
  }

  const deleteRecurringTransaction = (id) => {
    const index = recurringTransactions.value.findIndex((rt) => rt.id === id)
    if (index !== -1) {
      recurringTransactions.value.splice(index, 1)
      saveToLocalStorage()
      void deleteRemoteRecord('/api/recurring-transactions', id)
    }
  }

  const processRecurringTransactions = (force = false) => {
    const today = new Date().toISOString().split('T')[0]
    if (!force && lastRecurringProcessDate.value === today) {
      return []
    }

    const processed = []

    recurringTransactions.value.forEach((recurring) => {
      if (recurring.nextDue && recurring.nextDue <= today && recurring.isActive !== false) {
        // Create the transaction
        const transaction = {
          description: recurring.description,
          amount: recurring.amount,
          categoryId: recurring.categoryId,
          date: recurring.nextDue,
          type: recurring.type,
          notes: `Auto-generated from recurring: ${recurring.description}`,
          recurringTransactionId: recurring.id,
        }

        addTransaction(transaction)

        // Update the recurring transaction
        const nextDue = calculateNextDueDate(recurring.frequency, recurring.nextDue)
        updateRecurringTransaction(recurring.id, {
          lastProcessed: recurring.nextDue,
          nextDue: nextDue,
        })

        processed.push(recurring)
      }
    })

    if (processed.length > 0 || force) {
      lastRecurringProcessDate.value = today
    }

    return processed
  }

  const updateSettings = (settings) => {
    userSettings.value = { ...userSettings.value, ...settings }
    saveToLocalStorage()
    void persistUserSettings()
  }

  // Helper function to calculate next due date
  const calculateNextDueDate = (frequency, startDate) => {
    const today = new Date()
    const start = new Date(startDate)
    let date = new Date(start)

    // If start date is in the past, calculate next occurrence from today
    if (start < today) {
      date = new Date(today)

      // Adjust to the correct day of the month/week for monthly/weekly frequencies
      switch (frequency) {
        case 'monthly':
          date.setDate(start.getDate())
          if (date <= today) {
            date.setMonth(date.getMonth() + 1)
          }
          break
        case 'weekly': {
          const dayOfWeek = start.getDay()
          const currentDayOfWeek = today.getDay()
          const daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7
          if (daysUntilNext === 0) {
            date.setDate(date.getDate() + 7)
          } else {
            date.setDate(date.getDate() + daysUntilNext)
          }
          break
        }
        case 'biweekly': {
          const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24))
          const weeksSinceStart = Math.floor(daysSinceStart / 14)
          date = new Date(start)
          date.setDate(date.getDate() + (weeksSinceStart + 1) * 14)
          break
        }
        case 'quarterly':
          date.setDate(start.getDate())
          date.setMonth(start.getMonth())
          while (date <= today) {
            date.setMonth(date.getMonth() + 3)
          }
          break
        case 'yearly':
          date.setDate(start.getDate())
          date.setMonth(start.getMonth())
          while (date <= today) {
            date.setFullYear(date.getFullYear() + 1)
          }
          break
        case 'daily':
          date.setDate(date.getDate() + 1)
          break
        default:
          date.setMonth(date.getMonth() + 1)
      }
    } else {
      // Start date is in the future, use it as is
      switch (frequency) {
        case 'daily':
          date.setDate(date.getDate() + 1)
          break
        case 'weekly':
          date.setDate(date.getDate() + 7)
          break
        case 'biweekly':
          date.setDate(date.getDate() + 14)
          break
        case 'monthly':
          date.setMonth(date.getMonth() + 1)
          break
        case 'quarterly':
          date.setMonth(date.getMonth() + 3)
          break
        case 'yearly':
          date.setFullYear(date.getFullYear() + 1)
          break
        default:
          date.setMonth(date.getMonth() + 1)
      }
    }

    return date.toISOString().split('T')[0]
  }

  // Local Storage with Encryption
  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString()
  }

  const decryptData = (encryptedData) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }

  const unwrapPayload = (payload, fallback) => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data ?? fallback
    }
    return payload ?? fallback
  }

  const unwrapListPayload = (payload, key, fallback = []) => {
    const listKeys = [key, 'items', 'results']
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === 'object') {
      if ('data' in payload) {
        const data = payload.data
        if (Array.isArray(data)) return data
        if (data && typeof data === 'object') {
          for (const listKey of listKeys) {
            if (listKey in data) {
              return Array.isArray(data[listKey]) ? data[listKey] : fallback
            }
          }
        }
      }
      for (const listKey of listKeys) {
        if (listKey in payload) {
          return Array.isArray(payload[listKey]) ? payload[listKey] : fallback
        }
      }
    }
    return fallback
  }

  const normalizeAmountFields = (payload, fields) => {
    const normalized = { ...payload }
    fields.forEach((field) => {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        normalized[field] = String(normalized[field])
      }
    })
    return normalized
  }

  const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === '') {
      return fallback
    }
    const parsed = Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  const normalizeDateValue = (value) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  }

  const normalizeUserSettings = (settings) => {
    if (!settings) return null
    return {
      ...settings,
      startingBalance: toNumber(settings.startingBalance, 0),
      currentBalance: toNumber(settings.currentBalance, 0),
    }
  }

  const normalizeTransaction = (transaction) => {
    const normalizedDate = normalizeDateValue(
      transaction?.date ?? transaction?.transactionDate ?? transaction?.createdAt,
    )
    return {
      ...transaction,
      date: normalizedDate || transaction?.date || null,
      amount: toNumber(transaction.amount, 0),
    }
  }

  const normalizeBudget = (budget) => ({
    ...budget,
    amount: toNumber(budget.amount, 0),
    spent: toNumber(budget.spent, 0),
  })

  const normalizeGoal = (goal) => ({
    ...goal,
    targetAmount: toNumber(goal.targetAmount, 0),
    currentAmount: toNumber(goal.currentAmount, 0),
  })

  const normalizeRecurring = (recurring) => ({
    ...recurring,
    amount: toNumber(recurring.amount, 0),
  })

  const applyServerRecord = (listRef, tempId, record) => {
    if (!record) return
    const index = listRef.value.findIndex((item) => item.id === tempId)
    if (index !== -1) {
      listRef.value[index] = { ...listRef.value[index], ...record }
    }
  }

  const createRemoteRecord = async (endpoint, record, listRef, payloadOverride) => {
    const tempId = record?.id
    const createPromise = (async () => {
      try {
        const payload = payloadOverride ? { ...payloadOverride } : { ...record }
        delete payload.id
        const response = await apiRequest(endpoint, { method: 'POST', body: payload })
        return unwrapPayload(response, null)
      } catch (error) {
        console.warn(`Failed to create ${endpoint}:`, error)
        return null
      }
    })()

    if (tempId) {
      pendingCreates.set(tempId, createPromise)
    }

    const serverRecord = await createPromise

    if (tempId) {
      pendingCreates.delete(tempId)
    }

    if (serverRecord?.id && listRef && tempId) {
      applyServerRecord(listRef, tempId, serverRecord)
    }

    return serverRecord
  }

  const resolveRemoteId = async (id) => {
    if (pendingCreates.has(id)) {
      const serverRecord = await pendingCreates.get(id)
      if (serverRecord?.id) {
        return serverRecord.id
      }
    }
    return id
  }

  const updateRemoteRecord = async (endpoint, id, updates, listRef) => {
    try {
      if (!isUuid(id) && listRef) {
        const record = listRef.value.find((item) => item.id === id)
        if (record) {
          await createRemoteRecord(endpoint, record, listRef)
        }
        return
      }

      const remoteId = await resolveRemoteId(id)
      if (!isUuid(remoteId)) return

      const response = await apiRequest(`${endpoint}/${remoteId}`, { method: 'PUT', body: updates })
      const serverRecord = unwrapPayload(response, null)
      if (serverRecord && listRef) {
        applyServerRecord(listRef, id, serverRecord)
      }
    } catch (error) {
      console.warn(`Failed to update ${endpoint}/${id}:`, error)
    }
  }

  const deleteRemoteRecord = async (endpoint, id) => {
    try {
      const remoteId = await resolveRemoteId(id)
      if (!isUuid(remoteId)) return
      await apiRequest(`${endpoint}/${remoteId}`, { method: 'DELETE' })
    } catch (error) {
      console.warn(`Failed to delete ${endpoint}/${id}:`, error)
    }
  }

  const deleteAllRemoteRecords = async (endpoint) => {
    try {
      const payload = await apiRequest(endpoint)
      const records = unwrapPayload(payload, [])
      await Promise.all(records.map((record) => deleteRemoteRecord(endpoint, record.id)))
    } catch (error) {
      console.warn(`Failed to clear ${endpoint}:`, error)
    }
  }

  const persistUserSettings = async () => {
    try {
      await apiRequest('/api/settings/user', { method: 'PUT', body: userSettings.value })
    } catch (error) {
      console.warn('Failed to persist user settings:', error)
    }
  }

  const persistNotificationSettings = async () => {
    try {
      await apiRequest('/api/settings/notifications', {
        method: 'PUT',
        body: notificationSettings.value,
      })
    } catch (error) {
      console.warn('Failed to persist notification settings:', error)
    }
  }

  const persistAutoAllocationSettings = async () => {
    try {
      await apiRequest('/api/settings/auto-allocation', {
        method: 'PUT',
        body: autoAllocationSettings.value,
      })
    } catch (error) {
      console.warn('Failed to persist auto-allocation settings:', error)
    }
  }

  const createAchievementRemote = async (achievement) => {
    try {
      const payload = { ...achievement }
      delete payload.id
      await apiRequest('/api/achievements', {
        method: 'POST',
        body: payload,
      })
    } catch (error) {
      console.warn('Failed to create achievement:', error)
    }
  }

  const createNotificationRemote = async (notification) => {
    try {
      const payload = { ...notification }
      delete payload.id
      await apiRequest('/api/notifications', {
        method: 'POST',
        body: payload,
      })
    } catch (error) {
      console.warn('Failed to create notification:', error)
    }
  }

  const saveToLocalStorage = () => {
    const data = {
      transactions: transactions.value,
      budgets: budgets.value,
      goals: goals.value,
      recurringTransactions: recurringTransactions.value,
      categories: categories.value,
      userSettings: userSettings.value,
      userAchievements: userAchievements.value,
      autoAllocationSettings: autoAllocationSettings.value,
      notificationSettings: notificationSettings.value,
      notifications: notifications.value,
      supportedCurrencies: supportedCurrencies.value,
      exchangeRates: exchangeRates.value,
      lastExchangeRateUpdate: lastExchangeRateUpdate.value,
    }
    localStorage.setItem(STORAGE_KEY, encryptData(data))
  }

  const loadFromLocalStorage = () => {
    const encryptedData = localStorage.getItem(STORAGE_KEY)
    if (encryptedData) {
      const data = decryptData(encryptedData)
      if (data) {
        transactions.value = data.transactions || []
        budgets.value = data.budgets || []
        goals.value = data.goals || []
        recurringTransactions.value = data.recurringTransactions || []
        categories.value = data.categories || categories.value
        userSettings.value = data.userSettings || userSettings.value
        userAchievements.value = data.userAchievements || []
        autoAllocationSettings.value = data.autoAllocationSettings || autoAllocationSettings.value
        notificationSettings.value = data.notificationSettings || notificationSettings.value
        notifications.value = data.notifications || []
        supportedCurrencies.value = data.supportedCurrencies || supportedCurrencies.value
        exchangeRates.value = data.exchangeRates || {}
        lastExchangeRateUpdate.value = data.lastExchangeRateUpdate || null
        normalizeLegacyIds()
        saveToLocalStorage()
        isLoaded.value = true
      }
    }
  }

  const loadFromApi = async () => {
    if (!getAuthToken()) return false
    if (isLoading.value) return false
    try {
      isLoading.value = true
      const requests = [
        ['transactions', '/api/transactions'],
        ['budgets', '/api/budgets'],
        ['goals', '/api/goals'],
        ['recurring-transactions', '/api/recurring-transactions'],
        ['categories', '/api/categories'],
        ['settings-user', '/api/settings/user'],
        ['settings-notifications', '/api/settings/notifications'],
        ['settings-auto-allocation', '/api/settings/auto-allocation'],
        ['exchange-rates', '/api/exchange-rates'],
        ['achievements', '/api/achievements'],
        ['notifications', '/api/notifications'],
      ]

      const startedAt = performance.now()
      console.info('[MindLifeKey] Loading API data...')

      const results = await Promise.all(
        requests.map(async ([label, url]) => {
          const start = performance.now()
          const payload = await apiRequest(url)
          const elapsedMs = Math.round(performance.now() - start)
          console.info(`[MindLifeKey] Loaded ${label} (${elapsedMs} ms)`)
          return payload
        }),
      )

      const totalMs = Math.round(performance.now() - startedAt)
      console.info(`[MindLifeKey] API data load complete (${totalMs} ms)`)

      const [
        transactionsPayload,
        budgetsPayload,
        goalsPayload,
        recurringPayload,
        categoriesPayload,
        userSettingsPayload,
        notificationSettingsPayload,
        autoAllocationPayload,
        exchangeRatesPayload,
        achievementsPayload,
        notificationsPayload,
      ] = results

      transactions.value = unwrapListPayload(transactionsPayload, 'transactions', []).map(
        normalizeTransaction,
      )
      budgets.value = unwrapListPayload(budgetsPayload, 'budgets', []).map(normalizeBudget)
      goals.value = unwrapListPayload(goalsPayload, 'goals', []).map(normalizeGoal)
      recurringTransactions.value = unwrapListPayload(
        recurringPayload,
        'recurringTransactions',
        [],
      ).map(normalizeRecurring)
      const incomingCategories = unwrapListPayload(
        categoriesPayload,
        'categories',
        categories.value,
      )
      categories.value =
        Array.isArray(incomingCategories) && incomingCategories.length > 0
          ? incomingCategories
          : categories.value

      const incomingUserSettings = normalizeUserSettings(unwrapPayload(userSettingsPayload, null))
      if (incomingUserSettings) {
        userSettings.value = { ...userSettings.value, ...incomingUserSettings }
      }

      const incomingNotificationSettings = unwrapPayload(notificationSettingsPayload, null)
      if (incomingNotificationSettings) {
        notificationSettings.value = {
          ...notificationSettings.value,
          ...incomingNotificationSettings,
        }
      }

      const incomingAutoAllocation = unwrapPayload(autoAllocationPayload, null)
      if (incomingAutoAllocation) {
        autoAllocationSettings.value = {
          ...autoAllocationSettings.value,
          ...incomingAutoAllocation,
        }
      }

      const incomingExchangeRates = unwrapPayload(exchangeRatesPayload, null)
      if (incomingExchangeRates) {
        exchangeRates.value =
          incomingExchangeRates.rates || incomingExchangeRates.exchangeRates || {}
        lastExchangeRateUpdate.value =
          incomingExchangeRates.lastExchangeRateUpdate || incomingExchangeRates.lastUpdated || null
      }

      userAchievements.value = unwrapListPayload(achievementsPayload, 'achievements', [])
      notifications.value = unwrapListPayload(notificationsPayload, 'notifications', [])
      isLoaded.value = true
      saveToLocalStorage()
      return true
    } catch (error) {
      console.warn('Failed to load data from API:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const initializeFromApi = async () => {
    const loaded = await loadFromApi()
    if (!loaded) {
      loadFromLocalStorage()
    }
  }

  const clearAllData = () => {
    transactions.value = []
    budgets.value = []
    goals.value = []
    recurringTransactions.value = []
    userAchievements.value = []
    autoAllocationSettings.value = {
      enabled: false,
      percentage: 10,
      priorityOrder: [],
    }
    notificationSettings.value = {
      billReminders: true,
      budgetAlerts: true,
      savingsEncouragement: true,
      achievementNotifications: true,
      reminderDays: 3,
      budgetThreshold: 80,
      savingsThreshold: 50,
    }
    notifications.value = []
    exchangeRates.value = {}
    lastExchangeRateUpdate.value = null
    userSettings.value = {
      currency: 'UGX',
      startingBalance: 0,
      currentBalance: 0,
    }
    localStorage.removeItem(STORAGE_KEY)
    void deleteAllRemoteRecords('/api/transactions')
    void deleteAllRemoteRecords('/api/budgets')
    void deleteAllRemoteRecords('/api/goals')
    void deleteAllRemoteRecords('/api/recurring-transactions')
    void deleteAllRemoteRecords('/api/achievements')
    void deleteAllRemoteRecords('/api/notifications')
    void persistUserSettings()
    void persistNotificationSettings()
    void persistAutoAllocationSettings()
  }

  // Initialize store
  if (getAuthToken()) {
    void initializeFromApi()
  } else {
    loadFromLocalStorage()
  }

  // Computed properties for notifications
  const upcomingBills = computed(() => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    return recurringTransactions.value
      .filter((rt) => {
        if (!rt.nextDue || rt.isActive === false) return false
        const dueDate = new Date(rt.nextDue)
        return dueDate >= today && dueDate <= nextWeek
      })
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
  })

  const overdueBills = computed(() => {
    const today = new Date().toISOString().split('T')[0]

    return recurringTransactions.value
      .filter((rt) => {
        return rt.nextDue && rt.nextDue < today && rt.isActive !== false
      })
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
  })

  // Cash Flow Forecasting
  const generateCashFlowProjection = (months = 12, scenarios = {}) => {
    const projection = []
    const startDate = new Date()
    let currentBalance = netWorth.value

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)

      // Calculate recurring transactions for this month
      const monthlyRecurring = calculateMonthlyRecurring(monthDate, scenarios)

      // Calculate historical average for non-recurring transactions
      const historicalAverage = calculateHistoricalAverage(monthDate, scenarios)

      const monthData = {
        month: monthDate.toISOString().split('T')[0],
        monthName: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startingBalance: currentBalance,
        recurringIncome: monthlyRecurring.income,
        recurringExpenses: monthlyRecurring.expenses,
        historicalIncome: historicalAverage.income,
        historicalExpenses: historicalAverage.expenses,
        totalIncome: monthlyRecurring.income + historicalAverage.income,
        totalExpenses: monthlyRecurring.expenses + historicalAverage.expenses,
        netCashFlow:
          monthlyRecurring.income +
          historicalAverage.income -
          (monthlyRecurring.expenses + historicalAverage.expenses),
        endingBalance:
          currentBalance +
          (monthlyRecurring.income + historicalAverage.income) -
          (monthlyRecurring.expenses + historicalAverage.expenses),
      }

      projection.push(monthData)
      currentBalance = monthData.endingBalance
    }

    return projection
  }

  const calculateMonthlyRecurring = (monthDate, scenarios = {}) => {
    let income = 0
    let expenses = 0

    recurringTransactions.value.forEach((rt) => {
      if (rt.isActive === false) return

      const shouldInclude = shouldIncludeRecurringInMonth(rt, monthDate)
      if (shouldInclude) {
        const amount = rt.amount * (scenarios[`recurring_${rt.id}`] || 1)
        if (rt.type === 'income') {
          income += amount
        } else {
          expenses += amount
        }
      }
    })

    return { income, expenses }
  }

  const shouldIncludeRecurringInMonth = (recurring, monthDate) => {
    const startDate = new Date(recurring.startDate)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

    if (startDate > monthEnd) return false

    switch (recurring.frequency) {
      case 'daily':
        return true
      case 'weekly':
        return true
      case 'biweekly':
        return true
      case 'monthly':
        return true
      case 'quarterly': {
        const quarter = Math.floor(monthDate.getMonth() / 3)
        const startQuarter = Math.floor(startDate.getMonth() / 3)
        return (
          (monthDate.getFullYear() - startDate.getFullYear()) * 4 + (quarter - startQuarter) >= 0
        )
      }
      case 'yearly':
        return monthDate.getFullYear() >= startDate.getFullYear()
      default:
        return true
    }
  }

  const calculateHistoricalAverage = (monthDate, scenarios = {}) => {
    const monthsToLookBack = 6
    const historicalData = { income: 0, expenses: 0 }
    let validMonths = 0

    for (let i = 1; i <= monthsToLookBack; i++) {
      const historicalMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - i, 1)
      const monthTransactions = transactions.value.filter((t) => {
        const transactionDate = new Date(t.date)
        return (
          transactionDate.getMonth() === historicalMonth.getMonth() &&
          transactionDate.getFullYear() === historicalMonth.getFullYear() &&
          !t.recurringTransactionId
        ) // Exclude auto-generated transactions
      })

      if (monthTransactions.length > 0) {
        const monthIncome = monthTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const monthExpenses = monthTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        historicalData.income += monthIncome
        historicalData.expenses += monthExpenses
        validMonths++
      }
    }

    if (validMonths > 0) {
      historicalData.income =
        (historicalData.income / validMonths) * (scenarios.historicalIncomeMultiplier || 1)
      historicalData.expenses =
        (historicalData.expenses / validMonths) * (scenarios.historicalExpensesMultiplier || 1)
    }

    return historicalData
  }

  // Advanced Reporting Functions
  const generateMonthlyReport = (year, month) => {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)

    const monthTransactions = transactions.value.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= monthStart && transactionDate <= monthEnd
    })

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const expensesByCategory = categories.value
      .map((category) => {
        const categoryExpenses = monthTransactions
          .filter((t) => t.type === 'expense' && t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          categoryId: category.id,
          categoryName: category.name,
          amount: categoryExpenses,
          percentage: expenses > 0 ? (categoryExpenses / expenses) * 100 : 0,
        }
      })
      .filter((cat) => cat.amount > 0)

    return {
      year,
      month,
      monthName: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      income,
      expenses,
      netIncome: income - expenses,
      transactionCount: monthTransactions.length,
      expensesByCategory,
      averageTransactionAmount:
        monthTransactions.length > 0 ? (income + expenses) / monthTransactions.length : 0,
    }
  }

  const generateYearlyReport = (year) => {
    const monthlyReports = []
    let totalIncome = 0
    let totalExpenses = 0
    let totalTransactions = 0

    for (let month = 0; month < 12; month++) {
      const monthlyReport = generateMonthlyReport(year, month)
      monthlyReports.push(monthlyReport)
      totalIncome += monthlyReport.income
      totalExpenses += monthlyReport.expenses
      totalTransactions += monthlyReport.transactionCount
    }

    return {
      year,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      totalTransactions,
      monthlyReports,
      averageMonthlyIncome: totalIncome / 12,
      averageMonthlyExpenses: totalExpenses / 12,
      averageMonthlyNet: (totalIncome - totalExpenses) / 12,
    }
  }

  const generateNetWorthHistory = () => {
    const history = []
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 12) // Last 12 months

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0)

      const monthTransactions = transactions.value.filter((t) => {
        const transactionDate = new Date(t.date)
        return transactionDate >= monthDate && transactionDate <= monthEnd
      })

      const monthIncome = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const monthExpenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const netWorthAtMonth =
        userSettings.value.startingBalance +
        transactions.value
          .filter((t) => new Date(t.date) <= monthEnd)
          .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)

      history.push({
        month: monthDate.toISOString().split('T')[0],
        monthName: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: monthIncome,
        expenses: monthExpenses,
        netIncome: monthIncome - monthExpenses,
        netWorth: netWorthAtMonth,
      })
    }

    return history
  }

  const generateTrendAnalysis = () => {
    const history = generateNetWorthHistory()
    const currentMonth = history[history.length - 1]
    const previousMonth = history[history.length - 2]
    const threeMonthsAgo = history[history.length - 4]

    const incomeTrend = previousMonth
      ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
      : 0

    const expenseTrend = previousMonth
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
      : 0

    const netWorthTrend = previousMonth
      ? ((currentMonth.netWorth - previousMonth.netWorth) / Math.abs(previousMonth.netWorth)) * 100
      : 0

    const threeMonthIncomeTrend = threeMonthsAgo
      ? ((currentMonth.income - threeMonthsAgo.income) / threeMonthsAgo.income) * 100
      : 0

    const threeMonthExpenseTrend = threeMonthsAgo
      ? ((currentMonth.expenses - threeMonthsAgo.expenses) / threeMonthsAgo.expenses) * 100
      : 0

    return {
      income: {
        current: currentMonth.income,
        previous: previousMonth?.income || 0,
        trend: incomeTrend,
        threeMonthTrend: threeMonthIncomeTrend,
      },
      expenses: {
        current: currentMonth.expenses,
        previous: previousMonth?.expenses || 0,
        trend: expenseTrend,
        threeMonthTrend: threeMonthExpenseTrend,
      },
      netWorth: {
        current: currentMonth.netWorth,
        previous: previousMonth?.netWorth || 0,
        trend: netWorthTrend,
      },
    }
  }

  const generateCategoryAnalysis = (months = 6) => {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const recentTransactions = transactions.value.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startDate && t.type === 'expense'
    })

    const categoryTotals = categories.value
      .map((category) => {
        const categoryExpenses = recentTransactions
          .filter((t) => t.categoryId === category.id)
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          categoryId: category.id,
          categoryName: category.name,
          color: category.color,
          amount: categoryExpenses,
          transactionCount: recentTransactions.filter((t) => t.categoryId === category.id).length,
          averageTransaction:
            categoryExpenses > 0
              ? categoryExpenses /
                recentTransactions.filter((t) => t.categoryId === category.id).length
              : 0,
        }
      })
      .filter((cat) => cat.amount > 0)

    const totalExpenses = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0)

    return categoryTotals
      .map((cat) => ({
        ...cat,
        percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Smart Notifications System
  const generateSmartNotifications = () => {
    const newNotifications = []
    const today = new Date()

    // Bill Reminders
    if (notificationSettings.value.billReminders) {
      const billReminders = generateBillReminders(today)
      newNotifications.push(...billReminders)
    }

    // Budget Alerts
    if (notificationSettings.value.budgetAlerts) {
      const budgetAlerts = generateBudgetAlerts()
      newNotifications.push(...budgetAlerts)
    }

    // Savings Encouragement
    if (notificationSettings.value.savingsEncouragement) {
      const savingsEncouragement = generateSavingsEncouragement()
      newNotifications.push(...savingsEncouragement)
    }

    // Achievement Notifications
    if (notificationSettings.value.achievementNotifications) {
      const achievementNotifications = generateAchievementNotifications()
      newNotifications.push(...achievementNotifications)
    }

    // Add new notifications to the list
    newNotifications.forEach((notification) => {
      if (!notifications.value.find((n) => n.id === notification.id)) {
        notifications.value.push(notification)
        void createNotificationRemote(notification)
      }
    })

    // Sort by priority and date
    notifications.value.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // Higher priority first
      }
      return new Date(b.createdAt) - new Date(a.createdAt) // Newer first
    })

    saveToLocalStorage()
    return newNotifications
  }

  const generateBillReminders = (today) => {
    const reminders = []
    const reminderDays = notificationSettings.value.reminderDays

    recurringTransactions.value.forEach((recurring) => {
      if (!recurring.nextDue || recurring.isActive === false) return

      const dueDate = new Date(recurring.nextDue)
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

      if (daysUntilDue <= reminderDays && daysUntilDue >= 0) {
        const priority = daysUntilDue === 0 ? 3 : daysUntilDue <= 1 ? 2 : 1
        const type = daysUntilDue === 0 ? 'overdue' : daysUntilDue <= 1 ? 'urgent' : 'reminder'

        reminders.push({
          id: `bill_${recurring.id}_${recurring.nextDue}`,
          type: 'bill_reminder',
          priority: priority,
          title: `${type === 'overdue' ? 'Overdue Bill' : type === 'urgent' ? 'Bill Due Soon' : 'Upcoming Bill'}`,
          message: `${recurring.description} (${formatCurrency(recurring.amount)}) ${type === 'overdue' ? 'was due' : 'is due'} ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}`,
          icon: type === 'overdue' ? 'warning' : type === 'urgent' ? 'schedule' : 'notifications',
          color: type === 'overdue' ? 'negative' : type === 'urgent' ? 'warning' : 'info',
          action: {
            type: 'navigate',
            route: '/recurring',
            label: 'View Bills',
          },
          createdAt: new Date().toISOString(),
          data: {
            recurringId: recurring.id,
            dueDate: recurring.nextDue,
            amount: recurring.amount,
          },
        })
      }
    })

    return reminders
  }

  const generateBudgetAlerts = () => {
    const alerts = []
    const threshold = notificationSettings.value.budgetThreshold

    budgets.value.forEach((budget) => {
      const category = categories.value.find((c) => c.id === budget.categoryId)
      if (!category) return

      const spent = transactions.value
        .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId)
        .reduce((sum, t) => sum + t.amount, 0)

      const percentage = (spent / budget.amount) * 100

      if (percentage >= threshold) {
        const priority = percentage >= 100 ? 3 : percentage >= 90 ? 2 : 1
        const type = percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'critical' : 'warning'

        alerts.push({
          id: `budget_${budget.id}_${new Date().toISOString().split('T')[0]}`,
          type: 'budget_alert',
          priority: priority,
          title: `Budget ${type === 'exceeded' ? 'Exceeded' : type === 'critical' ? 'Critical' : 'Warning'}`,
          message: `${category.name} budget: ${formatCurrency(spent)} / ${formatCurrency(budget.amount)} (${percentage.toFixed(1)}%)`,
          icon: type === 'exceeded' ? 'error' : type === 'critical' ? 'warning' : 'info',
          color: type === 'exceeded' ? 'negative' : type === 'critical' ? 'warning' : 'info',
          action: {
            type: 'navigate',
            route: '/transactions',
            label: 'View Transactions',
          },
          createdAt: new Date().toISOString(),
          data: {
            budgetId: budget.id,
            categoryId: budget.categoryId,
            spent: spent,
            budget: budget.amount,
            percentage: percentage,
          },
        })
      }
    })

    return alerts
  }

  const generateSavingsEncouragement = () => {
    const encouragements = []
    const threshold = notificationSettings.value.savingsThreshold

    goals.value.forEach((goal) => {
      if (goal.currentAmount >= goal.targetAmount) return // Skip completed goals

      const percentage = (goal.currentAmount / goal.targetAmount) * 100
      const daysRemaining = Math.ceil(
        (new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24),
      )

      // Encourage when reaching threshold
      if (percentage >= threshold && percentage < threshold + 10) {
        encouragements.push({
          id: `savings_${goal.id}_${Math.floor(percentage / 10)}`,
          type: 'savings_encouragement',
          priority: 1,
          title: 'Great Progress!',
          message: `You're ${percentage.toFixed(1)}% towards your ${goal.name} goal. Keep it up!`,
          icon: 'trending_up',
          color: 'positive',
          action: {
            type: 'navigate',
            route: '/enhanced-goals',
            label: 'View Goals',
          },
          createdAt: new Date().toISOString(),
          data: {
            goalId: goal.id,
            percentage: percentage,
            daysRemaining: daysRemaining,
          },
        })
      }

      // Urgent reminder if goal is due soon and not on track
      if (daysRemaining <= 30 && daysRemaining > 0 && percentage < 80) {
        const neededPerDay = (goal.targetAmount - goal.currentAmount) / daysRemaining
        encouragements.push({
          id: `savings_urgent_${goal.id}_${daysRemaining}`,
          type: 'savings_urgent',
          priority: 2,
          title: 'Goal Deadline Approaching',
          message: `${goal.name} is due in ${daysRemaining} days. You need to save ${formatCurrency(neededPerDay)} per day to reach your goal.`,
          icon: 'schedule',
          color: 'warning',
          action: {
            type: 'navigate',
            route: '/enhanced-goals',
            label: 'Add Money',
          },
          createdAt: new Date().toISOString(),
          data: {
            goalId: goal.id,
            daysRemaining: daysRemaining,
            neededPerDay: neededPerDay,
          },
        })
      }
    })

    return encouragements
  }

  const generateAchievementNotifications = () => {
    const achievementNotifications = []

    // Check for new achievements that haven't been notified
    userAchievements.value.forEach((achievement) => {
      if (!achievement.notified) {
        achievementNotifications.push({
          id: `achievement_${achievement.id}`,
          type: 'achievement',
          priority: 2,
          title: 'Achievement Unlocked!',
          message: `${achievement.title} - ${achievement.description}`,
          icon: achievement.icon,
          color: 'accent',
          action: {
            type: 'navigate',
            route: '/enhanced-goals',
            label: 'View Achievements',
          },
          createdAt: new Date().toISOString(),
          data: {
            achievementId: achievement.id,
          },
        })

        // Mark achievement as notified
        achievement.notified = true
      }
    })

    return achievementNotifications
  }

  const markNotificationAsRead = (notificationId) => {
    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      notification.readAt = new Date().toISOString()
      saveToLocalStorage()
      void updateRemoteRecord('/api/notifications', notificationId, {
        read: true,
        readAt: notification.readAt,
      })
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach((notification) => {
      if (!notification.read) {
        notification.read = true
        notification.readAt = new Date().toISOString()
        void updateRemoteRecord('/api/notifications', notification.id, {
          read: true,
          readAt: notification.readAt,
        })
      }
    })
    saveToLocalStorage()
  }

  const deleteNotification = (notificationId) => {
    const index = notifications.value.findIndex((n) => n.id === notificationId)
    if (index !== -1) {
      notifications.value.splice(index, 1)
      saveToLocalStorage()
      void deleteRemoteRecord('/api/notifications', notificationId)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
    saveToLocalStorage()
    void deleteAllRemoteRecords('/api/notifications')
  }

  const updateNotificationSettings = (settings) => {
    notificationSettings.value = { ...notificationSettings.value, ...settings }
    saveToLocalStorage()
    void persistNotificationSettings()
  }

  // Currency management actions
  const updateExchangeRates = async () => {
    try {
      // In a real app, you would fetch from an API like exchangerate-api.com
      // For now, we'll use static rates that can be updated manually
      const now = new Date()
      lastExchangeRateUpdate.value = now.toISOString()

      // Update rates (in a real app, these would come from an API)
      supportedCurrencies.value.forEach((currency) => {
        if (currency.code !== 'UGX') {
          // Simulate rate updates - in production, fetch from API
          exchangeRates.value[currency.code] = {
            rate: currency.rate,
            lastUpdated: now.toISOString(),
          }
        }
      })

      saveToLocalStorage()
      await apiRequest('/api/exchange-rates', {
        method: 'PUT',
        body: {
          rates: exchangeRates.value,
          lastExchangeRateUpdate: lastExchangeRateUpdate.value,
        },
      })
    } catch (error) {
      console.error('Failed to update exchange rates:', error)
    }
  }

  const setUserCurrency = (currencyCode) => {
    const currency = supportedCurrencies.value.find((c) => c.code === currencyCode)
    if (currency) {
      userSettings.value.currency = currencyCode
      saveToLocalStorage()
      void persistUserSettings()
    }
  }

  const addCustomCurrency = (currency) => {
    const existingCurrency = supportedCurrencies.value.find((c) => c.code === currency.code)
    if (!existingCurrency) {
      supportedCurrencies.value.push(currency)
      saveToLocalStorage()
    }
  }

  const removeCustomCurrency = (currencyCode) => {
    if (currencyCode !== 'UGX') {
      // Don't allow removing default currency
      const index = supportedCurrencies.value.findIndex((c) => c.code === currencyCode)
      if (index !== -1) {
        supportedCurrencies.value.splice(index, 1)
        saveToLocalStorage()
      }
    }
  }

  const getUnreadNotificationsCount = () => {
    return notifications.value.filter((n) => !n.read).length
  }

  const getHighPriorityNotifications = () => {
    return notifications.value.filter((n) => !n.read && n.priority >= 2)
  }

  return {
    // State
    transactions,
    budgets,
    goals,
    recurringTransactions,
    categories,
    userSettings,
    userAchievements,
    autoAllocationSettings,
    notificationSettings,
    notifications,
    supportedCurrencies,
    exchangeRates,
    lastExchangeRateUpdate,

    // Computed
    totalIncome,
    totalExpenses,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    expensesByCategory,
    upcomingBills,
    overdueBills,
    getCurrentCurrency,

    // Actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addMoneyToGoal,
    checkGoalAchievements,
    autoAllocateExtraIncome,
    updateAutoAllocationSettings,
    setGoalPriority,
    addBudget,
    updateBudget,
    deleteBudget,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processRecurringTransactions,
    generateCashFlowProjection,
    calculateMonthlyRecurring,
    calculateHistoricalAverage,
    generateMonthlyReport,
    generateYearlyReport,
    generateNetWorthHistory,
    generateTrendAnalysis,
    generateCategoryAnalysis,
    generateSmartNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    updateNotificationSettings,
    getUnreadNotificationsCount,
    getHighPriorityNotifications,
    updateSettings,
    isLoaded,
    isLoading,
    saveToLocalStorage,
    loadFromLocalStorage,
    initializeFromApi,
    clearAllData,

    // Currency management
    convertCurrency,
    formatCurrencyAmount,
    updateExchangeRates,
    setUserCurrency,
    addCustomCurrency,
    removeCustomCurrency,
  }
})
