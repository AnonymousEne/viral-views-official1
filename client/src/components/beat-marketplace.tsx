import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Download, Heart, Share, 
  Music, Headphones, Star, Crown, Flame,
  ShoppingCart, DollarSign, Filter, Search,
  Volume2, VolumeX, SkipForward, SkipBack,
  Repeat, Shuffle, TrendingUp, Clock
} from "lucide-react";

interface Beat {
  id: string;
  name: string;
  producer: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    followerCount: number;
  };
  bpm: number;
  genre: string;
  mood: string;
  key: string;
  duration: number;
  price: number;
  originalPrice?: number;
  preview: string;
  artwork: string;
  tags: string[];
  likes: number;
  downloads: number;
  isLiked: boolean;
  isPlaying: boolean;
  isTrending: boolean;
  isExclusive: boolean;
  license: 'free' | 'basic' | 'premium' | 'exclusive';
  createdAt: Date;
}

interface BeatMarketplaceProps {
  onBeatSelect?: (beat: Beat) => void;
  onBeatPurchase?: (beatId: string, license: string) => void;
  onBeatLike?: (beatId: string) => void;
  onBeatPlay?: (beatId: string) => void;
  onProducerFollow?: (producerId: string) => void;
  className?: string;
}

export default function BeatMarketplace({
  onBeatSelect,
  onBeatPurchase,
  onBeatLike,
  onBeatPlay,
  onProducerFollow,
  className = ""
}: BeatMarketplaceProps) {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState<Beat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock beat data
  const generateMockBeats = useCallback((): Beat[] => {
    const genres = ['Trap', 'Drill', 'R&B', 'Hip-Hop', 'Pop', 'Afrobeats', 'Lo-Fi'];
    const moods = ['Dark', 'Energetic', 'Chill', 'Aggressive', 'Melodic', 'Bouncy', 'Atmospheric'];
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: `beat-${i}`,
      name: `Beat ${i + 1} ${['Fire', 'Vibes', 'Dreams', 'Mode', 'Wave', 'Flow'][i % 6]}`,
      producer: {
        id: `producer-${i % 10}`,
        username: ['BeatMaster', 'TrapLord', 'MelodyKing', 'RhythmQueen', 'SoundWave', 'BeatBox', 'ProducerX', 'WaveKing', 'BeatSmith', 'SoundCraft'][i % 10],
        avatar: ['🎹', '🎵', '🎧', '🔥', '⚡', '👑', '🌟', '💫', '🎤', '🎛️'][i % 10],
        isVerified: Math.random() > 0.6,
        followerCount: Math.floor(Math.random() * 50000) + 1000
      },
      bpm: 60 + Math.floor(Math.random() * 120),
      genre: genres[Math.floor(Math.random() * genres.length)],
      mood: moods[Math.floor(Math.random() * moods.length)],
      key: keys[Math.floor(Math.random() * keys.length)],
      duration: 120 + Math.floor(Math.random() * 180), // 2-5 minutes
      price: Math.random() > 0.3 ? Math.floor(Math.random() * 50) + 5 : 0,
      originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 20 : undefined,
      preview: `/api/beat-preview/${i}`,
      artwork: `/api/placeholder/300/300?text=Beat${i}`,
      tags: ['type beat', 'hard', 'melody', 'drums'].slice(0, Math.floor(Math.random() * 3) + 1),
      likes: Math.floor(Math.random() * 5000),
      downloads: Math.floor(Math.random() * 2000),
      isLiked: Math.random() > 0.8,
      isPlaying: false,
      isTrending: Math.random() > 0.7,
      isExclusive: Math.random() > 0.9,
      license: ['free', 'basic', 'premium', 'exclusive'][Math.floor(Math.random() * 4)] as Beat['license'],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));
  }, []);

  // Initialize beats
  useEffect(() => {
    const mockBeats = generateMockBeats();
    setBeats(mockBeats);
  }, [generateMockBeats]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (currentIndex < beats.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    },
    onSwipedDown: () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    },
    trackMouse: true
  });

  const currentBeat = beats[currentIndex];

  // Audio controls
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      onBeatPlay?.(currentBeat.id);
    }
  }, [isPlaying, currentBeat?.id, onBeatPlay]);

  const handleLike = useCallback(() => {
    if (!currentBeat) return;
    
    setBeats(prev => prev.map(beat => 
      beat.id === currentBeat.id 
        ? { 
            ...beat, 
            isLiked: !beat.isLiked,
            likes: beat.isLiked ? beat.likes - 1 : beat.likes + 1
          }
        : beat
    ));
    
    onBeatLike?.(currentBeat.id);
  }, [currentBeat, onBeatLike]);

  const handlePurchase = useCallback((license: string) => {
    if (!currentBeat) return;
    onBeatPurchase?.(currentBeat.id, license);
    setShowLicenseModal(null);
  }, [currentBeat, onBeatPurchase]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // License options
  const licenseOptions = [
    { 
      type: 'free', 
      name: 'Free Download', 
      price: 0, 
      features: ['MP3 Download', 'Non-commercial use', 'Producer tag included'] 
    },
    { 
      type: 'basic', 
      name: 'Basic License', 
      price: 25, 
      features: ['WAV + MP3', 'Commercial use', 'No producer tag', 'Up to 5K sales'] 
    },
    { 
      type: 'premium', 
      name: 'Premium License', 
      price: 75, 
      features: ['WAV + MP3 + Stems', 'Unlimited sales', 'Commercial use', 'Radio/TV rights'] 
    },
    { 
      type: 'exclusive', 
      name: 'Exclusive Rights', 
      price: 500, 
      features: ['Full ownership', 'All file formats', 'Producer credit removal', 'Resale rights'] 
    }
  ];

  if (!currentBeat) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading beats...</div>
      </div>
    );
  }

  return (
    <div 
      className={`h-screen w-full bg-black relative overflow-hidden ${className}`}
      {...handlers}
      ref={containerRef}
    >
      {/* Background artwork */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${currentBeat.artwork})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Badge className="bg-purple-500 text-white px-3 py-1">
              🎵 BEAT STORE
            </Badge>
            {currentBeat.isTrending && (
              <Badge className="bg-red-500 text-white px-2 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {currentBeat.isExclusive && (
              <Badge className="bg-yellow-500 text-black px-2 py-1">
                <Crown className="w-3 h-3 mr-1" />
                Exclusive
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="text-white"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {/* Beat artwork */}
        <motion.div
          key={currentBeat.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8"
        >
          <div className="w-64 h-64 rounded-xl overflow-hidden shadow-2xl">
            <img 
              src={currentBeat.artwork} 
              alt={currentBeat.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Play button overlay */}
          <Button
            onClick={togglePlay}
            size="icon"
            className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </Button>
        </motion.div>

        {/* Beat info */}
        <div className="text-center space-y-4 max-w-sm">
          <div>
            <h2 className="text-2xl font-bold mb-2">{currentBeat.name}</h2>
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <span>by</span>
              <span className="font-semibold">{currentBeat.producer.username}</span>
              {currentBeat.producer.isVerified && <Crown className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>

          {/* Beat details */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="text-center">
              <div className="font-semibold text-white">{currentBeat.bpm}</div>
              <div>BPM</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">{currentBeat.key}</div>
              <div>Key</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">{currentBeat.genre}</div>
              <div>Genre</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">{formatDuration(currentBeat.duration)}</div>
              <div>Length</div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {currentBeat.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Price */}
          <div className="text-center">
            {currentBeat.price === 0 ? (
              <div className="text-2xl font-bold text-green-400">FREE</div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  ${currentBeat.price}
                  {currentBeat.originalPrice && (
                    <span className="text-lg text-gray-400 line-through ml-2">
                      ${currentBeat.originalPrice}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">Starting price</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={currentBeat.preview}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 space-y-4">
        {/* Audio controls */}
        <div className="flex items-center justify-center space-x-4 text-white">
          <Button variant="ghost" size="icon" className="text-white">
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button onClick={togglePlay} size="icon" className="bg-white text-black hover:bg-gray-200">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="text-white">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={handleLike}
              variant="ghost"
              size="icon"
              className={`text-white ${currentBeat.isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`w-5 h-5 ${currentBeat.isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-white">
              <Share className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <VolumeX className="w-4 h-4 text-gray-400" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-20"
              />
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <Button
            onClick={() => setShowLicenseModal(currentBeat)}
            className="bg-purple-500 hover:bg-purple-600"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {currentBeat.price === 0 ? 'Download' : 'Buy Now'}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{currentBeat.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Download className="w-4 h-4" />
            <span>{currentBeat.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{Math.floor((Date.now() - currentBeat.createdAt.getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
          </div>
        </div>
      </div>

      {/* Navigation hints */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/50 text-xs">
        ↓ Next
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/50 text-xs">
        ↑ Previous
      </div>

      {/* License modal */}
      <AnimatePresence>
        {showLicenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLicenseModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-200 rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto"
            >
              <div className="text-white">
                <h3 className="text-xl font-bold mb-4">Choose License</h3>
                
                <div className="space-y-3">
                  {licenseOptions.map((option) => (
                    <Button
                      key={option.type}
                      onClick={() => handlePurchase(option.type)}
                      variant="outline"
                      className="w-full p-4 h-auto border-gray-600 hover:border-purple-500 text-left"
                    >
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <div className="font-semibold">{option.name}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {option.features.join(' • ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {option.price === 0 ? 'FREE' : `$${option.price}`}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}