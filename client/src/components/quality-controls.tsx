import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, Monitor, Wifi, Zap, Activity, 
  HardDrive, Clock, Gauge, Volume2 
} from "lucide-react";

interface QualitySettings {
  video: {
    resolution: string;
    frameRate: number;
    bitrate: number;
    codec: string;
  };
  audio: {
    sampleRate: number;
    bitrate: number;
    channels: number;
    codec: string;
  };
  streaming: {
    adaptiveBitrate: boolean;
    lowLatencyMode: boolean;
    bufferSize: number;
    keyFrameInterval: number;
  };
  performance: {
    hardwareAcceleration: boolean;
    multiThreading: boolean;
    cpuUsageLimit: number;
    memoryUsageLimit: number;
  };
}

interface QualityControlsProps {
  settings?: Partial<QualitySettings>;
  onSettingsChange?: (settings: QualitySettings) => void;
  presets?: Array<{ name: string; settings: QualitySettings }>;
  showAdvanced?: boolean;
  currentBitrate?: number;
  currentFPS?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  networkLatency?: number;
}

export default function QualityControls({
  settings,
  onSettingsChange,
  presets = [],
  showAdvanced = false,
  currentBitrate = 0,
  currentFPS = 0,
  cpuUsage = 0,
  memoryUsage = 0,
  networkLatency = 0
}: QualityControlsProps) {
  const [currentSettings, setCurrentSettings] = useState<QualitySettings>({
    video: {
      resolution: '1280x720',
      frameRate: 30,
      bitrate: 2500,
      codec: 'h264'
    },
    audio: {
      sampleRate: 44100,
      bitrate: 128,
      channels: 2,
      codec: 'aac'
    },
    streaming: {
      adaptiveBitrate: true,
      lowLatencyMode: true,
      bufferSize: 1024,
      keyFrameInterval: 2
    },
    performance: {
      hardwareAcceleration: true,
      multiThreading: true,
      cpuUsageLimit: 80,
      memoryUsageLimit: 75
    },
    ...settings
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);

  // Quality presets
  // Mobile-first presets with better data usage
  const defaultPresets = [
    {
      name: 'Mobile Data Saver',
      settings: {
        video: { resolution: '480x360', frameRate: 15, bitrate: 300, codec: 'h264' },
        audio: { sampleRate: 22050, bitrate: 32, channels: 1, codec: 'aac' },
        streaming: { adaptiveBitrate: true, lowLatencyMode: true, bufferSize: 128, keyFrameInterval: 4 },
        performance: { hardwareAcceleration: false, multiThreading: false, cpuUsageLimit: 40, memoryUsageLimit: 30 }
      }
    },
    {
      name: 'Mobile Standard',
      settings: {
        video: { resolution: '640x480', frameRate: 20, bitrate: 600, codec: 'h264' },
        audio: { sampleRate: 22050, bitrate: 64, channels: 1, codec: 'aac' },
        streaming: { adaptiveBitrate: true, lowLatencyMode: true, bufferSize: 256, keyFrameInterval: 3 },
        performance: { hardwareAcceleration: true, multiThreading: false, cpuUsageLimit: 50, memoryUsageLimit: 40 }
      }
    },
    {
      name: 'Mobile WiFi',
      settings: {
        video: { resolution: '854x480', frameRate: 24, bitrate: 1000, codec: 'h264' },
        audio: { sampleRate: 44100, bitrate: 96, channels: 2, codec: 'aac' },
        streaming: { adaptiveBitrate: true, lowLatencyMode: true, bufferSize: 512, keyFrameInterval: 2 },
        performance: { hardwareAcceleration: true, multiThreading: true, cpuUsageLimit: 60, memoryUsageLimit: 50 }
      }
    },
    {
      name: 'Desktop High',
      settings: {
        video: { resolution: '1280x720', frameRate: 30, bitrate: 2500, codec: 'h264' },
        audio: { sampleRate: 44100, bitrate: 128, channels: 2, codec: 'aac' },
        streaming: { adaptiveBitrate: true, lowLatencyMode: true, bufferSize: 1024, keyFrameInterval: 2 },
        performance: { hardwareAcceleration: true, multiThreading: true, cpuUsageLimit: 70, memoryUsageLimit: 65 }
      }
    },
    {
      name: 'Desktop Ultra',
      settings: {
        video: { resolution: '1920x1080', frameRate: 60, bitrate: 5000, codec: 'h264' },
        audio: { sampleRate: 48000, bitrate: 192, channels: 2, codec: 'aac' },
        streaming: { adaptiveBitrate: true, lowLatencyMode: false, bufferSize: 2048, keyFrameInterval: 2 },
        performance: { hardwareAcceleration: true, multiThreading: true, cpuUsageLimit: 85, memoryUsageLimit: 80 }
      }
    }
  ];

  const allPresets = [...defaultPresets, ...presets];

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<QualitySettings>) => {
    const updated = {
      ...currentSettings,
      ...newSettings,
      video: { ...currentSettings.video, ...newSettings.video },
      audio: { ...currentSettings.audio, ...newSettings.audio },
      streaming: { ...currentSettings.streaming, ...newSettings.streaming },
      performance: { ...currentSettings.performance, ...newSettings.performance }
    };
    
    setCurrentSettings(updated);
    onSettingsChange?.(updated);
  }, [currentSettings, onSettingsChange]);

  // Apply preset
  const applyPreset = useCallback((presetName: string) => {
    const preset = allPresets.find(p => p.name === presetName);
    if (preset) {
      setCurrentSettings(preset.settings);
      onSettingsChange?.(preset.settings);
    }
    setSelectedPreset(presetName);
  }, [allPresets, onSettingsChange]);

  // Get quality status
  const getQualityStatus = () => {
    const totalBitrate = currentSettings.video.bitrate + currentSettings.audio.bitrate;
    
    if (totalBitrate >= 6000) return { label: 'Ultra', color: 'bg-purple-500' };
    if (totalBitrate >= 3000) return { label: 'High', color: 'bg-green-500' };
    if (totalBitrate >= 1500) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-red-500' };
  };

  const qualityStatus = getQualityStatus();

  return (
    <Card className="bg-dark-200 border-dark-400 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Quality Controls</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${qualityStatus.color} text-white`}>
              {qualityStatus.label} Quality
            </Badge>
            {showPerformanceMetrics && (
              <Button
                onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                variant="outline"
                size="sm"
                className="border-dark-400 text-white"
                data-testid="toggle-metrics"
              >
                <Activity className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {showPerformanceMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Gauge className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Bitrate</span>
              </div>
              <div className="text-sm font-medium text-white">{currentBitrate}kbps</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Monitor className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">FPS</span>
              </div>
              <div className="text-sm font-medium text-white">{currentFPS}</div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">CPU</span>
              </div>
              <div className={`text-sm font-medium ${
                cpuUsage > 80 ? 'text-red-500' : cpuUsage > 60 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {cpuUsage}%
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Latency</span>
              </div>
              <div className={`text-sm font-medium ${
                networkLatency > 100 ? 'text-red-500' : networkLatency > 50 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {networkLatency}ms
              </div>
            </div>
          </div>
        )}

        {/* Preset Selection */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Quality Preset</label>
          <Select value={selectedPreset} onValueChange={applyPreset}>
            <SelectTrigger className="bg-dark-300 border-dark-400 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-dark-300 border-dark-400">
              <SelectItem value="custom">Custom</SelectItem>
              {allPresets.map((preset) => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Video Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center">
            <Monitor className="w-4 h-4 mr-2" />
            Video Settings
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Resolution</label>
              <Select 
                value={currentSettings.video.resolution} 
                onValueChange={(value) => updateSettings({ video: { ...currentSettings.video, resolution: value } })}
              >
                <SelectTrigger className="bg-dark-300 border-dark-400 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-300 border-dark-400">
                  <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                  <SelectItem value="1920x1080">1080p (1920x1080)</SelectItem>
                  <SelectItem value="1280x720">720p (1280x720)</SelectItem>
                  <SelectItem value="854x480">480p (854x480)</SelectItem>
                  <SelectItem value="640x360">360p (640x360)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Frame Rate</label>
              <Select 
                value={currentSettings.video.frameRate.toString()} 
                onValueChange={(value) => updateSettings({ video: { ...currentSettings.video, frameRate: parseInt(value) } })}
              >
                <SelectTrigger className="bg-dark-300 border-dark-400 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-300 border-dark-400">
                  <SelectItem value="15">15 FPS</SelectItem>
                  <SelectItem value="24">24 FPS</SelectItem>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                  <SelectItem value="120">120 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Video Bitrate</label>
              <span className="text-xs text-white">{currentSettings.video.bitrate} kbps</span>
            </div>
            <Slider
              value={[currentSettings.video.bitrate]}
              onValueChange={(value) => updateSettings({ video: { ...currentSettings.video, bitrate: value[0] } })}
              min={100}
              max={10000}
              step={100}
              className="w-full"
              data-testid="video-bitrate-slider"
            />
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center">
            <Volume2 className="w-4 h-4 mr-2" />
            Audio Settings
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Sample Rate</label>
              <Select 
                value={currentSettings.audio.sampleRate.toString()} 
                onValueChange={(value) => updateSettings({ audio: { ...currentSettings.audio, sampleRate: parseInt(value) } })}
              >
                <SelectTrigger className="bg-dark-300 border-dark-400 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-300 border-dark-400">
                  <SelectItem value="22050">22.05 kHz</SelectItem>
                  <SelectItem value="44100">44.1 kHz</SelectItem>
                  <SelectItem value="48000">48 kHz</SelectItem>
                  <SelectItem value="96000">96 kHz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400">Channels</label>
              <Select 
                value={currentSettings.audio.channels.toString()} 
                onValueChange={(value) => updateSettings({ audio: { ...currentSettings.audio, channels: parseInt(value) } })}
              >
                <SelectTrigger className="bg-dark-300 border-dark-400 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-300 border-dark-400">
                  <SelectItem value="1">Mono</SelectItem>
                  <SelectItem value="2">Stereo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Audio Bitrate</label>
              <span className="text-xs text-white">{currentSettings.audio.bitrate} kbps</span>
            </div>
            <Slider
              value={[currentSettings.audio.bitrate]}
              onValueChange={(value) => updateSettings({ audio: { ...currentSettings.audio, bitrate: value[0] } })}
              min={32}
              max={320}
              step={8}
              className="w-full"
              data-testid="audio-bitrate-slider"
            />
          </div>
        </div>

        {/* Streaming Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center">
            <Wifi className="w-4 h-4 mr-2" />
            Streaming Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Adaptive Bitrate</span>
                <p className="text-xs text-gray-400">Automatically adjust quality based on connection</p>
              </div>
              <Switch
                checked={currentSettings.streaming.adaptiveBitrate}
                onCheckedChange={(checked) => updateSettings({ streaming: { ...currentSettings.streaming, adaptiveBitrate: checked } })}
                data-testid="adaptive-bitrate-switch"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-white">Low Latency Mode</span>
                <p className="text-xs text-gray-400">Reduce delay for real-time interaction</p>
              </div>
              <Switch
                checked={currentSettings.streaming.lowLatencyMode}
                onCheckedChange={(checked) => updateSettings({ streaming: { ...currentSettings.streaming, lowLatencyMode: checked } })}
                data-testid="low-latency-switch"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Buffer Size</label>
              <span className="text-xs text-white">{currentSettings.streaming.bufferSize} KB</span>
            </div>
            <Slider
              value={[currentSettings.streaming.bufferSize]}
              onValueChange={(value) => updateSettings({ streaming: { ...currentSettings.streaming, bufferSize: value[0] } })}
              min={256}
              max={4096}
              step={256}
              className="w-full"
              data-testid="buffer-size-slider"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              Performance Settings
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-white">Hardware Acceleration</span>
                  <p className="text-xs text-gray-400">Use GPU for encoding when available</p>
                </div>
                <Switch
                  checked={currentSettings.performance.hardwareAcceleration}
                  onCheckedChange={(checked) => updateSettings({ performance: { ...currentSettings.performance, hardwareAcceleration: checked } })}
                  data-testid="hardware-acceleration-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-white">Multi-threading</span>
                  <p className="text-xs text-gray-400">Use multiple CPU cores for processing</p>
                </div>
                <Switch
                  checked={currentSettings.performance.multiThreading}
                  onCheckedChange={(checked) => updateSettings({ performance: { ...currentSettings.performance, multiThreading: checked } })}
                  data-testid="multi-threading-switch"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">CPU Usage Limit</label>
                <span className="text-xs text-white">{currentSettings.performance.cpuUsageLimit}%</span>
              </div>
              <Slider
                value={[currentSettings.performance.cpuUsageLimit]}
                onValueChange={(value) => updateSettings({ performance: { ...currentSettings.performance, cpuUsageLimit: value[0] } })}
                min={30}
                max={100}
                step={5}
                className="w-full"
                data-testid="cpu-limit-slider"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}