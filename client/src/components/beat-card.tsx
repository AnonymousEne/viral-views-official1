import { type Beat } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, ShoppingCart, Eye } from "lucide-react";

interface BeatCardProps {
  beat: Beat;
  onPlay?: () => void;
  onLike?: () => void;
  onPurchase?: () => void;
  isPlaying?: boolean;
  isPurchasing?: boolean;
}

export default function BeatCard({ 
  beat, 
  onPlay, 
  onLike, 
  onPurchase, 
  isPlaying = false, 
  isPurchasing = false 
}: BeatCardProps) {
  
  const getGenreColor = () => {
    switch (beat.genre?.toLowerCase()) {
      case 'trap': return 'bg-highlight-500';
      case 'boom bap': return 'bg-purple-500';
      case 'drill': return 'bg-electric-500';
      case 'r&b': return 'bg-success-500';
      case 'lo-fi': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  };

  const getLicenseColor = () => {
    switch (beat.licenseType?.toLowerCase()) {
      case 'basic': return 'text-gray-400';
      case 'premium': return 'text-highlight-500';
      case 'exclusive': return 'text-gold-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors group" data-testid={`beat-card-${beat.id}`}>
      <CardContent className="p-0">
        {/* Cover Image / Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-purple-500 to-electric-500 relative overflow-hidden">
          {beat.coverImage ? (
            <img 
              src={beat.coverImage} 
              alt={beat.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-electric-500 flex items-center justify-center">
              <Play className="h-16 w-16 text-white opacity-50" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          
          <div className="absolute top-4 left-4">
            <Badge className={`${getGenreColor()} text-white font-medium`} data-testid={`beat-genre-${beat.id}`}>
              {beat.genre?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-black bg-opacity-60 text-white" data-testid={`beat-bpm-${beat.id}`}>
              {beat.bpm} BPM
            </Badge>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={onPlay}
              className={`w-16 h-16 ${getGenreColor()} bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all ${isPlaying ? 'animate-pulse' : ''}`}
              data-testid={`button-play-beat-${beat.id}`}
            >
              <Play className="text-white text-xl ml-1" />
            </Button>
          </div>
        </div>

        {/* Beat Information */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-white mb-2" data-testid={`beat-title-${beat.id}`}>
            {beat.title}
          </h3>
          <p className="text-gray-400 text-sm mb-3" data-testid={`beat-producer-${beat.id}`}>
            by @{beat.producerName}
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span className="flex items-center" data-testid={`beat-plays-${beat.id}`}>
                <Play className="w-4 h-4 mr-1" />
                {beat.plays?.toLocaleString() || '0'}
              </span>
              <button 
                onClick={onLike}
                className="flex items-center hover:text-red-500 transition-colors"
                data-testid={`button-like-beat-${beat.id}`}
              >
                <Heart className="w-4 h-4 mr-1" />
                {beat.likes?.toLocaleString() || '0'}
              </button>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-success-500" data-testid={`beat-price-${beat.id}`}>
                ${beat.price}
              </div>
              <div className={`text-xs ${getLicenseColor()}`} data-testid={`beat-license-${beat.id}`}>
                {beat.licenseType?.charAt(0).toUpperCase()}{beat.licenseType?.slice(1)} License
              </div>
            </div>
          </div>

          {/* Tags */}
          {beat.tags && beat.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {beat.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="border-dark-400 text-gray-400 text-xs"
                  data-testid={`beat-tag-${beat.id}-${index}`}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button 
              onClick={onPurchase}
              disabled={isPurchasing || !beat.isAvailable}
              className="flex-1 bg-success-500 hover:bg-success-600 text-white font-medium transition-colors disabled:opacity-50"
              data-testid={`button-purchase-beat-${beat.id}`}
            >
              {isPurchasing ? 'Processing...' : beat.isAvailable ? 'Buy License' : 'Sold Out'}
            </Button>
            <Button 
              variant="outline"
              className="bg-dark-300 hover:bg-dark-400 text-gray-300 border-dark-400 px-3 transition-colors"
              data-testid={`button-cart-beat-${beat.id}`}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>

          {/* Purchase count */}
          {beat.purchases && beat.purchases > 0 && (
            <div className="mt-3 text-xs text-gray-400 text-center" data-testid={`beat-purchases-${beat.id}`}>
              {beat.purchases} license{beat.purchases !== 1 ? 's' : ''} sold
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
