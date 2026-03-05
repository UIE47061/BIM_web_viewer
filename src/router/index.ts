import { createRouter, createWebHistory } from 'vue-router'
import ViewerView from '@/views/ViewerView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'viewer',
      component: ViewerView
    }
  ]
})

export default router
