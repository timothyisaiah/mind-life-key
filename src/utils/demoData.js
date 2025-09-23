// Demo data for first-time users
export const generateDemoData = () => {
  const today = new Date()

  const demoTransactions = [
    // Income - spread across the last 30 days
    {
      description: 'Salary',
      amount: 3500,
      categoryId: 7, // Salary
      date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'income',
      notes: 'Monthly salary',
    },
    {
      description: 'Freelance Project',
      amount: 800,
      categoryId: 8, // Freelance
      date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'income',
      notes: 'Web development project',
    },

    // Expenses - spread across the last 30 days
    {
      description: 'Rent',
      amount: 1200,
      categoryId: 3, // Housing
      date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Monthly rent payment',
    },
    {
      description: 'Grocery Shopping',
      amount: 150,
      categoryId: 1, // Food & Dining
      date: new Date(today.getTime() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Weekly groceries',
    },
    {
      description: 'Gas',
      amount: 60,
      categoryId: 2, // Transportation
      date: new Date(today.getTime() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Car fuel',
    },
    {
      description: 'Netflix Subscription',
      amount: 15,
      categoryId: 4, // Entertainment
      date: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Monthly subscription',
    },
    {
      description: 'Restaurant Dinner',
      amount: 45,
      categoryId: 1, // Food & Dining
      date: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Date night dinner',
    },
    {
      description: 'Gym Membership',
      amount: 50,
      categoryId: 5, // Healthcare
      date: new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Monthly gym fee',
    },
    {
      description: 'Coffee',
      amount: 25,
      categoryId: 1, // Food & Dining
      date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Weekly coffee runs',
    },
    {
      description: 'Online Shopping',
      amount: 120,
      categoryId: 6, // Shopping
      date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'New clothes',
    },
    {
      description: 'Utilities',
      amount: 180,
      categoryId: 3, // Housing
      date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Electricity and water',
    },
    {
      description: 'Movie Tickets',
      amount: 30,
      categoryId: 4, // Entertainment
      date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Weekend movie',
    },
    {
      description: 'Grocery Shopping',
      amount: 140,
      categoryId: 1, // Food & Dining
      date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Weekly groceries',
    },
    {
      description: 'Uber Ride',
      amount: 15,
      categoryId: 2, // Transportation
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Airport pickup',
    },
    {
      description: 'Pharmacy',
      amount: 35,
      categoryId: 5, // Healthcare
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Prescription medication',
    },
    {
      description: 'Coffee',
      amount: 20,
      categoryId: 1, // Food & Dining
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'expense',
      notes: 'Morning coffee',
    },
  ]

  const demoGoals = [
    {
      name: 'Emergency Fund',
      targetAmount: 5000,
      targetDate: new Date(today.getFullYear() + 1, today.getMonth(), 1)
        .toISOString()
        .split('T')[0],
      description: 'Build a 6-month emergency fund for unexpected expenses',
      currentAmount: 1200,
    },
    {
      name: 'Vacation Fund',
      targetAmount: 2000,
      targetDate: new Date(today.getFullYear(), today.getMonth() + 6, 1)
        .toISOString()
        .split('T')[0],
      description: 'Save for a summer vacation to Europe',
      currentAmount: 450,
    },
    {
      name: 'New Laptop',
      targetAmount: 1500,
      targetDate: new Date(today.getFullYear(), today.getMonth() + 3, 1)
        .toISOString()
        .split('T')[0],
      description: 'Replace my old laptop for work',
      currentAmount: 800,
    },
  ]

  const demoBudgets = [
    {
      categoryId: 1, // Food & Dining
      amount: 400,
      period: 'monthly',
    },
    {
      categoryId: 2, // Transportation
      amount: 200,
      period: 'monthly',
    },
    {
      categoryId: 4, // Entertainment
      amount: 150,
      period: 'monthly',
    },
    {
      categoryId: 6, // Shopping
      amount: 300,
      period: 'monthly',
    },
  ]

  const demoRecurringTransactions = [
    {
      description: 'Salary',
      amount: 3500,
      type: 'income',
      categoryId: 7, // Salary
      frequency: 'monthly',
      startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
      notes: 'Monthly salary from work',
      isActive: true,
    },
    {
      description: 'Rent',
      amount: 1200,
      type: 'expense',
      categoryId: 3, // Housing
      frequency: 'monthly',
      startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
      notes: 'Monthly rent payment',
      isActive: true,
    },
    {
      description: 'Netflix Subscription',
      amount: 15,
      type: 'expense',
      categoryId: 4, // Entertainment
      frequency: 'monthly',
      startDate: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
      notes: 'Monthly streaming subscription',
      isActive: true,
    },
    {
      description: 'Gym Membership',
      amount: 50,
      type: 'expense',
      categoryId: 5, // Healthcare
      frequency: 'monthly',
      startDate: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
      notes: 'Monthly gym membership',
      isActive: true,
    },
    {
      description: 'Utilities',
      amount: 180,
      type: 'expense',
      categoryId: 3, // Housing
      frequency: 'monthly',
      startDate: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
      notes: 'Electricity and water bills',
      isActive: true,
    },
  ]

  return {
    transactions: demoTransactions,
    goals: demoGoals,
    budgets: demoBudgets,
    recurringTransactions: demoRecurringTransactions,
    userSettings: {
      currency: 'USD',
      startingBalance: 2500,
      currentBalance: 2500,
    },
  }
}

export const loadDemoData = (financialStore) => {
  const demoData = generateDemoData()

  // Add transactions
  demoData.transactions.forEach((transaction) => {
    financialStore.addTransaction(transaction)
  })

  // Add goals
  demoData.goals.forEach((goal) => {
    financialStore.addGoal(goal)
  })

  // Add budgets
  demoData.budgets.forEach((budget) => {
    financialStore.addBudget(budget)
  })

  // Add recurring transactions
  demoData.recurringTransactions.forEach((recurring) => {
    financialStore.addRecurringTransaction(recurring)
  })

  // Update settings
  financialStore.updateSettings(demoData.userSettings)
}
