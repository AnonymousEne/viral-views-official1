import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, SkipBack, SkipForward, RotateCcw 
} from "lucide-react";

interface StreamPlayerProps {
  src?: string;
  streamUrl?: string;
  isLive?: boolean;
  title?: string;
  streamer?: string;
  viewers?: number;
  quality?: 'auto' | 'low' | 'medium' | 'high' | 'ultra';
  onQualityChange?: (quality: string) => void;
  enableChapters?: boolean;
  enableEffects?: boolean;
}

export default function StreamPlayer({
  src,
  streamUrl,
  isLive = false,
  title,
  streamer,
  viewers,
  quality = 'auto',
  onQualityChange,
  enableChapters = true,
  enableEffects = true
}: StreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bitrate, setBitrate] = useState(0);
  const [fps, setFps] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Quality settings
  const qualityOptions = [
    { value: 'auto', label: 'Auto', bitrate: 0 },
    { value: 'low', label: '360p', bitrate: 500 },
    { value: 'medium', label: '480p', bitrate: 1000 },
    { value: 'high', label: '720p', bitrate: 2500 },
    { value: 'ultra', label: '1080p', bitrate: 5000 }
  ];

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedData = () => {
      setIsLoading(false);
      if (!isLive) {
        setDuration(video.duration);
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      updateBuffered();
    };

    const handleProgress = () => updateBuffered();
    
    const handleCanPlay = () => setIsLoading(false);
    
    const handleWaiting = () => setIsLoading(true);
    
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setIsLoading(false);
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
    };
  }, [isLive]);

  // Update buffered progress
  const updateBuffered = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return;

    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const bufferedPercent = (bufferedEnd / video.duration) * 100;
    setBuffered(bufferedPercent);
  }, []);

  // Monitor stream quality
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const updateStats = () => {
      // Get video quality stats (approximation)
      if (video.videoWidth && video.videoHeight) {
        const estimatedBitrate = quality === 'auto' ? 
          Math.round((video.videoWidth * video.videoHeight * 30) / 1000) :
          qualityOptions.find(q => q.value === quality)?.bitrate || 0;
        setBitrate(estimatedBitrate);
      }
      
      // Estimate FPS (simplified)
      setFps(isLive ? 30 : 24);
    };

    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [quality, isLive]);

  // Hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Seek
  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video || isLive) return;
    
    const seekTime = (value[0] / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  }, [duration, isLive]);

  // Volume control
  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    setVolume(value);
    video.volume = value[0] / 100;
    setIsMuted(value[0] === 0);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume[0] / 100;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Skip functions
  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  }, [isLive]);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.min(duration, video.currentTime + 10);
  }, [duration, isLive]);

  // Format time
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card 
      ref={containerRef}
      className="bg-dark-200 border-dark-400 overflow-hidden relative group"
      onMouseMove={resetControlsTimeout}
      onMouseEnter={resetControlsTimeout}
      data-testid="stream-player"
    >
      {/* Video Element */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={src || streamUrl}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          autoPlay={isLive}
          muted={isMuted}
          playsInline
          data-testid="video-element"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-500 text-white animate-pulse">
              LIVE
            </Badge>
          </div>
        )}

        {/* Stream Info */}
        {(title || streamer) && (
          <div className="absolute top-4 right-4 text-right">
            {title && (
              <div className="text-white font-semibold bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                {title}
              </div>
            )}
            {streamer && (
              <div className="text-gray-300 text-xs bg-black bg-opacity-50 px-2 py-1 rounded mt-1">
                {streamer}
              </div>
            )}
          </div>
        )}

        {/* Viewer Count */}
        {viewers && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="outline" className="bg-black bg-opacity-50 text-white border-gray-600">
              {viewers.toLocaleString()} viewers
            </Badge>
          </div>
        )}

        {/* Controls Overlay */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          {!isLive && (
            <div className="absolute bottom-20 left-4 right-4">
              <div className="space-y-1">
                {/* Buffered progress */}
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-gray-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${buffered}%` }}
                  />
                  <div 
                    className="bg-purple-500 h-1 rounded-full transition-all duration-100"
                    style={{ width: `${progressPercent}%`, marginTop: '-4px' }}
                  />
                </div>
                
                {/* Time display */}
                <div className="flex justify-between text-xs text-white">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <Button
                onClick={togglePlay}
                size="icon"
                className="bg-purple-500 hover:bg-purple-600 text-white"
                data-testid="play-pause-button"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              {/* Skip Controls (not for live) */}
              {!isLive && (
                <>
                  <Button
                    onClick={skipBackward}
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-purple-500"
                    data-testid="skip-backward"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={skipForward}
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-purple-500"
                    data-testid="skip-forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={toggleMute}
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-purple-500"
                  data-testid="mute-button"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                    data-testid="volume-slider"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Quality Badge */}
              <Badge variant="outline" className="text-xs text-white border-gray-600">
                {quality === 'auto' ? 'AUTO' : qualityOptions.find(q => q.value === quality)?.label}
              </Badge>

              {/* Stream Stats */}
              {(bitrate > 0 || fps > 0) && (
                <div className="text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded">
                  {bitrate > 0 && <span>{bitrate}kbps</span>}
                  {fps > 0 && <span className="ml-2">{fps}fps</span>}
                </div>
              )}

              {/* Settings */}
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:text-purple-500"
                data-testid="settings-button"
              >
                <Settings className="w-4 h-4" />
              </Button>

              {/* Fullscreen */}
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                size="icon"
                variant="ghost"
                className="text-white hover:text-purple-500"
                data-testid="fullscreen-button"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}