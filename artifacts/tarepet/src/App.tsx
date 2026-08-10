import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Redirect, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
import Home from '@/pages/home';
import About from '@/pages/about';
import Programs from '@/pages/programs';
import Admissions from '@/pages/admissions';
import Blog from '@/pages/blog';
import Contact from '@/pages/contact';
import Gallery from '@/pages/gallery';
import Events from '@/pages/events';
import SignIn from '@/pages/sign-in';
import DashboardRedirect from '@/pages/dashboard/DashboardRedirect';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import TeacherDashboard from '@/pages/dashboard/TeacherDashboard';
import TeacherProfile from '@/pages/dashboard/TeacherProfile';
import StudentDashboard from '@/pages/dashboard/StudentDashboard';
import ParentDashboard from '@/pages/dashboard/ParentDashboard';
import CBTExam from '@/pages/dashboard/CBTExam';
import CBTBuilder from '@/pages/dashboard/CBTBuilder';
import CBTApproval from '@/pages/dashboard/CBTApproval';

const queryClient = new QueryClient();

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Standalone Pages (No public Header/Footer layout) */}
      <Route path="/sign-in" component={SignIn} />
      <Route path="/dashboard" component={DashboardRedirect} />

      {/* Protected Dashboard Routes — role-gated */}
      <Route path="/dashboard/admin">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/teacher">
        <ProtectedRoute allowedRoles={['TEACHER']}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/teacher/profile">
        <ProtectedRoute allowedRoles={['TEACHER']}>
          <TeacherProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher-profile">
        <ProtectedRoute allowedRoles={['TEACHER']}>
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
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <CBTExam />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cbt-builder">
        <ProtectedRoute allowedRoles={['TEACHER']}>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={getRouterBase()}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
