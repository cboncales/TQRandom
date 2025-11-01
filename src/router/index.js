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
  const isAuthenticated = await authStore.checkAuth();
  
  // Redirect authenticated users away from guest-only pages (login/register)
  if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login page with redirect query
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }
  
  // Allow navigation
  next();
});

export default router;

