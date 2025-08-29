import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, Mic, Settings, Monitor, DollarSign,
  BarChart3, TrendingUp, Eye, Clock, Users,
  Wifi, Battery, Signal, Zap, Shield, Star,
  Download, Upload, Video, Headphones, Radio
} from "lucide-react";

interface StreamingPreset {
  id: string;
  name: string;
  description: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  videoBitrate: number;
  audioBitrate: number;
  fps: number;
  resolution: string;
  batteryImpact: 'low' | 'medium' | 'high';
  dataUsage: string;
  recommended: boolean;
}

interface CameraSettings {
  front: boolean;
  back: boolean;
  ultraWide?: boolean;
  zoom: number;
  stabilization: boolean;
  nightMode: boolean;
  autoFocus: boolean;
}

interface AudioSettings {
  noiseReduction: boolean;
  echoCancel: boolean;
  autoGain: boolean;
  sampleRate: number;
  bitDepth: number;
  monitoring: boolean;
}

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
  };
  audience: {
    liveViewers: number;
    totalFollowers: number;
    engagement: number;
    demographics: {
      age: { [key: string]: number };
      location: { [key: string]: number };
    };
  };
  performance: {
    avgStreamDuration: number;
    peakViewers: number;
    chatActivity: number;
    retention: number;
  };
  monetization: {
    donations: number;
    subscriptions: number;
    sponsorships: number;
    merchandise: number;
  };
}

interface ProfessionalToolsProps {
  onPresetChange?: (preset: StreamingPreset) => void;
  onSettingsUpdate?: (settings: any) => void;
  className?: string;
}

export default function ProfessionalTools({
  onPresetChange,
  onSettingsUpdate,
  className = ""
}: ProfessionalToolsProps) {
  const [activeTab, setActiveTab] = useState<'streaming' | 'camera' | 'audio' | 'analytics' | 'monetization'>('streaming');
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    front: true,
    back: false,
    zoom: 1,
    stabilization: true,
    nightMode: false,
    autoFocus: true
  });
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    noiseReduction: true,
    echoCancel: true,
    autoGain: true,
    sampleRate: 44100,
    bitDepth: 16,
    monitoring: false
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [streamHealth, setStreamHealth] = useState({
    connection: 'excellent',
    latency: 45,
    bitrate: 2500,
    droppedFrames: 0.2
  });

  // Streaming presets
  const streamingPresets: StreamingPreset[] = [
    {
      id: 'mobile-optimized',
      name: 'Mobile Optimized',
      description: 'Best for streaming from mobile devices',
      quality: 'medium',
      videoBitrate: 1500,
      audioBitrate: 64,
      fps: 30,
      resolution: '720p',
      batteryImpact: 'low',
      dataUsage: '1.1 GB/hour',
      recommended: true
    },
    {
      id: 'balanced',
      name: 'Balanced Quality',
      description: 'Good balance of quality and performance',
      quality: 'medium',
      videoBitrate: 2500,
      audioBitrate: 96,
      fps: 30,
      resolution: '1080p',
      batteryImpact: 'medium',
      dataUsage: '1.8 GB/hour',
      recommended: false
    },
    {
      id: 'high-quality',
      name: 'High Quality',
      description: 'Best quality for professional streams',
      quality: 'high',
      videoBitrate: 4000,
      audioBitrate: 128,
      fps: 60,
      resolution: '1080p',
      batteryImpact: 'high',
      dataUsage: '2.8 GB/hour',
      recommended: false
    },
    {
      id: 'ultra-hd',
      name: 'Ultra HD',
      description: 'Maximum quality for premium content',
      quality: 'ultra',
      videoBitrate: 8000,
      audioBitrate: 256,
      fps: 60,
      resolution: '4K',
      batteryImpact: 'high',
      dataUsage: '5.5 GB/hour',
      recommended: false
    },
    {
      id: 'audio-only',
      name: 'Audio Only',
      description: 'Perfect for music and podcasts',
      quality: 'high',
      videoBitrate: 0,
      audioBitrate: 320,
      fps: 0,
      resolution: 'N/A',
      batteryImpact: 'low',
      dataUsage: '0.3 GB/hour',
      recommended: false
    }
  ];

  // Mock analytics data
  const generateAnalyticsData = useCallback((): AnalyticsData => {
    return {
      revenue: {
        total: 12450,
        thisMonth: 3200,
        growth: 23.5
      },
      audience: {
        liveViewers: 1247,
        totalFollowers: 45678,
        engagement: 8.7,
        demographics: {
          age: { '13-17': 15, '18-24': 35, '25-34': 30, '35-44': 15, '45+': 5 },
          location: { 'US': 40, 'UK': 15, 'Canada': 12, 'Australia': 8, 'Other': 25 }
        }
      },
      performance: {
        avgStreamDuration: 145,
        peakViewers: 3456,
        chatActivity: 15.2,
        retention: 67.8
      },
      monetization: {
        donations: 8750,
        subscriptions: 2100,
        sponsorships: 1200,
        merchandise: 400
      }
    };
  }, []);

  useEffect(() => {
    setAnalyticsData(generateAnalyticsData());
  }, [generateAnalyticsData]);

  // Update preset
  const handlePresetChange = useCallback((presetId: string) => {
    const preset = streamingPresets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      onPresetChange?.(preset);
    }
  }, [onPresetChange]);

  // Get quality color
  const getQualityColor = (quality: StreamingPreset['quality']) => {
    switch (quality) {
      case 'low': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-green-400';
      case 'ultra': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getBatteryColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Professional Tools</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Stream status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            
            {/* Connection indicators */}
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Wifi className="w-4 h-4" />
              <Signal className="w-4 h-4" />
              <Battery className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'streaming', label: 'Streaming', icon: Video },
          { id: 'camera', label: 'Camera', icon: Camera },
          { id: 'audio', label: 'Audio', icon: Mic },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'monetization', label: 'Revenue', icon: DollarSign }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant="ghost"
            className={`flex-1 rounded-none py-4 ${
              activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'streaming' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Streaming Presets</h2>
              <p className="text-gray-400">Optimize your stream for different scenarios</p>
            </div>

            {/* Current Stream Health */}
            {isLive && (
              <Card className="bg-black/50 border-gray-700 p-4 mb-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  Stream Health
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{streamHealth.connection}</div>
                    <div className="text-xs text-gray-400">Connection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{streamHealth.latency}ms</div>
                    <div className="text-xs text-gray-400">Latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{streamHealth.bitrate}</div>
                    <div className="text-xs text-gray-400">Bitrate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{streamHealth.droppedFrames}%</div>
                    <div className="text-xs text-gray-400">Dropped</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streamingPresets.map((preset) => (
                <Card 
                  key={preset.id} 
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedPreset === preset.id 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-700 bg-black/50 hover:border-gray-600'
                  }`}
                  onClick={() => handlePresetChange(preset.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold">{preset.name}</h3>
                        {preset.recommended && (
                          <Badge className="bg-green-500 text-xs">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{preset.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Quality indicators */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Quality</div>
                        <div className={`font-semibold ${getQualityColor(preset.quality)}`}>
                          {preset.quality.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Resolution</div>
                        <div className="font-semibold">{preset.resolution}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Video</div>
                        <div className="font-semibold">
                          {preset.videoBitrate > 0 ? `${preset.videoBitrate} kbps` : 'None'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Audio</div>
                        <div className="font-semibold">{preset.audioBitrate} kbps</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Battery</div>
                        <div className={`font-semibold ${getBatteryColor(preset.batteryImpact)}`}>
                          {preset.batteryImpact.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Data Usage</div>
                        <div className="font-semibold">{preset.dataUsage}</div>
                      </div>
                    </div>
                  </div>

                  {selectedPreset === preset.id && (
                    <div className="mt-4 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-center text-blue-400 text-sm">
                        <Zap className="w-4 h-4 mr-1" />
                        Active Preset
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Advanced Settings */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Advanced Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Custom Bitrate</label>
                  <Slider
                    value={[2500]}
                    max={8000}
                    min={500}
                    step={100}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">2500 kbps</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Frame Rate</label>
                  <div className="flex space-x-2">
                    {[24, 30, 60].map((fps) => (
                      <Button key={fps} variant="outline" size="sm" className="flex-1">
                        {fps} FPS
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Camera Settings</h2>
              <p className="text-gray-400">Configure camera and video options</p>
            </div>

            {/* Camera Selection */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Camera Selection</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setCameraSettings({...cameraSettings, front: true, back: false})}
                  variant={cameraSettings.front ? "default" : "outline"}
                  className="h-20 flex-col"
                >
                  <Camera className="w-6 h-6 mb-2" />
                  Front Camera
                </Button>
                <Button
                  onClick={() => setCameraSettings({...cameraSettings, front: false, back: true})}
                  variant={cameraSettings.back ? "default" : "outline"}
                  className="h-20 flex-col"
                >
                  <Video className="w-6 h-6 mb-2" />
                  Back Camera
                </Button>
              </div>
            </Card>

            {/* Zoom Control */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Zoom Level</h3>
              <Slider
                value={[cameraSettings.zoom]}
                onValueChange={(value) => setCameraSettings({...cameraSettings, zoom: value[0]})}
                max={10}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="text-sm text-gray-400 mt-2">{cameraSettings.zoom.toFixed(1)}x zoom</div>
            </Card>

            {/* Camera Features */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Camera Features</h3>
              <div className="space-y-4">
                {[
                  { key: 'stabilization', label: 'Image Stabilization', description: 'Reduces camera shake' },
                  { key: 'nightMode', label: 'Night Mode', description: 'Better low-light performance' },
                  { key: 'autoFocus', label: 'Auto Focus', description: 'Automatic focus adjustment' }
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{feature.label}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                    <Button
                      onClick={() => setCameraSettings({
                        ...cameraSettings,
                        [feature.key]: !cameraSettings[feature.key as keyof CameraSettings]
                      })}
                      variant={cameraSettings[feature.key as keyof CameraSettings] ? "default" : "outline"}
                      size="sm"
                    >
                      {cameraSettings[feature.key as keyof CameraSettings] ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Audio Settings</h2>
              <p className="text-gray-400">Configure audio quality and processing</p>
            </div>

            {/* Audio Processing */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Audio Processing</h3>
              <div className="space-y-4">
                {[
                  { key: 'noiseReduction', label: 'Noise Reduction', description: 'Filter background noise' },
                  { key: 'echoCancel', label: 'Echo Cancellation', description: 'Remove audio echo' },
                  { key: 'autoGain', label: 'Auto Gain Control', description: 'Automatic volume adjustment' },
                  { key: 'monitoring', label: 'Audio Monitoring', description: 'Hear your own audio' }
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{feature.label}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                    <Button
                      onClick={() => setAudioSettings({
                        ...audioSettings,
                        [feature.key]: !audioSettings[feature.key as keyof AudioSettings]
                      })}
                      variant={audioSettings[feature.key as keyof AudioSettings] ? "default" : "outline"}
                      size="sm"
                    >
                      {audioSettings[feature.key as keyof AudioSettings] ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Audio Quality */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Audio Quality</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Sample Rate</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[22050, 44100, 48000].map((rate) => (
                      <Button
                        key={rate}
                        onClick={() => setAudioSettings({...audioSettings, sampleRate: rate})}
                        variant={audioSettings.sampleRate === rate ? "default" : "outline"}
                        size="sm"
                      >
                        {rate} Hz
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Bit Depth</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[16, 24].map((depth) => (
                      <Button
                        key={depth}
                        onClick={() => setAudioSettings({...audioSettings, bitDepth: depth})}
                        variant={audioSettings.bitDepth === depth ? "default" : "outline"}
                        size="sm"
                      >
                        {depth}-bit
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Audio Levels */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <Headphones className="w-5 h-5 mr-2" />
                Live Audio Levels
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Microphone</span>
                    <span>-12 dB</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>System Audio</span>
                    <span>-18 dB</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Output</span>
                    <span>-6 dB</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
              <p className="text-gray-400">Track your performance and growth</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{analyticsData.audience.liveViewers.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Live Viewers</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{analyticsData.audience.totalFollowers.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Followers</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{analyticsData.performance.avgStreamDuration}m</div>
                <div className="text-xs text-gray-400">Avg Duration</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{analyticsData.audience.engagement}%</div>
                <div className="text-xs text-gray-400">Engagement</div>
              </Card>
            </div>

            {/* Revenue Overview */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Revenue Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    ${analyticsData.revenue.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ${analyticsData.revenue.thisMonth.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    +{analyticsData.revenue.growth}%
                  </div>
                  <div className="text-sm text-gray-400">Growth</div>
                </div>
              </div>
            </Card>

            {/* Audience Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-black/50 border-gray-700 p-4">
                <h3 className="font-semibold mb-4">Age Demographics</h3>
                <div className="space-y-3">
                  {Object.entries(analyticsData.audience.demographics.age).map(([age, percentage]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm">{age}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20 h-2" />
                        <span className="text-sm text-gray-400">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-black/50 border-gray-700 p-4">
                <h3 className="font-semibold mb-4">Top Locations</h3>
                <div className="space-y-3">
                  {Object.entries(analyticsData.audience.demographics.location).map(([location, percentage]) => (
                    <div key={location} className="flex items-center justify-between">
                      <span className="text-sm">{location}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20 h-2" />
                        <span className="text-sm text-gray-400">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'monetization' && analyticsData && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Revenue Tracking</h2>
              <p className="text-gray-400">Monitor your earnings and growth</p>
            </div>

            {/* Revenue Sources */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  ${analyticsData.monetization.donations.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Donations</div>
                <div className="text-xs text-green-400 mt-1">+12.5%</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  ${analyticsData.monetization.subscriptions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Subscriptions</div>
                <div className="text-xs text-blue-400 mt-1">+8.3%</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  ${analyticsData.monetization.sponsorships.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Sponsorships</div>
                <div className="text-xs text-purple-400 mt-1">+45.2%</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  ${analyticsData.monetization.merchandise.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Merchandise</div>
                <div className="text-xs text-yellow-400 mt-1">+23.1%</div>
              </Card>
            </div>

            {/* Monetization Tools */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Monetization Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-20 flex-col bg-green-600 hover:bg-green-700">
                  <DollarSign className="w-6 h-6 mb-2" />
                  Set Donation Goals
                </Button>
                <Button className="h-20 flex-col bg-blue-600 hover:bg-blue-700">
                  <Star className="w-6 h-6 mb-2" />
                  Subscription Tiers
                </Button>
                <Button className="h-20 flex-col bg-purple-600 hover:bg-purple-700">
                  <Shield className="w-6 h-6 mb-2" />
                  Brand Partnerships
                </Button>
                <Button className="h-20 flex-col bg-orange-600 hover:bg-orange-700">
                  <Download className="w-6 h-6 mb-2" />
                  Sell Beats/Content
                </Button>
              </div>
            </Card>

            {/* Payout Information */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Payout Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-lg font-bold text-green-400">$2,847.32</div>
                  <div className="text-sm text-gray-400">Available for Payout</div>
                </div>
                <div>
                  <div className="text-lg font-bold">$1,245.67</div>
                  <div className="text-sm text-gray-400">Pending Clearance</div>
                </div>
                <div>
                  <div className="text-lg font-bold">Next: March 15</div>
                  <div className="text-sm text-gray-400">Payout Date</div>
                </div>
              </div>
              
              <Button className="w-full mt-4 bg-green-500 hover:bg-green-600">
                Request Payout
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}