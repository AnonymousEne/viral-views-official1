import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Settings, Radio } from "lucide-react";

interface AudioStreamerProps {
  isStreaming?: boolean;
  onStreamStart?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
  onAudioData?: (audioData: Float32Array) => void;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  enableEffects?: boolean;
  roomId?: string;
}

export default function AudioStreamer({
  isStreaming = false,
  onStreamStart,
  onStreamEnd,
  onAudioData,
  quality = 'high',
  enableEffects = true,
  roomId
}: AudioStreamerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bitrate, setBitrate] = useState(64); // Mobile default
  const [latency, setLatency] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [networkType, setNetworkType] = useState('unknown');
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Mobile-optimized audio quality settings
  const getAudioConstraints = useCallback(() => {
    const qualitySettings = {
      low: { sampleRate: 22050, channelCount: 1, bitrate: 32 }, // Mobile data saving
      medium: { sampleRate: 22050, channelCount: 1, bitrate: 64 }, // Standard mobile
      high: { sampleRate: 44100, channelCount: 2, bitrate: 96 }, // WiFi mobile
      ultra: { sampleRate: 44100, channelCount: 2, bitrate: 128 } // Mobile max (reduced from 256)
    };

    const settings = qualitySettings[quality];
    setBitrate(settings.bitrate);

    return {
      audio: {
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        latency: isMobileDevice ? 0.02 : 0.01, // Higher latency on mobile for stability
        sampleSize: 16
      }
    };
  }, [quality]);

  // Initialize audio processing
  const initializeAudioProcessing = useCallback(async (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: quality === 'ultra' ? 48000 : 44100,
        latencyHint: 'interactive'
      });

      const audioContext = audioContextRef.current;
      await audioContext.resume();

      // Create audio nodes
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      analyserRef.current = audioContext.createAnalyser();
      gainNodeRef.current = audioContext.createGain();
      processorRef.current = audioContext.createScriptProcessor(2048, 1, 1);

      // Configure analyser for real-time visualization
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;

      // Configure gain
      gainNodeRef.current.gain.value = volume[0] / 100;

      // Audio processing chain
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      
      if (enableEffects) {
        gainNodeRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContext.destination);
      } else {
        gainNodeRef.current.connect(audioContext.destination);
      }

      // Real-time audio level monitoring
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && !isMuted) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255 * 100);
          
          // Send audio data for visualization
          if (onAudioData) {
            const floatArray = new Float32Array(dataArray.length);
            for (let i = 0; i < dataArray.length; i++) {
              floatArray[i] = dataArray[i] / 255;
            }
            onAudioData(floatArray);
          }
        }
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
      
      // Measure latency
      const startTime = audioContext.currentTime;
      setTimeout(() => {
        setLatency(Math.round((audioContext.currentTime - startTime) * 1000));
      }, 100);

    } catch (error) {
      console.error('Audio processing initialization failed:', error);
    }
  }, [quality, volume, isMuted, enableEffects, isRecording, onAudioData, isMobileDevice]);

  // Start streaming
  const startStreaming = useCallback(async () => {
    try {
      // Check for microphone permission first
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permission.state === 'denied') {
        throw new Error('Microphone access denied. Please enable microphone permissions in your browser settings.');
      }

      const constraints = getAudioConstraints();
      console.log('Requesting audio access with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      setIsRecording(true);
      
      await initializeAudioProcessing(stream);
      onStreamStart?.(stream);
      
      console.log('Audio streaming started successfully');
      
    } catch (error) {
      console.error('Failed to start audio stream:', error);
      
      let errorMessage = 'Failed to access microphone.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('denied')) {
          errorMessage = 'Microphone access denied. Please click the microphone icon in your browser\'s address bar and allow microphone access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use. Please close other applications using the microphone.';
        }
      }
      
      // Show user-friendly error
      if (typeof window !== 'undefined') {
        alert(errorMessage);
      }
    }
  }, [getAudioConstraints, initializeAudioProcessing, onStreamStart]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
    onStreamEnd?.();
  }, [onStreamEnd]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  // Detect mobile device and monitor battery/network
  useEffect(() => {
    const checkMobileDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
    };

    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };

    const monitorNetwork = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkType(connection.effectiveType || 'unknown');
        
        connection.addEventListener('change', () => {
          setNetworkType(connection.effectiveType || 'unknown');
        });
      }
    };

    checkMobileDevice();
    monitorBattery();
    monitorNetwork();
    
    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);

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
            <h3 className="text-lg font-semibold text-white">Audio Stream</h3>
            {roomId && (
              <Badge variant="outline" className="text-xs">
                Room: {roomId}
              </Badge>
            )}
          </div>
          <Badge 
            className={`${isRecording ? 'bg-red-500' : 'bg-gray-500'} text-white`}
            data-testid="stream-status"
          >
            {isRecording ? 'LIVE' : 'OFFLINE'}
          </Badge>
        </div>

        {/* Audio Level Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Audio Level</span>
            <span className="text-sm text-gray-400">{Math.round(audioLevel)}%</span>
          </div>
          <div className="w-full bg-dark-400 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-100 ${
                audioLevel > 80 ? 'bg-red-500' : 
                audioLevel > 60 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>

        {/* Controls - Mobile Optimized */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Volume</label>
            <div className="flex items-center space-x-3">
              <VolumeX className="w-5 h-5 text-gray-400" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1 h-6" // Larger for mobile touch
                data-testid="volume-slider"
              />
              <Volume2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-white w-10 text-right">{volume[0]}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Quality</label>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {quality.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {bitrate}kbps
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Status</label>
              <div className="flex flex-wrap gap-1">
                {isMobileDevice && (
                  <Badge variant="outline" className="text-xs">
                    📱 Mobile
                  </Badge>
                )}
                {batteryLevel < 100 && (
                  <Badge variant="outline" className={`text-xs ${
                    batteryLevel < 20 ? 'text-red-500' : 'text-white'
                  }`}>
                    🔋 {batteryLevel}%
                  </Badge>
                )}
                {networkType !== 'unknown' && (
                  <Badge variant="outline" className="text-xs">
                    📶 {networkType}
                  </Badge>
                )}
              </div>
            </div>
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
            } text-white font-medium h-12 text-base flex-1 sm:flex-initial`} // Larger for mobile
            data-testid="stream-toggle"
          >
            {isRecording ? 'Stop Stream' : 'Start Stream'}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={toggleMute}
              variant="outline"
              className={`border-dark-400 ${isMuted ? 'text-red-500' : 'text-white'} h-12 px-4 flex-1 sm:flex-initial`}
              disabled={!isRecording}
              data-testid="mute-toggle"
            >
              {isMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>

            <Button
              variant="outline"
              className="border-dark-400 text-white h-12 px-4"
              data-testid="audio-settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stream Info */}
        {isRecording && (
          <div className="text-xs text-gray-400 space-y-1">
            <div>Sample Rate: {quality === 'ultra' ? '48kHz' : '44.1kHz'}</div>
            <div>Channels: {quality === 'low' || quality === 'medium' ? 'Mono' : 'Stereo'}</div>
            <div>Bitrate: {bitrate}kbps</div>
            {latency > 0 && <div>Latency: {latency}ms</div>}
          </div>
        )}
      </div>
    </Card>
  );
}