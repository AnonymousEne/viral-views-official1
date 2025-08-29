import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Music, Shield, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = () => {
    // Redirect to Replit authentication
    window.location.href = '/api/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Welcome Back
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Sign in to your Viral Views account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Replit Authentication */}
          <div className="space-y-4">
            <Button
              data-testid="button-login-replit"
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
              size="lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Replit
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-muted-foreground">Secure Authentication</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <Shield className="inline w-4 h-4 mr-1" />
              Your account is secured by Replit's authentication system.
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">New to Viral Views? </span>
            <Link href="/signup">
              <span data-testid="link-signup" className="text-primary hover:underline font-medium">
                Get started
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}