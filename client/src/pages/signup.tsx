import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Music, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Signup() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleSignup = () => {
    // Redirect to Replit authentication (same as login)
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
            Join Viral Views
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Start your music collaboration journey
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Replit Authentication */}
          <div className="space-y-4">
            <Button
              data-testid="button-signup-replit"
              onClick={handleSignup}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
              size="lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Get Started with Replit
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-muted-foreground">Secure Registration</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <Shield className="inline w-4 h-4 mr-1" />
              Your account is secured by Replit's authentication system.
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
              <h4 className="text-white font-medium text-sm">What's included:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Access to live rap battles and ciphers</li>
                <li>• Beat marketplace and collaboration tools</li>
                <li>• Real-time audio streaming features</li>
                <li>• Community voting and engagement</li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login">
              <span data-testid="link-login" className="text-primary hover:underline font-medium">
                Sign in
              </span>
            </Link>
          </div>
          
          <div className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our terms and confirm you are 18+ years old.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}