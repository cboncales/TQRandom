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
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
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
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/UserSettingsView.vue'),
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
  
  // Check if user has a token
  const hasToken = !!localStorage.getItem('access_token');
  
  // For guest-only pages (login/register)
  if (to.meta.guestOnly && hasToken) {
    next({ name: 'dashboard' });
    return;
  }
  
  // For protected routes
  if (to.meta.requiresAuth) {
    if (!hasToken) {
      // No token, redirect to login
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
    
    // Has token, verify it's valid
    const isAuthenticated = await authStore.checkAuth();
    if (!isAuthenticated) {
      // Token invalid, redirect to login
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }
  
  // Allow navigation
  next();
});

export default router;

