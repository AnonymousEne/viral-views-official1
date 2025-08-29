import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Camera, Settings, Radio, RotateCcw } from "lucide-react";

interface VideoStreamerProps {
  isStreaming?: boolean;
  onStreamStart?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  enableEffects?: boolean;
  roomId?: string;
}

export default function VideoStreamer({
  isStreaming = false,
  onStreamStart,
  onStreamEnd,
  quality = 'high',
  enableEffects = true,
  roomId
}: VideoStreamerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [resolution, setResolution] = useState({ width: 854, height: 480 }); // Mobile default
  const [frameRate, setFrameRate] = useState(24); // Lower for mobile
  const [bitrate, setBitrate] = useState(1000); // Mobile optimized
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Mobile-optimized video quality settings
  const getVideoConstraints = useCallback(() => {
    const qualitySettings = isMobileDevice ? {
      low: { width: 480, height: 360, frameRate: 15, bitrate: 300 }, // Very mobile friendly
      medium: { width: 640, height: 480, frameRate: 20, bitrate: 600 }, // Standard mobile
      high: { width: 854, height: 480, frameRate: 24, bitrate: 1000 }, // WiFi mobile
      ultra: { width: 1280, height: 720, frameRate: 30, bitrate: 1500 } // Mobile max
    } : {
      low: { width: 640, height: 360, frameRate: 15, bitrate: 500 },
      medium: { width: 854, height: 480, frameRate: 24, bitrate: 1000 },
      high: { width: 1280, height: 720, frameRate: 30, bitrate: 2500 },
      ultra: { width: 1920, height: 1080, frameRate: 60, bitrate: 5000 }
    };

    const settings = qualitySettings[quality];
    setResolution({ width: settings.width, height: settings.height });
    setFrameRate(settings.frameRate);
    setBitrate(settings.bitrate);

    return {
      video: {
        deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
        width: { ideal: isPortrait ? settings.height : settings.width },
        height: { ideal: isPortrait ? settings.width : settings.height },
        frameRate: { ideal: settings.frameRate, max: settings.frameRate },
        facingMode: isMobileDevice ? facingMode : 'user'
      },
      audio: false // Audio handled separately by AudioStreamer
    };
  }, [quality, selectedCamera, isMobileDevice, facingMode, isPortrait]);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to get cameras:', error);
    }
  }, [selectedCamera]);

  // Initialize video effects canvas
  const initializeVideoProcessing = useCallback(() => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = resolution.width;
      canvas.height = resolution.height;
      contextRef.current = canvas.getContext('2d');

      if (enableEffects && contextRef.current) {
        // Setup real-time video processing
        const processFrame = () => {
          if (contextRef.current && video && !video.paused && !video.ended) {
            contextRef.current.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Apply video effects here (filters, overlays, etc.)
            if (enableEffects) {
              const imageData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);
              // Example: Apply basic processing
              contextRef.current.putImageData(imageData, 0, 0);
            }
          }
          
          if (isRecording) {
            requestAnimationFrame(processFrame);
          }
        };

        video.addEventListener('play', processFrame);
      }
    }
  }, [resolution, enableEffects, isRecording]);

  // Start video streaming
  const startStreaming = useCallback(async () => {
    try {
      // Check for camera permission first
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permission.state === 'denied') {
        throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
      }

      const constraints = getVideoConstraints();
      console.log('Requesting video access with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      setIsRecording(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      initializeVideoProcessing();
      onStreamStart?.(stream);
      
      console.log('Video streaming started successfully');
      
    } catch (error) {
      console.error('Failed to start video stream:', error);
      
      let errorMessage = 'Failed to access camera.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('denied')) {
          errorMessage = 'Camera access denied. Please click the camera icon in your browser\'s address bar and allow camera access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use. Please close other applications using the camera.';
        }
      }
      
      // Show user-friendly error
      if (typeof window !== 'undefined') {
        alert(errorMessage);
      }
    }
  }, [getVideoConstraints, initializeVideoProcessing, onStreamStart]);

  // Stop video streaming
  const stopStreaming = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRecording(false);
    onStreamEnd?.();
  }, [onStreamEnd]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  }, [isVideoOn]);

  // Switch camera
  const switchCamera = useCallback(async (deviceId: string) => {
    setSelectedCamera(deviceId);
    
    if (isRecording) {
      // Restart stream with new camera
      stopStreaming();
      setTimeout(() => {
        startStreaming();
      }, 500);
    }
  }, [isRecording, stopStreaming, startStreaming]);

  // Mobile device detection and orientation handling
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkMobileAndOrientation();
    window.addEventListener('resize', checkMobileAndOrientation);
    window.addEventListener('orientationchange', checkMobileAndOrientation);
    
    return () => {
      window.removeEventListener('resize', checkMobileAndOrientation);
      window.removeEventListener('orientationchange', checkMobileAndOrientation);
    };
  }, []);

  // Initialize cameras on mount
  useEffect(() => {
    getAvailableCameras();
  }, [getAvailableCameras]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return (
    <Card className="bg-dark-200 border-dark-400 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Radio className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-white">Video Stream</h3>
            {roomId && (
              <Badge variant="outline" className="text-xs">
                Room: {roomId}
              </Badge>
            )}
          </div>
          <Badge 
            className={`${isRecording ? 'bg-red-500' : 'bg-gray-500'} text-white`}
            data-testid="video-stream-status"
          >
            {isRecording ? 'LIVE' : 'OFFLINE'}
          </Badge>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-dark-400 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isVideoOn ? 'opacity-0' : ''}`}
            data-testid="video-preview"
          />
          {enableEffects && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: isRecording && enableEffects ? 'block' : 'none' }}
            />
          )}
          
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
              <VideoOff className="w-16 h-16 text-gray-500" />
            </div>
          )}

          {/* Video overlay info */}
          {isRecording && (
            <div className="absolute top-4 left-4 space-y-1">
              <Badge className="bg-red-500 text-white text-xs">
                LIVE
              </Badge>
              <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {resolution.width}x{resolution.height} • {frameRate}fps
              </div>
            </div>
          )}
        </div>

        {/* Camera Selection - Mobile Optimized */}
        <div className="space-y-3">
          <label className="text-sm text-gray-400">Camera</label>
          
          {isMobileDevice ? (
            // Mobile camera switching (front/back)
            <div className="flex gap-2">
              <Button
                onClick={() => setFacingMode('user')}
                variant={facingMode === 'user' ? 'default' : 'outline'}
                className={`flex-1 h-12 ${
                  facingMode === 'user' 
                    ? 'bg-purple-500 text-white' 
                    : 'border-dark-400 text-white'
                }`}
                data-testid="front-camera"
              >
                <Camera className="w-5 h-5 mr-2" />
                Front
              </Button>
              <Button
                onClick={() => setFacingMode('environment')}
                variant={facingMode === 'environment' ? 'default' : 'outline'}
                className={`flex-1 h-12 ${
                  facingMode === 'environment' 
                    ? 'bg-purple-500 text-white' 
                    : 'border-dark-400 text-white'
                }`}
                data-testid="back-camera"
              >
                <Camera className="w-5 h-5 mr-2" />
                Back
              </Button>
            </div>
          ) : (
            // Desktop camera selection
            <div className="flex items-center space-x-2">
              <Select value={selectedCamera} onValueChange={switchCamera}>
                <SelectTrigger className="flex-1 bg-dark-300 border-dark-400 text-white">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent className="bg-dark-300 border-dark-400">
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="border-dark-400 text-white"
                onClick={() => getAvailableCameras()}
                data-testid="refresh-cameras"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {isMobileDevice && (
            <div className="text-xs text-gray-400 space-y-1">
              <div>Orientation: {isPortrait ? 'Portrait' : 'Landscape'}</div>
              <div>Resolution: {resolution.width}x{resolution.height}</div>
            </div>
          )}
        </div>

        {/* Quality Settings */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Quality:</span>
            <div className="text-white font-medium">{quality.toUpperCase()}</div>
          </div>
          <div>
            <span className="text-gray-400">Resolution:</span>
            <div className="text-white font-medium">{resolution.width}x{resolution.height}</div>
          </div>
          <div>
            <span className="text-gray-400">Bitrate:</span>
            <div className="text-white font-medium">{bitrate}kbps</div>
          </div>
        </div>

        {/* Stream Controls - Mobile Touch Friendly */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={isRecording ? stopStreaming : startStreaming}
            className={`${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white font-medium h-12 text-base flex-1 sm:flex-initial`}
            data-testid="video-stream-toggle"
          >
            {isRecording ? 'Stop Stream' : 'Start Stream'}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={toggleVideo}
              variant="outline"
              className={`border-dark-400 ${!isVideoOn ? 'text-red-500' : 'text-white'} h-12 px-4 flex-1 sm:flex-initial`}
              disabled={!isRecording}
              data-testid="video-toggle"
            >
              {isVideoOn ? <Video className="w-5 h-5 mr-2" /> : <VideoOff className="w-5 h-5 mr-2" />}
              {isVideoOn ? 'Video' : 'No Video'}
            </Button>

            <Button
              variant="outline"
              className="border-dark-400 text-white h-12 px-4"
              data-testid="video-settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stream Info */}
        {isRecording && (
          <div className="text-xs text-gray-400 space-y-1">
            <div>Resolution: {resolution.width}x{resolution.height}</div>
            <div>Frame Rate: {frameRate}fps</div>
            <div>Bitrate: {bitrate}kbps</div>
            <div>Codec: H.264</div>
            {enableEffects && <div>Effects: Enabled</div>}
          </div>
        )}
      </div>
    </Card>
  );
}