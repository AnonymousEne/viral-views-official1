import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayerStore } from '@/hooks/usePlayerStore';
import { cn } from '@/lib/utils';

export default function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    play,
    pause,
    next,
    previous,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat
  } = usePlayerStore();

  // Handle audio element sync with store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        next();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, next, setCurrentTime, setDuration]);

  // Sync play/pause with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync volume with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Load new track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audioUrl;
    audio.load();
    
    if (isPlaying) {
      audio.play();
    }
  }, [currentTrack, isPlaying]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-100 border-t border-dark-400">
      <audio ref={audioRef} />
      
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Track Info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {currentTrack.coverImage ? (
                <img
                  src={currentTrack.coverImage}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-electric-500 flex items-center justify-center">
                  <Play className="text-white w-4 h-4" />
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-white truncate text-sm">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center space-y-2 flex-2">
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleShuffle}
                  className={cn(
                    "text-gray-400 hover:text-white w-8 h-8",
                    isShuffled && "text-electric-400"
                  )}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={previous}
                  className="text-gray-400 hover:text-white w-8 h-8"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={isPlaying ? pause : play}
                  className="text-white hover:text-electric-400 w-10 h-10 bg-white/10 hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={next}
                  className="text-gray-400 hover:text-white w-8 h-8"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleRepeat}
                  className={cn(
                    "text-gray-400 hover:text-white w-8 h-8",
                    repeatMode !== 'none' && "text-electric-400"
                  )}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-4 h-4" />
                  ) : (
                    <Repeat className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center space-x-2 w-full max-w-md">
                <span className="text-xs text-gray-400 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="text-gray-400 hover:text-white w-8 h-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
