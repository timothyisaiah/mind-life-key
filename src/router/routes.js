const routes = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('pages/AuthPage.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: '/transactions',
        name: 'transactions',
        component: () => import('pages/TransactionsPage.vue'),
      },
      {
        path: '/goals',
        name: 'goals',
        component: () => import('pages/GoalsPage.vue'),
      },
      {
        path: '/reports',
        name: 'reports',
        component: () => import('pages/ReportsPage.vue'),
      },
      {
        path: '/recurring',
        name: 'recurring',
        component: () => import('pages/RecurringTransactionsPage.vue'),
      },
      {
        path: '/forecaster',
        name: 'forecaster',
        component: () => import('pages/CashFlowForecasterPage.vue'),
      },
      {
        path: '/enhanced-goals',
        name: 'enhanced-goals',
        component: () => import('pages/EnhancedGoalsPage.vue'),
      },
      {
        path: '/advanced-reports',
        name: 'advanced-reports',
        component: () => import('pages/AdvancedReportsPage.vue'),
      },
      {
        path: '/notifications',
        name: 'notifications',
        component: () => import('pages/NotificationsPage.vue'),
      },
      {
        path: '/currency',
        name: 'currency',
        component: () => import('pages/CurrencyPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
