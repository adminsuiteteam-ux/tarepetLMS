import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { AnimatePresence } from 'framer-motion';

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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Sign In page renders standalone without Layout */}
      <Route path="/sign-in" component={SignIn} />
      
      {/* All other pages use Layout wrapper */}
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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
