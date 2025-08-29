import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, Shield, AlertTriangle, CheckCircle, X } from "lucide-react";

interface PermissionGuideProps {
  onClose?: () => void;
  showCamera?: boolean;
  showMicrophone?: boolean;
}

export default function PermissionGuide({ 
  onClose, 
  showCamera = true, 
  showMicrophone = true 
}: PermissionGuideProps) {
  const [step, setStep] = useState(1);

  const requestPermissions = async () => {
    try {
      const constraints: MediaStreamConstraints = {};
      
      if (showCamera) {
        constraints.video = true;
      }
      
      if (showMicrophone) {
        constraints.audio = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the stream immediately - we just wanted to trigger permission request
      stream.getTracks().forEach(track => track.stop());
      
      setStep(3); // Success step
    } catch (error) {
      console.error('Permission request failed:', error);
      setStep(2); // Manual instructions step
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <CardTitle>Camera & Microphone Access</CardTitle>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            We need access to your {showCamera && showMicrophone ? 'camera and microphone' : showCamera ? 'camera' : 'microphone'} for live streaming
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="flex justify-center space-x-4 mb-4">
                {showCamera && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </Badge>
                )}
                {showMicrophone && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Mic className="w-4 h-4" />
                    <span>Microphone</span>
                  </Badge>
                )}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your browser will ask for permission to access your {showCamera && showMicrophone ? 'camera and microphone' : showCamera ? 'camera' : 'microphone'}. 
                  Please click "Allow" when prompted.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={requestPermissions} 
                className="w-full bg-blue-500 hover:bg-blue-600"
                data-testid="button-request-permissions"
              >
                Grant Permissions
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Permission was blocked. Please follow these steps:
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">📍 Look for permission icons in your address bar:</p>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• Camera icon 📷 or Microphone icon 🎤</li>
                    <li>• Click the icon and select "Allow"</li>
                    <li>• Refresh the page if needed</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-3">
                  <p className="font-medium mb-2">⚙️ Alternative - Browser Settings:</p>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• Click the lock/info icon next to the URL</li>
                    <li>• Enable Camera and Microphone permissions</li>
                    <li>• Reload the page</li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={requestPermissions} 
                  variant="outline" 
                  className="flex-1"
                >
                  Try Again
                </Button>
                {onClose && (
                  <Button 
                    onClick={onClose} 
                    variant="ghost" 
                    className="flex-1"
                  >
                    Skip for Now
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 dark:text-green-400 font-medium">
                  Permissions Granted!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You can now use live streaming features.
                </p>
              </div>

              <Button 
                onClick={onClose} 
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}