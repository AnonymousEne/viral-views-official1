import { useState } from "react";
import { type Track } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Eye, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VideoCardProps {
  track: Track;
}

export default function VideoCard({ track }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const queryClient = useQueryClient();

  const playMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/tracks/${track.id}/play`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/tracks/${track.id}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
    },
  });

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      playMutation.mutate();
    }
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  const getBadgeInfo = () => {
    if (track.isCollaborative) {
      return { label: "COLLAB", color: "bg-success-500" };
    }
    if (track.genre) {
      return { label: track.genre.toUpperCase(), color: "bg-purple-500" };
    }
    return { label: "TRACK", color: "bg-electric-500" };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="bg-dark-300 rounded-xl overflow-hidden hover:bg-dark-400 transition-colors group cursor-pointer" data-testid={`video-card-${track.id}`}>
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-purple-500 to-electric-500 relative overflow-hidden">
        {track.coverImage ? (
          <img 
            src={track.coverImage} 
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-electric-500 flex items-center justify-center">
            <Play className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-all"></div>
        
        <div className="absolute top-4 left-4">
          <Badge className={`${badgeInfo.color} text-white`} data-testid={`track-badge-${track.id}`}>
            {badgeInfo.label}
          </Badge>
        </div>
        
        {track.duration && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="secondary" className="bg-black bg-opacity-60 text-white" data-testid={`track-duration-${track.id}`}>
              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </Badge>
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={handlePlay}
            className={`w-16 h-16 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-white bg-opacity-20 hover:bg-opacity-30'} rounded-full flex items-center justify-center transition-all`}
            data-testid={`button-play-${track.id}`}
          >
            <Play className={`text-white text-xl ${isPlaying ? '' : 'ml-1'}`} />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-white" data-testid={`track-title-${track.id}`}>
          {track.title}
        </h3>
        <p className="text-gray-400 text-sm mb-3" data-testid={`track-artist-${track.id}`}>
          @{track.artistName}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            <span className="flex items-center" data-testid={`track-views-${track.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              {track.plays?.toLocaleString() || '0'}
            </span>
            <button 
              onClick={handleLike}
              className="flex items-center hover:text-red-500 transition-colors"
              data-testid={`button-like-${track.id}`}
            >
              <Heart className="w-4 h-4 mr-1" />
              {track.likes?.toLocaleString() || '0'}
            </button>
          </div>
          
          {track.isCollaborative && (
            <div className="flex items-center text-success-500 text-sm font-medium">
              <Users className="w-4 h-4 mr-1" />
              <span data-testid={`track-collaborators-${track.id}`}>
                {track.collaborators?.length || 0} collabs
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
