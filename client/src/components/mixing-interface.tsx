import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Track, type Collaboration } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Mic, 
  Music, 
  Plus, 
  Undo, 
  Redo, 
  Save,
  Download,
  Share2,
  Users
} from "lucide-react";
import WaveformVisualizer from "./waveform-visualizer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MixingInterfaceProps {
  projectId: string;
  onBack: () => void;
}

interface MixingTrack {
  id: string;
  name: string;
  artist: string;
  type: 'beat' | 'vocals' | 'instrument';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: string[];
  audioUrl?: string;
  waveformData: number[];
}

export default function MixingInterface({ projectId, onBack }: MixingInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState([75]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock mixing tracks - in real app, fetch from project data
  const [tracks, setTracks] = useState<MixingTrack[]>([
    {
      id: '1',
      name: 'Hip Hop Beat 120 BPM',
      artist: '@BeatMaster',
      type: 'beat',
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
      effects: [],
      waveformData: Array.from({length: 200}, () => Math.random() * 100)
    },
    {
      id: '2',
      name: 'Main Vocals - Verse 1',
      artist: '@MCThunder',
      type: 'vocals',
      volume: 75,
      pan: 0,
      muted: false,
      solo: false,
      effects: ['Reverb'],
      waveformData: Array.from({length: 200}, () => Math.random() * 80)
    }
  ]);

  const [selectedEffects, setSelectedEffects] = useState<string[]>(['Reverb']);
  const availableEffects = ['Reverb', 'Delay', 'Chorus', 'Auto-Tune', 'Distortion', 'EQ'];

  const { data: collaborations } = useQuery<Collaboration[]>({
    queryKey: ["/api/collaborations", { trackId: projectId }],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // In real implementation, save mixing state
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Project saved!",
        description: "Your mixing session has been saved.",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      // In real implementation, export mixed audio
      return new Promise(resolve => setTimeout(resolve, 2000));
    },
    onSuccess: () => {
      toast({
        title: "Export complete!",
        description: "Your mixed track is ready for download.",
      });
    },
  });

  const updateTrack = (trackId: string, updates: Partial<MixingTrack>) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  };

  const toggleEffect = (effect: string) => {
    setSelectedEffects(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  };

  const addNewTrack = () => {
    const newTrack: MixingTrack = {
      id: Date.now().toString(),
      name: 'New Layer',
      artist: '@You',
      type: 'vocals',
      volume: 75,
      pan: 0,
      muted: false,
      solo: false,
      effects: [],
      waveformData: Array.from({length: 200}, () => Math.random() * 60)
    };
    setTracks(prev => [...prev, newTrack]);
  };

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'beat': return Music;
      case 'vocals': return Mic;
      case 'instrument': return Music;
      default: return Music;
    }
  };

  const getTrackColor = (type: string) => {
    switch (type) {
      case 'beat': return 'bg-highlight-500';
      case 'vocals': return 'bg-purple-500';
      case 'instrument': return 'bg-electric-500';
      default: return 'bg-gray-500';
    }
  };

  // Simulate playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-dark-100">
      {/* Header */}
      <div className="bg-dark-200 border-b border-dark-400 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-gray-400 hover:text-white"
              data-testid="button-back-to-mixing"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Studio
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white" data-testid="project-title">
                {projectId === 'community-cypher' ? 'City Lights Cypher' : 'Street Symphony'}
              </h1>
              <p className="text-gray-400 text-sm">Collaborative Mix Session</p>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400 font-mono" data-testid="playback-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="border-success-500 text-success-500 hover:bg-success-500 hover:text-white"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              data-testid="button-stop"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Track Layers - Main Area */}
          <div className="lg:col-span-3">
            <Card className="bg-dark-200 border-dark-400">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>Track Layers</span>
                  <Button
                    onClick={addNewTrack}
                    className="bg-success-500 hover:bg-success-600 text-white"
                    data-testid="button-add-track"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Layer
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tracks.map((track) => {
                  const TrackIcon = getTrackIcon(track.type);
                  
                  return (
                    <div key={track.id} className="bg-dark-300 rounded-lg p-4" data-testid={`track-${track.id}`}>
                      {/* Track Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${getTrackColor(track.type)} rounded-full flex items-center justify-center`}>
                            <TrackIcon className="text-sm text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-white" data-testid={`track-name-${track.id}`}>
                              {track.name}
                            </div>
                            <div className="text-sm text-gray-400" data-testid={`track-artist-${track.id}`}>
                              {track.artist}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateTrack(track.id, { muted: !track.muted })}
                            className={track.muted ? "text-red-500" : "text-gray-400 hover:text-white"}
                            data-testid={`button-mute-${track.id}`}
                          >
                            M
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateTrack(track.id, { solo: !track.solo })}
                            className={track.solo ? "text-yellow-500" : "text-gray-400 hover:text-white"}
                            data-testid={`button-solo-${track.id}`}
                          >
                            S
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success-500 hover:text-success-400"
                            data-testid={`button-play-track-${track.id}`}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Waveform */}
                      <div className="mb-4">
                        <WaveformVisualizer 
                          data={track.waveformData} 
                          color={getTrackColor(track.type).replace('bg-', '')}
                          isPlaying={isPlaying}
                          currentTime={currentTime}
                          duration={duration}
                        />
                      </div>

                      {/* Track Controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-2 block">Volume</label>
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <Slider
                              value={[track.volume]}
                              onValueChange={([value]) => updateTrack(track.id, { volume: value })}
                              max={100}
                              step={1}
                              className="flex-1"
                              data-testid={`slider-volume-${track.id}`}
                            />
                            <span className="text-xs text-gray-400 w-8">{track.volume}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-2 block">Pan</label>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">L</span>
                            <Slider
                              value={[track.pan + 50]}
                              onValueChange={([value]) => updateTrack(track.id, { pan: value - 50 })}
                              max={100}
                              step={1}
                              className="flex-1"
                              data-testid={`slider-pan-${track.id}`}
                            />
                            <span className="text-xs text-gray-400">R</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Track Placeholder */}
                <div className="bg-dark-300 border-2 border-dashed border-gray-600 rounded-lg p-8">
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                    <div className="text-gray-400 mb-3">Add your layer to this track</div>
                    <Button 
                      onClick={addNewTrack}
                      className="bg-success-500 hover:bg-success-600 text-white"
                      data-testid="button-record-vocals"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Record Vocals
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mixing Controls - Sidebar */}
          <div className="space-y-6">
            {/* Master Controls */}
            <Card className="bg-dark-200 border-dark-400">
              <CardHeader>
                <CardTitle className="text-white">Master Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Volume */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Master Volume</label>
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <Slider
                      value={masterVolume}
                      onValueChange={setMasterVolume}
                      max={100}
                      step={1}
                      className="flex-1"
                      data-testid="slider-master-volume"
                    />
                    <span className="text-xs text-gray-400 w-8">{masterVolume[0]}</span>
                  </div>
                </div>

                {/* Effects */}
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">Audio Effects</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableEffects.map((effect) => (
                      <Button
                        key={effect}
                        variant={selectedEffects.includes(effect) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleEffect(effect)}
                        className={selectedEffects.includes(effect) 
                          ? "bg-purple-500 text-white" 
                          : "bg-dark-300 text-gray-400 border-dark-400 hover:text-white"
                        }
                        data-testid={`button-effect-${effect.toLowerCase()}`}
                      >
                        {effect}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Collaborators */}
            <Card className="bg-dark-200 border-dark-400">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="w-5 h-5 mr-2" />
                  Active Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mock collaborators */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-highlight-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    B
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">BeatMaster</div>
                    <Badge variant="outline" className="border-success-500 text-success-500 text-xs">
                      Online
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    M
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">MCThunder</div>
                    <Badge variant="outline" className="border-success-500 text-success-500 text-xs">
                      Online
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    Y
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">You</div>
                    <Badge variant="outline" className="border-success-500 text-success-500 text-xs">
                      Online
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Actions */}
        <Card className="bg-dark-200 border-dark-400 mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  data-testid="button-undo"
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button 
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  data-testid="button-redo"
                >
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="bg-dark-400 hover:bg-dark-300 text-white"
                  data-testid="button-save-project"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                  className="border-dark-400 text-gray-300 hover:text-white"
                  data-testid="button-export-mix"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportMutation.isPending ? 'Exporting...' : 'Export Mix'}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-electric-500 hover:from-purple-600 hover:to-electric-600 text-white font-medium"
                  data-testid="button-publish-track"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Publish Track
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
