import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Redirect, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';

import { Suspense, lazy } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Eager initial landing page
import Home from '@/pages/home';
import DashboardRedirect from '@/pages/dashboard/DashboardRedirect';

/**
 * lazyWithRetry: wraps React.lazy with automatic chunk-load-failure recovery.
 * When a deployment changes asset hashes, old cached chunk references break.
 * This helper retries the import once, then forces a full page reload so users
 * are never stuck on the "Failed to fetch dynamically imported module" crash.
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err: any) => {
      const reloadKey = `chunk_reload_${factory.toString().slice(0, 60)}`;
      const hasReloaded = sessionStorage.getItem(reloadKey);
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        // Return a never-resolving promise while reload happens
        return new Promise(() => {}) as any;
      }
      // Already tried reload – surface the error so the error boundary catches it
      throw err;
    })
  );
}

// Lazy-loaded secondary public pages
const About = lazyWithRetry(() => import('@/pages/about'));
const Programs = lazyWithRetry(() => import('@/pages/programs'));
const Admissions = lazyWithRetry(() => import('@/pages/admissions'));
const Blog = lazyWithRetry(() => import('@/pages/blog'));
const Contact = lazyWithRetry(() => import('@/pages/contact'));
const Gallery = lazyWithRetry(() => import('@/pages/gallery'));
const Events = lazyWithRetry(() => import('@/pages/events'));
const SignIn = lazyWithRetry(() => import('@/pages/sign-in'));

// Lazy-loaded authenticated dashboard suites
const AdminDashboard = lazyWithRetry(() => import('@/pages/dashboard/AdminDashboard'));
const TeacherDashboard = lazyWithRetry(() => import('@/pages/dashboard/TeacherDashboard'));
const TeacherProfile = lazyWithRetry(() => import('@/pages/dashboard/TeacherProfile'));
const StudentDashboard = lazyWithRetry(() => import('@/pages/dashboard/StudentDashboard'));
const ParentDashboard = lazyWithRetry(() => import('@/pages/dashboard/ParentDashboard'));
const CBTExam = lazyWithRetry(() => import('@/pages/dashboard/CBTExam'));
const CBTBuilder = lazyWithRetry(() => import('@/pages/dashboard/CBTBuilder'));
const CBTApproval = lazyWithRetry(() => import('@/pages/dashboard/CBTApproval'));
const SearchPage = lazyWithRetry(() => import('@/pages/search-page'));
const NotificationsPage = lazyWithRetry(() => import('@/pages/notifications-page'));

import LoadingScreen from '@/components/ui/LoadingScreen';

const queryClient = new QueryClient();

function PageLoadingFallback() {
  return <LoadingScreen message="Loading Tarepet..." fullScreen={true} />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Layout>
      <Suspense fallback={<PageLoadingFallback />}>
        <Component />
      </Suspense>
    </Layout>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Switch>
      {/* Standalone Authentication Pages */}
      <Route path="/sign-in" component={SignIn} />
      <Route path="/signin" component={SignIn} />
      <Route path="/login" component={SignIn} />
      <Route path="/portal" component={SignIn} />
      <Route path="/dashboard" component={DashboardRedirect} />
      <Route path="/search" component={SearchPage} />
      <Route path="/dashboard/search" component={SearchPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/dashboard/notifications" component={NotificationsPage} />

      {/* Protected Dashboard Routes — role-gated */}
      <Route path="/dashboard/admin">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/teacher">
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/teacher/profile">
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
          <TeacherProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher-profile">
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
          <TeacherProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/student">
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/parent">
        <ProtectedRoute allowedRoles={['PARENT']}>
          <ParentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cbt-exam">
        <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
          <CBTExam />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cbt-builder">
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
          <CBTBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cbt-approval">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <CBTApproval />
        </ProtectedRoute>
      </Route>
      
      {/* Public Pages with Layout */}
      <Route path="/">
        <PublicRoute component={Home} />
      </Route>
      <Route path="/about">
        <PublicRoute component={About} />
      </Route>
      <Route path="/programs">
        <PublicRoute component={Programs} />
      </Route>
      <Route path="/admissions">
        <PublicRoute component={Admissions} />
      </Route>
      <Route path="/blog">
        <PublicRoute component={Blog} />
      </Route>
      <Route path="/gallery">
        <PublicRoute component={Gallery} />
      </Route>
      <Route path="/journal">
        <Redirect to="/gallery" />
      </Route>
      <Route path="/events">
        <PublicRoute component={Events} />
      </Route>
      <Route path="/contact">
        <PublicRoute component={Contact} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  </Suspense>
);
}

function getRouterBase() {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/' || base === './' || base === '.') {
    const pathname = window.location.pathname;
    if (pathname.includes('/tarepetwebapp')) {
      return '/tarepetwebapp';
    }
    return '';
  }
  return base.replace(/\/$/, '');
}

import { DialogProvider } from '@/context/DialogContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DialogProvider>
          <TooltipProvider>
            <WouterRouter base={getRouterBase()}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </DialogProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
