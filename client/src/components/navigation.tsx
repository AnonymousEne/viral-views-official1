import { Link, useLocation } from "wouter";
import { Music, Plus, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="bg-dark-200 border-b border-dark-400 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-electric-500 rounded-xl flex items-center justify-center">
                <Music className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-electric-500 bg-clip-text text-transparent">
                Viral Views
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`font-medium transition-colors ${
              location === "/" ? "text-white" : "text-gray-400 hover:text-purple-500"
            }`} data-testid="nav-feed">
              Feed
            </Link>
            <Link href="/battles" className={`font-medium transition-colors ${
              location === "/battles" ? "text-white" : "text-gray-400 hover:text-purple-500"
            }`} data-testid="nav-battles">
              Battles
            </Link>
            <Link href="/mixing" className={`font-medium transition-colors ${
              location === "/mixing" ? "text-white" : "text-gray-400 hover:text-purple-500"
            }`} data-testid="nav-mixing">
              Mix
            </Link>
            <Link href="/beats" className={`font-medium transition-colors ${
              location === "/beats" ? "text-white" : "text-gray-400 hover:text-purple-500"
            }`} data-testid="nav-beats">
              Beats
            </Link>
            <Link href="/collaborations" className={`font-medium transition-colors ${
              location === "/collaborations" ? "text-white" : "text-gray-400 hover:text-purple-500"
            }`} data-testid="nav-collaborations">
              Collabs
            </Link>
            <Link href="/live" className={`font-medium transition-colors ${
              location === "/live" ? "text-white" : "text-gray-400 hover:text-purple-500"
            }`} data-testid="nav-live">
              Live
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className={`font-medium transition-colors ${
                location === "/admin" ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`} data-testid="nav-admin">
                Admin
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium"
              data-testid="button-create"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-dark-300"
                  data-testid="button-user-menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-highlight-500 to-gold-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium">{user?.displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{user?.username} • {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <DropdownMenuItem data-testid="menu-admin">
                      <Shield className="mr-2 h-4 w-4 text-red-500" />
                      <span className="text-red-500">Admin Panel</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="text-red-400 focus:text-red-400"
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
