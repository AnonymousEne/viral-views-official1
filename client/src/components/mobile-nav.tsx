import { Link, useLocation } from "wouter";
import { Home, Zap, Plus, Music, User, MessageCircle } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-200 border-t border-dark-400 md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        <Link href="/">
          <div className="flex flex-col items-center py-2 px-1" data-testid="mobile-nav-feed">
            <Home className={`text-lg mb-1 ${location === "/" ? "text-purple-500" : "text-gray-400"}`} />
            <span className={`text-xs ${location === "/" ? "text-purple-500" : "text-gray-400"}`}>Feed</span>
          </div>
        </Link>
        
        <Link href="/battles">
          <div className="flex flex-col items-center py-2 px-1" data-testid="mobile-nav-battles">
            <Zap className={`text-lg mb-1 ${location === "/battles" ? "text-red-500" : "text-gray-400"}`} />
            <span className={`text-xs ${location === "/battles" ? "text-red-500" : "text-gray-400"}`}>Battles</span>
          </div>
        </Link>
        
        <Link href="/messages">
          <div className="flex flex-col items-center py-2 px-1" data-testid="mobile-nav-messages">
            <MessageCircle className={`text-lg mb-1 ${location === "/messages" ? "text-electric-500" : "text-gray-400"}`} />
            <span className={`text-xs ${location === "/messages" ? "text-electric-500" : "text-gray-400"}`}>Chat</span>
          </div>
        </Link>
        
        <Link href="/live">
          <div className="flex flex-col items-center py-2 px-1" data-testid="mobile-nav-live">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-1 animate-pulse relative">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
              <span className="text-white text-xs font-bold">🔴</span>
            </div>
            <span className="text-xs text-red-500 font-bold">LIVE</span>
          </div>
        </Link>
        
        <Link href="/beats">
          <div className="flex flex-col items-center py-2 px-1" data-testid="mobile-nav-beats">
            <Music className={`text-lg mb-1 ${location === "/beats" ? "text-purple-500" : "text-gray-400"}`} />
            <span className={`text-xs ${location === "/beats" ? "text-purple-500" : "text-gray-400"}`}>Beats</span>
          </div>
        </Link>
        
        <Link href="/collaboration-hub">
          <div className="flex flex-col items-center py-2 px-1" data-testid="mobile-nav-collaborations">
            <User className={`text-lg mb-1 ${location === "/collaboration-hub" ? "text-purple-500" : "text-gray-400"}`} />
            <span className={`text-xs ${location === "/collaboration-hub" ? "text-purple-500" : "text-gray-400"}`}>Collabs</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
