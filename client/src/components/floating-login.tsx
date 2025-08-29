import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { X, Music, Shield } from 'lucide-react';

interface FloatingLoginProps {
  onSuccess?: () => void;
}

export default function FloatingLogin({ onSuccess }: FloatingLoginProps) {
  const handleLogin = () => {
    // Redirect to Replit auth login
    window.location.href = '/api/login';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Music className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Viral Views
            </h1>
          </div>
          <div>
            <CardTitle className="text-xl">Welcome to Viral Views</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              The ultimate music collaboration platform for rap battles, beat production, and real-time mixing
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium">Secure Authentication</p>
              <p className="text-blue-200/80">Sign in with your Replit account for secure access to all platform features.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
              data-testid="button-login"
            >
              Sign In with Replit
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy. 
              You must be 18+ to use this platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}