import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Heart, 
  ShoppingCart, 
  Download, 
  Share2, 
  Music, 
  DollarSign,
  Clock,
  Zap,
  Filter,
  Search,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/usePlayerStore';

interface Beat {
  id: string;
  title: string;
  producer: string;
  price: number;
  genre: string;
  bpm: number;
  key: string;
  duration: number;
  tags: string[];
  audioUrl: string;
  coverImage?: string;
  plays: number;
  likes: number;
  sales: number;
  featured: boolean;
  exclusive: boolean;
  createdAt: string;
}

const GENRES = [
  'All', 'Hip Hop', 'Trap', 'Drill', 'Boom Bap', 'R&B', 'Pop', 
  'Electronic', 'Lo-fi', 'Jazz', 'Reggae', 'Afrobeat'
];

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'most_played', label: 'Most Played' }
];

// Mock beat data
const mockBeats: Beat[] = [
  {
    id: 'beat-1',
    title: 'Dark Trap Vibes',
    producer: 'BeatMaker Pro',
    price: 49.99,
    genre: 'Trap',
    bpm: 140,
    key: 'Am',
    duration: 180,
    tags: ['dark', 'trap', 'heavy'],
    audioUrl: 'https://example.com/beat1.mp3',
    coverImage: 'https://example.com/beat1.jpg',
    plays: 15420,
    likes: 890,
    sales: 23,
    featured: true,
    exclusive: false,
    createdAt: '2025-08-25T10:00:00Z'
  },
  {
    id: 'beat-2',
    title: 'Smooth R&B Flow',
    producer: 'SoulBeats',
    price: 35.00,
    genre: 'R&B',
    bpm: 85,
    key: 'C',
    duration: 195,
    tags: ['smooth', 'rnb', 'chill'],
    audioUrl: 'https://example.com/beat2.mp3',
    plays: 8920,
    likes: 445,
    sales: 12,
    featured: false,
    exclusive: true,
    createdAt: '2025-08-24T15:30:00Z'
  },
  {
    id: 'beat-3',
    title: 'Drill Energy',
    producer: 'DrillKing',
    price: 75.00,
    genre: 'Drill',
    bpm: 155,
    key: 'Dm',
    duration: 165,
    tags: ['drill', 'aggressive', 'uk'],
    audioUrl: 'https://example.com/beat3.mp3',
    plays: 12300,
    likes: 672,
    sales: 31,
    featured: true,
    exclusive: true,
    createdAt: '2025-08-23T09:15:00Z'
  }
];

interface BeatCardProps {
  beat: Beat;
  onPurchase: (beatId: string) => void;
  onLike: (beatId: string) => void;
}

function BeatCard({ beat, onPurchase, onLike }: BeatCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { currentTrack, isPlaying: globalIsPlaying, setCurrentTrack, play, pause } = usePlayerStore();
  
  const isCurrentTrack = currentTrack?.id === beat.id;
  const isPlaying = isCurrentTrack && globalIsPlaying;

  const handlePlayToggle = () => {
    if (isCurrentTrack) {
      if (globalIsPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      setCurrentTrack({
        id: beat.id,
        title: beat.title,
        artist: beat.producer,
        audioUrl: beat.audioUrl,
        coverImage: beat.coverImage
      });
      play();
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(beat.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 bg-dark-200 border-dark-400 overflow-hidden">
      <div className="relative">
        {/* Cover Art */}
        <div className="aspect-square relative overflow-hidden">
          {beat.coverImage ? (
            <img
              src={beat.coverImage}
              alt={beat.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-electric-500 flex items-center justify-center">
              <Music className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={handlePlayToggle}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {beat.featured && (
              <Badge className="bg-electric-500 hover:bg-electric-600 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {beat.exclusive && (
              <Badge className="bg-gold-500 hover:bg-gold-600 text-black">
                <Zap className="w-3 h-3 mr-1" />
                Exclusive
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white"
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-red-500 text-red-500")} />
            </Button>
          </div>
        </div>

        {/* Beat Info */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Title and Producer */}
            <div>
              <h3 className="font-semibold text-white truncate">{beat.title}</h3>
              <p className="text-sm text-gray-400 truncate">by {beat.producer}</p>
            </div>

            {/* Beat Details */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span>{beat.bpm} BPM</span>
                <span>{beat.key}</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(beat.duration)}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {beat.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>{formatNumber(beat.plays)} plays</span>
                <span>{formatNumber(beat.likes)} likes</span>
                <span>{beat.sales} sales</span>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-lg font-bold text-white">${beat.price}</span>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <Share2 className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  className="bg-electric-500 hover:bg-electric-600 flex items-center space-x-1"
                  onClick={() => onPurchase(beat.id)}
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>Buy</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function EnhancedBeatMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Filter and sort beats
  const filteredBeats = mockBeats
    .filter((beat) => {
      const matchesSearch = 
        beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beat.producer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGenre = selectedGenre === 'All' || beat.genre === selectedGenre;
      const matchesPrice = beat.price >= priceRange[0] && beat.price <= priceRange[1];
      
      return matchesSearch && matchesGenre && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'most_liked':
          return b.likes - a.likes;
        case 'most_played':
          return b.plays - a.plays;
        case 'trending':
        default:
          return (b.plays * 0.4 + b.likes * 0.3 + b.sales * 0.3) - 
                 (a.plays * 0.4 + a.likes * 0.3 + a.sales * 0.3);
      }
    });

  const handlePurchase = (beatId: string) => {
    console.log('Purchasing beat:', beatId);
    // Implement purchase logic
  };

  const handleLike = (beatId: string) => {
    console.log('Liked beat:', beatId);
    // Implement like logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Beat Marketplace</h1>
        <p className="text-gray-400 text-lg">Discover premium beats from top producers</p>
      </div>

      {/* Filters */}
      <Card className="bg-dark-200 border-dark-400">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search beats, producers, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-dark-300 border-dark-400"
              />
            </div>

            {/* Genre Filter */}
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="bg-dark-300 border-dark-400">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-dark-300 border-dark-400">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Button */}
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Found {filteredBeats.length} beat{filteredBeats.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className="flex items-center space-x-1">
            <Download className="w-3 h-3" />
            <span>Download All</span>
          </Button>
        </div>
      </div>

      {/* Beat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBeats.map((beat) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            onPurchase={handlePurchase}
            onLike={handleLike}
          />
        ))}
      </div>

      {filteredBeats.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No beats found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
