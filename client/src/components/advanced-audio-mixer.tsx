import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Volume2, VolumeX, Play, Pause, Square, RotateCcw, 
  Sliders, BarChart3, Mic, Headphones 
} from "lucide-react";
import WaveformVisualizer from "./waveform-visualizer";

interface AudioTrack {
  id: string;
  name: string;
  url?: string;
  stream?: MediaStream;
  type: 'beat' | 'vocal' | 'effect' | 'master';
  isPlaying: boolean;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  pan: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  effects: {
    reverb: number;
    delay: number;
    distortion: number;
  };
  waveformData?: number[];
}

interface AdvancedAudioMixerProps {
  tracks?: AudioTrack[];
  onTracksChange?: (tracks: AudioTrack[]) => void;
  onMasterVolumeChange?: (volume: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob) => void;
  enableRealTime?: boolean;
  sampleRate?: number;
}

export default function AdvancedAudioMixer({
  tracks = [],
  onTracksChange,
  onMasterVolumeChange,
  onRecordingStart,
  onRecordingStop,
  enableRealTime = true,
  sampleRate = 44100
}: AdvancedAudioMixerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [masterVolume, setMasterVolume] = useState([75]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [bpm, setBpm] = useState(120);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [crossfaderPosition, setCrossfaderPosition] = useState([50]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackNodesRef = useRef<Map<string, {
    source?: AudioBufferSourceNode | MediaStreamAudioSourceNode;
    gainNode: GainNode;
    panNode: StereoPannerNode;
    eqNodes: {
      low: BiquadFilterNode;
      mid: BiquadFilterNode;
      high: BiquadFilterNode;
    };
    effectNodes: {
      reverb?: ConvolverNode;
      delay?: DelayNode;
      distortion?: WaveShaperNode;
    };
    analyser: AnalyserNode;
  }>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize audio context
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate,
          latencyHint: 'playback'
        });

        await audioContextRef.current.resume();

        // Create master gain node
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.connect(audioContextRef.current.destination);
        masterGainRef.current.gain.value = masterVolume[0] / 100;

      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudioContext();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [sampleRate, masterVolume]);

  // Create audio nodes for track
  const createTrackNodes = useCallback((trackId: string) => {
    if (!audioContextRef.current) return null;

    const audioContext = audioContextRef.current;
    
    // Create nodes
    const gainNode = audioContext.createGain();
    const panNode = audioContext.createStereoPanner();
    const analyser = audioContext.createAnalyser();
    
    // EQ nodes
    const lowEQ = audioContext.createBiquadFilter();
    const midEQ = audioContext.createBiquadFilter();
    const highEQ = audioContext.createBiquadFilter();
    
    // Configure EQ
    lowEQ.type = 'lowshelf';
    lowEQ.frequency.value = 320;
    lowEQ.gain.value = 0;
    
    midEQ.type = 'peaking';
    midEQ.frequency.value = 1000;
    midEQ.Q.value = 1;
    midEQ.gain.value = 0;
    
    highEQ.type = 'highshelf';
    highEQ.frequency.value = 3200;
    highEQ.gain.value = 0;

    // Configure analyser
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    // Effect nodes
    const delay = audioContext.createDelay(1.0);
    delay.delayTime.value = 0;

    // Create reverb impulse response
    const reverbBuffer = audioContext.createBuffer(2, 2 * sampleRate, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = reverbBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 2);
      }
    }
    
    const reverb = audioContext.createConvolver();
    reverb.buffer = reverbBuffer;

    // Create distortion curve
    const distortion = audioContext.createWaveShaper();
    const curve = new Float32Array(65536);
    const deg = Math.PI / 180;
    for (let i = 0; i < 32768; i++) {
      const x = (i / 32768) * 2 - 1;
      curve[i + 32768] = Math.tanh(x * 2) * 0.5;
    }
    distortion.curve = curve;
    distortion.oversample = '4x';

    // Connect nodes: source -> EQ -> effects -> gain -> pan -> analyser -> master
    const nodes = {
      gainNode,
      panNode,
      eqNodes: { low: lowEQ, mid: midEQ, high: highEQ },
      effectNodes: { reverb, delay, distortion },
      analyser
    };

    trackNodesRef.current.set(trackId, nodes);
    return nodes;
  }, [sampleRate]);

  // Load audio track
  const loadAudioTrack = useCallback(async (track: AudioTrack) => {
    if (!audioContextRef.current) return;

    const nodes = trackNodesRef.current.get(track.id) || createTrackNodes(track.id);
    if (!nodes) return;

    try {
      if (track.url) {
        // Load audio file
        const response = await fetch(track.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        
        // Connect audio chain
        source.connect(nodes.eqNodes.low);
        nodes.eqNodes.low.connect(nodes.eqNodes.mid);
        nodes.eqNodes.mid.connect(nodes.eqNodes.high);
        nodes.eqNodes.high.connect(nodes.gainNode);
        nodes.gainNode.connect(nodes.panNode);
        nodes.panNode.connect(nodes.analyser);
        nodes.analyser.connect(masterGainRef.current!);

        (nodes as any).source = source;
        
      } else if (track.stream) {
        // Use media stream
        const source = audioContextRef.current.createMediaStreamSource(track.stream);
        
        // Connect audio chain
        source.connect(nodes.eqNodes.low);
        nodes.eqNodes.low.connect(nodes.eqNodes.mid);
        nodes.eqNodes.mid.connect(nodes.eqNodes.high);
        nodes.eqNodes.high.connect(nodes.gainNode);
        nodes.gainNode.connect(nodes.panNode);
        nodes.panNode.connect(nodes.analyser);
        nodes.analyser.connect(masterGainRef.current!);

        (nodes as any).source = source;
      }
    } catch (error) {
      console.error('Failed to load audio track:', error);
    }
  }, [createTrackNodes]);

  // Update track parameters
  const updateTrackParameter = useCallback((trackId: string, parameter: string, value: number) => {
    const nodes = trackNodesRef.current.get(trackId);
    if (!nodes) return;

    switch (parameter) {
      case 'volume':
        nodes.gainNode.gain.value = value / 100;
        break;
      case 'pan':
        nodes.panNode.pan.value = (value - 50) / 50; // Convert 0-100 to -1 to 1
        break;
      case 'eq-low':
        nodes.eqNodes.low.gain.value = (value - 50) / 5; // Convert 0-100 to -10 to 10 dB
        break;
      case 'eq-mid':
        nodes.eqNodes.mid.gain.value = (value - 50) / 5;
        break;
      case 'eq-high':
        nodes.eqNodes.high.gain.value = (value - 50) / 5;
        break;
    }

    // Update track in state
    const updatedTracks = tracks.map(track => {
      if (track.id === trackId) {
        const updated = { ...track };
        switch (parameter) {
          case 'volume':
            updated.volume = value;
            break;
          case 'pan':
            updated.pan = value;
            break;
          case 'eq-low':
            updated.eq.low = value;
            break;
          case 'eq-mid':
            updated.eq.mid = value;
            break;
          case 'eq-high':
            updated.eq.high = value;
            break;
        }
        return updated;
      }
      return track;
    });

    onTracksChange?.(updatedTracks);
  }, [tracks, onTracksChange]);

  // Play/pause track
  const toggleTrackPlayback = useCallback((trackId: string) => {
    const nodes = trackNodesRef.current.get(trackId);
    const track = tracks.find(t => t.id === trackId);
    
    if (!nodes || !track) return;

    if (track.isPlaying) {
      // Stop track
      if (nodes.source && 'stop' in nodes.source) {
        (nodes.source as AudioBufferSourceNode).stop();
      }
    } else {
      // Start track
      loadAudioTrack(track);
      if (nodes.source && 'start' in nodes.source) {
        (nodes.source as AudioBufferSourceNode).start();
      }
    }

    const updatedTracks = tracks.map(t => 
      t.id === trackId ? { ...t, isPlaying: !t.isPlaying } : t
    );
    onTracksChange?.(updatedTracks);
  }, [tracks, onTracksChange, loadAudioTrack]);

  // Master controls
  const toggleMasterPlayback = useCallback(() => {
    if (isPlaying) {
      // Pause all tracks
      tracks.forEach(track => {
        const nodes = trackNodesRef.current.get(track.id);
        if (nodes?.source && 'stop' in nodes.source) {
          (nodes.source as AudioBufferSourceNode).stop();
        }
      });
    } else {
      // Play all tracks
      tracks.forEach(track => {
        if (track.isPlaying) {
          loadAudioTrack(track);
          const nodes = trackNodesRef.current.get(track.id);
          if (nodes?.source && 'start' in nodes.source) {
            (nodes.source as AudioBufferSourceNode).start();
          }
        }
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, tracks, loadAudioTrack]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!masterGainRef.current || !audioContextRef.current) return;

    try {
      // Create recording stream from master output
      const destination = audioContextRef.current.createMediaStreamDestination();
      masterGainRef.current.connect(destination);

      mediaRecorderRef.current = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        onRecordingStop?.(blob);
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      onRecordingStart?.();

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [onRecordingStart, onRecordingStop]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Update master volume
  const handleMasterVolumeChange = useCallback((value: number[]) => {
    setMasterVolume(value);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = value[0] / 100;
    }
    onMasterVolumeChange?.(value[0]);
  }, [onMasterVolumeChange]);

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card className="bg-dark-200 border-dark-400 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Master Controls</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {bpm} BPM
              </Badge>
              <Badge variant="outline" className="text-xs">
                {sampleRate / 1000}kHz
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={toggleMasterPlayback}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="master-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
              onClick={() => setCurrentTime(0)}
              variant="outline"
              className="border-dark-400 text-white"
              data-testid="master-stop"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>

            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
              data-testid="record-toggle"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Record
                </>
              )}
            </Button>
          </div>

          {/* Master Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Master Volume</label>
              <span className="text-sm text-white">{masterVolume[0]}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <VolumeX className="w-4 h-4 text-gray-400" />
              <Slider
                value={masterVolume}
                onValueChange={handleMasterVolumeChange}
                max={100}
                step={1}
                className="flex-1"
                data-testid="master-volume"
              />
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Crossfader */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Crossfader</label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">A</span>
              <Slider
                value={crossfaderPosition}
                onValueChange={setCrossfaderPosition}
                max={100}
                step={1}
                className="flex-1"
                data-testid="crossfader"
              />
              <span className="text-xs text-gray-400">B</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Track Mixer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <Card key={track.id} className="bg-dark-200 border-dark-400 p-4">
            <div className="space-y-4">
              {/* Track Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">{track.name}</h4>
                  <Badge className={`text-xs ${
                    track.type === 'beat' ? 'bg-purple-500' :
                    track.type === 'vocal' ? 'bg-blue-500' :
                    track.type === 'effect' ? 'bg-green-500' : 'bg-orange-500'
                  } text-white`}>
                    {track.type.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => toggleTrackPlayback(track.id)}
                    size="icon"
                    variant="outline"
                    className={`border-dark-400 w-8 h-8 ${track.isPlaying ? 'text-green-500' : 'text-white'}`}
                    data-testid={`track-play-${track.id}`}
                  >
                    {track.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Waveform */}
              {track.waveformData && (
                <div className="h-16">
                  <WaveformVisualizer
                    data={track.waveformData}
                    color="purple-500"
                    isPlaying={track.isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                  />
                </div>
              )}

              {/* Volume Control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Volume</span>
                  <span className="text-xs text-white">{track.volume}%</span>
                </div>
                <Slider
                  value={[track.volume]}
                  onValueChange={(value) => updateTrackParameter(track.id, 'volume', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  data-testid={`track-volume-${track.id}`}
                />
              </div>

              {/* Pan Control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Pan</span>
                  <span className="text-xs text-white">
                    {track.pan === 50 ? 'C' : track.pan < 50 ? `L${50 - track.pan}` : `R${track.pan - 50}`}
                  </span>
                </div>
                <Slider
                  value={[track.pan]}
                  onValueChange={(value) => updateTrackParameter(track.id, 'pan', value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  data-testid={`track-pan-${track.id}`}
                />
              </div>

              {/* EQ Controls */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">EQ</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Low</span>
                    <Slider
                      value={[track.eq.low]}
                      onValueChange={(value) => updateTrackParameter(track.id, 'eq-low', value[0])}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-16"
                      data-testid={`track-eq-low-${track.id}`}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Mid</span>
                    <Slider
                      value={[track.eq.mid]}
                      onValueChange={(value) => updateTrackParameter(track.id, 'eq-mid', value[0])}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-16"
                      data-testid={`track-eq-mid-${track.id}`}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">High</span>
                    <Slider
                      value={[track.eq.high]}
                      onValueChange={(value) => updateTrackParameter(track.id, 'eq-high', value[0])}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-16"
                      data-testid={`track-eq-high-${track.id}`}
                    />
                  </div>
                </div>
              </div>

              {/* Track Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => {
                      const updatedTracks = tracks.map(t => 
                        t.id === track.id ? { ...t, isMuted: !t.isMuted } : t
                      );
                      onTracksChange?.(updatedTracks);
                    }}
                    size="sm"
                    variant={track.isMuted ? "default" : "outline"}
                    className={`text-xs ${track.isMuted ? 'bg-red-500 text-white' : 'border-dark-400 text-white'}`}
                    data-testid={`track-mute-${track.id}`}
                  >
                    MUTE
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const updatedTracks = tracks.map(t => 
                        t.id === track.id ? { ...t, isSolo: !t.isSolo } : t
                      );
                      onTracksChange?.(updatedTracks);
                    }}
                    size="sm"
                    variant={track.isSolo ? "default" : "outline"}
                    className={`text-xs ${track.isSolo ? 'bg-yellow-500 text-white' : 'border-dark-400 text-white'}`}
                    data-testid={`track-solo-${track.id}`}
                  >
                    SOLO
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}