import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Battles from "./pages/battles";
import Mixing from "./pages/mixing";
import Beats from "./pages/beats";
import Live from "./pages/live";
import Profile from "./pages/profile";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Collaborations from "./pages/collaborations";
import Admin from "./pages/admin";
import SelectRole from "./pages/select-role";
import Navigation from "./components/navigation";
import MobileNav from "./components/mobile-nav";
import FloatingLogin from "./components/floating-login";
import GlobalMusicPlayer from "./components/music/global-music-player";

// New feature components
import EnhancedCollaborationTools from "./components/collaborations/enhanced-collaboration-tools";
import ArtistMessaging from "./components/social-interactions/artist-messaging";
import { LiveBattleRoomDemo } from "./components/live-battle-system/live-webrtc-manager";
import GamificationSystem from "./components/gamification-system/enhanced-gamification";

import { useAuth } from "./hooks/useAuth";

import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.role && location !== "/select-role") {
      setLocation("/select-role");
    }
  }, [isLoading, isAuthenticated, user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const shouldShowFloatingLogin = !isAuthenticated;

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      <Navigation />
      <main className="pb-20 md:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/battles" component={Battles} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/collaboration-hub" component={EnhancedCollaborationTools} />
          <Route path="/messages" component={ArtistMessaging} />
          <Route path="/live-battle" component={LiveBattleRoomDemo} />
          <Route path="/progress" component={GamificationSystem} />
          <Route path="/beats" component={Beats} />
          <Route path="/mixing" component={Mixing} />
          <Route path="/live" component={Live} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/select-role" component={SelectRole} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />
      <GlobalMusicPlayer />
      {shouldShowFloatingLogin && (
        <FloatingLogin
          onSuccess={() => {
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