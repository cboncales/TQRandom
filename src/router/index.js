import { createRouter, createWebHistory } from 'vue-router';
import { useAuthUserStore } from '@/stores/authUser';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/auth/AuthCallbackView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/test/:id/edit',
    name: 'edit-test',
    component: () => import('@/views/EditTestView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/test/:id/questions',
    name: 'question-management',
    component: () => import('@/views/QuestionManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/errors/ForbiddenView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthUserStore();
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const isAuthenticated = await authStore.checkAuth();
    
    if (!isAuthenticated) {
      // Redirect to login page
      next({ name: 'login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

