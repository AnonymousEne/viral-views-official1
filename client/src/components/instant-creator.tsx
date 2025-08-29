import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Camera, CameraOff, Mic, MicOff, RotateCw, 
  Play, Pause, Square, Download, Upload,
  Sparkles, Music, Volume2, Timer, Zap,
  Filter, Palette, Mic2, Radio
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioEffect {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

interface Beat {
  id: string;
  name: string;
  producer: string;
  bpm: number;
  genre: string;
  preview: string;
  price: number;
  trending: boolean;
}

interface InstantCreatorProps {
  onClose?: () => void;
  onPublish?: (recording: any) => void;
}

export default function InstantCreator({ onClose, onPublish }: InstantCreatorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState<'front' | 'back'>('front');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [beatVolume, setBeatVolume] = useState([70]);
  const [micVolume, setMicVolume] = useState([80]);
  const [showEffects, setShowEffects] = useState(false);
  const [showBeats, setShowBeats] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio effects
  const [audioEffects, setAudioEffects] = useState<AudioEffect[]>([
    { id: 'autotune', name: 'Auto-Tune', icon: '🎵', active: false },
    { id: 'reverb', name: 'Reverb', icon: '🌊', active: false },
    { id: 'echo', name: 'Echo', icon: '📢', active: false },
    { id: 'distortion', name: 'Distortion', icon: '⚡', active: false },
    { id: 'pitch-up', name: 'Pitch Up', icon: '⬆️', active: false },
    { id: 'pitch-down', name: 'Pitch Down', icon: '⬇️', active: false }
  ]);

  // Mock trending beats
  const [trendingBeats] = useState<Beat[]>([
    { id: '1', name: 'Midnight Vibes', producer: 'BeatMaster', bpm: 140, genre: 'Trap', preview: '', price: 0, trending: true },
    { id: '2', name: 'Street Dreams', producer: 'ProducerX', bpm: 128, genre: 'Drill', preview: '', price: 5, trending: true },
    { id: '3', name: 'City Lights', producer: 'WaveKing', bpm: 120, genre: 'R&B', preview: '', price: 0, trending: false },
    { id: '4', name: 'Boss Mode', producer: 'TrapLord', bpm: 150, genre: 'Trap', preview: '', price: 10, trending: true },
    { id: '5', name: 'Smooth Operator', producer: 'SoulBeats', bpm: 90, genre: 'Hip-Hop', preview: '', price: 0, trending: false }
  ]);

  // Initialize camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [cameraMode]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraMode === 'front' ? 'user' : 'environment',
          width: { ideal: 720 },
          height: { ideal: 1280 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Recording controls
  const startCountdown = useCallback(() => {
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      recordingRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        // Handle recording blob
        console.log('Recording completed:', blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          setRecordingProgress((newTime / 60) * 100); // 60 second max
          
          // Auto-stop at 60 seconds
          if (newTime >= 60) {
            stopRecording();
            return 60;
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Recording failed:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingRef.current && isRecording) {
      recordingRef.current.stop();
      recordingRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingProgress(0);
  }, [isRecording]);

  const togglePause = useCallback(() => {
    if (recordingRef.current) {
      if (isPaused) {
        recordingRef.current.resume();
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            setRecordingProgress((newTime / 60) * 100);
            if (newTime >= 60) {
              stopRecording();
              return 60;
            }
            return newTime;
          });
        }, 1000);
      } else {
        recordingRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  }, [isPaused, stopRecording]);

  const switchCamera = () => {
    setCameraMode(prev => prev === 'front' ? 'back' : 'front');
  };

  const toggleEffect = (effectId: string) => {
    setAudioEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, active: !effect.active }
        : effect
    ));
  };

  const selectBeat = (beat: Beat) => {
    setSelectedBeat(beat);
    setShowBeats(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Camera view */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${
          !isVideoEnabled ? 'hidden' : ''
        }`}
      />

      {/* No video overlay */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
          <div className="text-center text-white">
            <Radio className="w-16 h-16 mx-auto mb-4" />
            <div className="text-xl font-semibold">Audio Only Mode</div>
            <div className="text-gray-300">Voice recording active</div>
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-white text-8xl font-bold"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white bg-black/50 rounded-full"
          >
            ×
          </Button>

          <div className="flex items-center space-x-2">
            {selectedBeat && (
              <Badge className="bg-purple-500 text-white px-3 py-1">
                🎵 {selectedBeat.name}
              </Badge>
            )}
            {audioEffects.some(e => e.active) && (
              <Badge className="bg-blue-500 text-white px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Effects
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={switchCamera}
            className="text-white bg-black/50 rounded-full"
            disabled={!isVideoEnabled}
          >
            <RotateCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Recording progress */}
      {isRecording && (
        <div className="absolute top-16 left-4 right-4 z-40">
          <div className="bg-black/50 rounded-full p-2">
            <div className="flex items-center justify-between text-white text-sm mb-1">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                {formatTime(recordingTime)}
              </span>
              <span>{formatTime(60 - recordingTime)} left</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-red-500 h-1 rounded-full transition-all"
                style={{ width: `${recordingProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Side effects panel */}
      <AnimatePresence>
        {showEffects && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 w-64 h-full bg-black/80 backdrop-blur-sm z-30 p-4"
          >
            <div className="text-white">
              <h3 className="font-semibold mb-4">Audio Effects</h3>
              
              <div className="space-y-3 mb-6">
                {audioEffects.map(effect => (
                  <Button
                    key={effect.id}
                    variant={effect.active ? "default" : "outline"}
                    className={`w-full justify-start ${
                      effect.active ? 'bg-purple-500' : 'border-gray-600'
                    }`}
                    onClick={() => toggleEffect(effect.id)}
                  >
                    <span className="mr-2">{effect.icon}</span>
                    {effect.name}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Mic Volume</label>
                  <Slider
                    value={micVolume}
                    onValueChange={setMicVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{micVolume[0]}%</div>
                </div>

                {selectedBeat && (
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Beat Volume</label>
                    <Slider
                      value={beatVolume}
                      onValueChange={setBeatVolume}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">{beatVolume[0]}%</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beats panel */}
      <AnimatePresence>
        {showBeats && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 h-80 bg-black/90 backdrop-blur-sm z-30 p-4"
          >
            <div className="text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Trending Beats</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowBeats(false)}
                  className="text-white"
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {trendingBeats.map(beat => (
                  <div
                    key={beat.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedBeat?.id === beat.id 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => selectBeat(beat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold">{beat.name}</div>
                          {beat.trending && (
                            <Badge className="bg-red-500 text-xs">🔥 Trending</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          by {beat.producer} • {beat.bpm} BPM • {beat.genre}
                        </div>
                      </div>
                      <div className="text-right">
                        {beat.price === 0 ? (
                          <Badge className="bg-green-500">Free</Badge>
                        ) : (
                          <div className="text-sm">${beat.price}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left side quick actions */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowBeats(true)}
          className="text-white bg-black/50 rounded-full"
        >
          <Music className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEffects(true)}
          className="text-white bg-black/50 rounded-full"
        >
          <Sparkles className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsVideoEnabled(!isVideoEnabled)}
          className="text-white bg-black/50 rounded-full"
        >
          {isVideoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className="text-white bg-black/50 rounded-full"
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
      </div>

      {/* Bottom recording controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-6">
          {/* Timer */}
          <Button
            variant="ghost"
            onClick={startCountdown}
            className="text-white bg-black/50 rounded-full"
            disabled={isRecording}
          >
            <Timer className="w-5 h-5 mr-2" />
            3s
          </Button>

          {/* Main record button */}
          <div className="relative">
            <Button
              onMouseDown={isRecording ? undefined : startRecording}
              onMouseUp={isRecording ? undefined : stopRecording}
              onTouchStart={isRecording ? undefined : startRecording}
              onTouchEnd={isRecording ? undefined : stopRecording}
              onClick={isRecording ? (isPaused ? togglePause : stopRecording) : startCountdown}
              className={`w-20 h-20 rounded-full border-4 transition-all ${
                isRecording 
                  ? 'bg-red-500 border-red-300 scale-110' 
                  : 'bg-white border-gray-300 hover:scale-105'
              }`}
              disabled={countdown > 0}
            >
              {isRecording ? (
                isPaused ? <Play className="w-8 h-8 text-white" /> : <Square className="w-6 h-6 text-white" />
              ) : (
                <div className="w-6 h-6 bg-red-500 rounded-full" />
              )}
            </Button>
            
            {/* Recording ring */}
            {isRecording && (
              <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Upload existing */}
          <Button
            variant="ghost"
            className="text-white bg-black/50 rounded-full"
            disabled={isRecording}
          >
            <Upload className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Recording instructions */}
      {!isRecording && countdown === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center text-white text-sm z-30">
          <div>Hold to record • Tap for 3s countdown</div>
          <div className="text-xs text-gray-400 mt-1">Up to 60 seconds</div>
        </div>
      )}
    </div>
  );
}