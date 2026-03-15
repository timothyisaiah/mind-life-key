import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Handle GitHub Pages SPA redirect (404.html stores the original path)
  let ghPagesRedirectHandled = false
  Router.beforeEach((to, from, next) => {
    if (!ghPagesRedirectHandled) {
      ghPagesRedirectHandled = true
      const stored = sessionStorage.getItem('gh-pages-redirect')
      if (stored) {
        sessionStorage.removeItem('gh-pages-redirect')
        const base = (process.env.VUE_ROUTER_BASE || '/').replace(/\/$/, '')
        let path = stored
        if (base && path.startsWith(base)) {
          path = path.slice(base.length) || '/'
        }
        if (path !== to.fullPath) {
          next(path)
          return
        }
      }
    }

    const authStore = useAuthStore()

    if (to.name === 'auth') {
      next()
      return
    }

    if (!authStore.isAuthenticated) {
      next({ name: 'auth' })
      return
    }

    next()
  })

  return Router
})
