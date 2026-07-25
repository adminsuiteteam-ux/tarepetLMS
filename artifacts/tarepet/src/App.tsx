import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';

// Pages
import Home from '@/pages/home';
import About from '@/pages/about';
import Programs from '@/pages/programs';
import Admissions from '@/pages/admissions';
import Blog from '@/pages/blog';
import Contact from '@/pages/contact';
import Journal from '@/pages/journal';
import Events from '@/pages/events';
import SignIn from '@/pages/sign-in';
import DashboardRedirect from '@/pages/dashboard/DashboardRedirect';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import TeacherDashboard from '@/pages/dashboard/TeacherDashboard';
import StudentDashboard from '@/pages/dashboard/StudentDashboard';
import ParentDashboard from '@/pages/dashboard/ParentDashboard';
import CBTExam from '@/pages/dashboard/CBTExam';
import CBTBuilder from '@/pages/dashboard/CBTBuilder';
import CBTApproval from '@/pages/dashboard/CBTApproval';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Standalone Pages (No public Header/Footer layout) */}
      <Route path="/sign-in" component={SignIn} />
      <Route path="/dashboard" component={DashboardRedirect} />
      <Route path="/dashboard/admin" component={AdminDashboard} />
      <Route path="/dashboard/teacher" component={TeacherDashboard} />
      <Route path="/dashboard/student" component={StudentDashboard} />
      <Route path="/dashboard/parent" component={ParentDashboard} />
      <Route path="/dashboard/cbt-exam" component={CBTExam} />
      <Route path="/dashboard/cbt-builder" component={CBTBuilder} />
      <Route path="/dashboard/cbt-approval" component={CBTApproval} />
      
      {/* Public Pages with Layout wrapper */}
      <Route>
        <Layout>
          <AnimatePresence mode="wait">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/about" component={About} />
              <Route path="/programs" component={Programs} />
              <Route path="/admissions" component={Admissions} />
              <Route path="/blog" component={Blog} />
              <Route path="/journal" component={Journal} />
              <Route path="/events" component={Events} />
              <Route path="/contact" component={Contact} />
              <Route component={NotFound} />
            </Switch>
          </AnimatePresence>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
