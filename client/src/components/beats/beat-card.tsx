import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart, ShoppingCart, Download, DollarSign, Clock } from 'lucide-react';
import { useState } from 'react';
import { useUpdateBeatPlays, useUpdateBeatLikes, usePurchaseBeat } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Beat } from '@shared/schema';

interface BeatCardProps {
  beat: Beat;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  className?: string;
}

export default function BeatCard({ beat, isPlaying = false, onPlayToggle, className }: BeatCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const updatePlays = useUpdateBeatPlays();
  const updateLikes = useUpdateBeatLikes();
  const purchaseBeat = usePurchaseBeat();

  const handlePlayToggle = () => {
    if (!isPlaying && onPlayToggle) {
      updatePlays.mutate(beat.id);
    }
    onPlayToggle?.();
  };

  const handleLike = () => {
    updateLikes.mutate(beat.id);
    setIsLiked(!isLiked);
  };

  const handlePurchase = () => {
    purchaseBeat.mutate(beat.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLicenseColor = (licenseType: string) => {
    switch (licenseType) {
      case 'exclusive':
        return 'bg-gold-500';
      case 'premium':
        return 'bg-purple-500';
      case 'basic':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-200 bg-dark-200 border-dark-400", className)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Beat Artwork */}
          <div className="relative">
            {beat.coverImage ? (
              <img
                src={beat.coverImage}
                alt={beat.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold-400 to-electric-500 flex items-center justify-center">
                <Play className="text-white w-6 h-6" />
              </div>
            )}
            
            {/* Play/Pause Overlay */}
            <Button
              data-testid={`button-play-${beat.id}`}
              size="icon"
              variant="ghost"
              className="absolute inset-0 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePlayToggle}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Beat Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate" data-testid={`text-beat-title-${beat.id}`}>
              {beat.title}
            </h3>
            <p className="text-sm text-gray-400 truncate" data-testid={`text-producer-${beat.id}`}>
              by {beat.producerName}
            </p>
            
            {/* Beat Metadata */}
            <div className="flex items-center space-x-4 mt-2">
              {beat.genre && (
                <Badge variant="secondary" className="text-xs">
                  {beat.genre}
                </Badge>
              )}
              {beat.bpm && (
                <span className="text-xs text-gray-500">
                  {beat.bpm} BPM
                </span>
              )}
            </div>
          </div>

          {/* Price & License */}
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-lg font-bold text-green-400" data-testid={`text-price-${beat.id}`}>
                ${beat.price}
              </span>
            </div>
            
            <Badge className={cn("text-xs", getLicenseColor(beat.licenseType))}>
              {beat.licenseType.toUpperCase()}
            </Badge>
          </div>

          {/* Beat Actions */}
          <div className="flex flex-col space-y-2">
            {/* Stats */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span data-testid={`text-plays-${beat.id}`}>
                {beat.plays?.toLocaleString() || 0} plays
              </span>
              <span data-testid={`text-likes-${beat.id}`}>
                {beat.likes?.toLocaleString() || 0} likes
              </span>
              <span data-testid={`text-purchases-${beat.id}`}>
                {beat.purchases?.toLocaleString() || 0} sales
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <Button
                data-testid={`button-like-${beat.id}`}
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
              
              {user && user.id !== beat.producerId && (
                <Button
                  data-testid={`button-purchase-${beat.id}`}
                  size="sm"
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handlePurchase}
                  disabled={purchaseBeat.isPending}
                >
                  {purchaseBeat.isPending ? (
                    <Download className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-3 h-3 mr-1" />
                  )}
                  Buy
                </Button>
              )}
              
              {user && user.id === beat.producerId && (
                <Badge variant="outline" className="text-xs">
                  Your Beat
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}