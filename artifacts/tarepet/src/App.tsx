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

// Lazy-loaded secondary public pages
const About = lazy(() => import('@/pages/about'));
const Programs = lazy(() => import('@/pages/programs'));
const Admissions = lazy(() => import('@/pages/admissions'));
const Blog = lazy(() => import('@/pages/blog'));
const Contact = lazy(() => import('@/pages/contact'));
const Gallery = lazy(() => import('@/pages/gallery'));
const Events = lazy(() => import('@/pages/events'));
const SignIn = lazy(() => import('@/pages/sign-in'));

// Lazy-loaded authenticated dashboard suites
const AdminDashboard = lazy(() => import('@/pages/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/dashboard/TeacherDashboard'));
const TeacherProfile = lazy(() => import('@/pages/dashboard/TeacherProfile'));
const StudentDashboard = lazy(() => import('@/pages/dashboard/StudentDashboard'));
const ParentDashboard = lazy(() => import('@/pages/dashboard/ParentDashboard'));
const CBTExam = lazy(() => import('@/pages/dashboard/CBTExam'));
const CBTBuilder = lazy(() => import('@/pages/dashboard/CBTBuilder'));
const CBTApproval = lazy(() => import('@/pages/dashboard/CBTApproval'));
const SearchPage = lazy(() => import('@/pages/search-page'));
const NotificationsPage = lazy(() => import('@/pages/notifications-page'));

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
