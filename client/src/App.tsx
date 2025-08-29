import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Battles from "@/pages/battles";
import Mixing from "@/pages/mixing";
import Beats from "@/pages/beats";
import Live from "@/pages/live";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Collaborations from "@/pages/collaborations";
import Admin from "@/pages/admin";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import FloatingLogin from "@/components/floating-login";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication (but only briefly)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Determine if we should show the floating login
  const shouldShowFloatingLogin = !isAuthenticated;

  // Always show the main app, but overlay login widget if needed
  return (
    <div className="min-h-screen bg-dark-100 text-white">
      {/* Main App - Always Visible */}
      <Navigation />
      <main className="pb-20 md:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/battles" component={Battles} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/beats" component={Beats} />
          <Route path="/mixing" component={Mixing} />
          <Route path="/live" component={Live} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />

      {/* Floating Login Overlay - Show when not authenticated */}
      {shouldShowFloatingLogin && (
        <FloatingLogin
          onSuccess={() => {
            // The floating login component handles auth refresh - just force a re-render
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          }}
        />
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    // Apply dark theme by default
    document.documentElement.classList.add("dark");
    document.body.className = "bg-dark-100 text-white font-inter";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;