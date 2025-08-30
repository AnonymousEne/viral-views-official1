import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart, Share2, Users, Clock } from 'lucide-react';
import { useState } from 'react';
import { useUpdateTrackPlays, useUpdateTrackLikes } from '@/hooks/useApi';
import { usePlayerStore } from '@/hooks/usePlayerStore';
import { cn } from '@/lib/utils';
import type { Track } from '@shared/schema';

interface TrackCardProps {
  track: Track;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  className?: string;
}

export default function TrackCard({ track, isPlaying = false, onPlayToggle, className }: TrackCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const updatePlays = useUpdateTrackPlays();
  const updateLikes = useUpdateTrackLikes();
  const { currentTrack, isPlaying: globalIsPlaying, setCurrentTrack, play, pause } = usePlayerStore();

  // Check if this track is currently playing in the global player
  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisTrackPlaying = isCurrentTrack && globalIsPlaying;

  const handlePlayToggle = () => {
    if (isCurrentTrack) {
      // If this track is already loaded, just toggle play/pause
      if (globalIsPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      // Load this track into the global player
      setCurrentTrack({
        id: track.id,
        title: track.title,
        artist: track.artistName,
        audioUrl: track.audioUrl || '', // You might need to add audioUrl to your track schema
        coverImage: track.coverImage || undefined
      });
      play();
      updatePlays.mutate(track.id);
    }
    
    // Call the optional onPlayToggle callback for backwards compatibility
    onPlayToggle?.();
  };

  const handleLike = () => {
    updateLikes.mutate(track.id);
    setIsLiked(!isLiked);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-200 bg-dark-200 border-dark-400", className)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Album Art / Cover */}
          <div className="relative">
            {track.coverImage ? (
              <img
                src={track.coverImage}
                alt={track.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-electric-500 flex items-center justify-center">
                <Play className="text-white w-6 h-6" />
              </div>
            )}
            
            {/* Play/Pause Overlay */}
            <Button
              data-testid={`button-play-${track.id}`}
              size="icon"
              variant="ghost"
              className="absolute inset-0 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePlayToggle}
            >
              {isThisTrackPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate" data-testid={`text-title-${track.id}`}>
              {track.title}
            </h3>
            <p className="text-sm text-gray-400 truncate" data-testid={`text-artist-${track.id}`}>
              {track.artistName}
            </p>
            
            {/* Track Metadata */}
            <div className="flex items-center space-x-4 mt-2">
              {track.genre && (
                <Badge variant="secondary" className="text-xs">
                  {track.genre}
                </Badge>
              )}
              {track.bpm && (
                <span className="text-xs text-gray-500">
                  {track.bpm} BPM
                </span>
              )}
              {track.duration && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(track.duration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Track Actions */}
          <div className="flex items-center space-x-2">
            {track.isCollaborative && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Collab
              </Badge>
            )}
            
            {/* Stats */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span data-testid={`text-plays-${track.id}`}>
                {track.plays?.toLocaleString() || 0} plays
              </span>
              <span data-testid={`text-likes-${track.id}`}>
                {track.likes?.toLocaleString() || 0} likes
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                data-testid={`button-like-${track.id}`}
                size="icon"
                variant="ghost"
                className={cn(
                  "text-gray-400 hover:text-red-400",
                  isLiked && "text-red-400"
                )}
                onClick={handleLike}
              >
                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              </Button>
              
              <Button
                data-testid={`button-share-${track.id}`}
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => navigator.share?.({ 
                  title: track.title, 
                  text: `Check out "${track.title}" by ${track.artistName}`,
                  url: window.location.href 
                })}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}