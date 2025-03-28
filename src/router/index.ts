import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/logo3D',
      component: HomeView,
      children: [
        {
          path: '/logo3D',
          name: 'logo3D',
          component: () => import('@/views/logo3D/index.vue'),
        },
      ],
    },

  ],
})

export default router
