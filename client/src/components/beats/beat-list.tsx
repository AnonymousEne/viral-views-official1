import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Music4, TrendingUp, DollarSign } from 'lucide-react';
import { useBeats } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import BeatCard from './beat-card';
import CreateBeatDialog from './create-beat-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import type { Beat } from '@shared/schema';

const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Country', 'Reggae'];
const LICENSE_TYPES = ['basic', 'premium', 'exclusive'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export default function BeatList() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [playingBeat, setPlayingBeat] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: beats, isLoading, error } = useBeats(selectedGenre || undefined);
  
  const filteredAndSortedBeats = beats?.filter((beat: Beat) => {
    const matchesSearch = beat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         beat.producerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !selectedGenre || beat.genre === selectedGenre;
    const matchesLicense = !selectedLicense || beat.licenseType === selectedLicense;
    const beatPrice = parseFloat(beat.price as string) || 0;
    const matchesPrice = beatPrice >= priceRange.min && beatPrice <= priceRange.max;
    
    return matchesSearch && matchesGenre && matchesLicense && matchesPrice;
  })?.sort((a: Beat, b: Beat) => {
    switch (sortBy) {
      case 'popular':
        return (b.plays || 0) - (a.plays || 0);
      case 'price_low':
        return (parseFloat(a.price as string) || 0) - (parseFloat(b.price as string) || 0);
      case 'price_high':
        return (parseFloat(b.price as string) || 0) - (parseFloat(a.price as string) || 0);
      case 'newest':
      default:
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    }
  });

  const handlePlayToggle = (beatId: string) => {
    setPlayingBeat(playingBeat === beatId ? null : beatId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load beats. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Music4 className="w-6 h-6 text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Beat Marketplace</h1>
          <Badge variant="secondary">{beats?.length || 0}</Badge>
        </div>
        
        {user && user.role === 'producer' && (
          <Button
            data-testid="button-list-beat"
            onClick={() => setShowCreateDialog(true)}
            className="bg-gold-500 hover:bg-gold-600 text-black font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            List Beat
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              data-testid="input-search-beats"
              placeholder="Search beats or producers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-200 border-dark-400 text-white"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-dark-200 border border-dark-400 rounded-md text-white text-sm"
            data-testid="select-sort-beats"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-4">
          {/* Genre Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Button
              data-testid="filter-all-genres"
              variant={!selectedGenre ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGenre('')}
              className="text-xs"
            >
              All Genres
            </Button>
            {GENRES.map((genre) => (
              <Button
                key={genre}
                data-testid={`filter-genre-${genre.toLowerCase().replace(' ', '-')}`}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
                className="text-xs"
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* License and Price Filter */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">License:</span>
            {LICENSE_TYPES.map((license) => (
              <Button
                key={license}
                data-testid={`filter-license-${license}`}
                variant={selectedLicense === license ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLicense(selectedLicense === license ? '' : license)}
                className="text-xs"
              >
                {license.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Price Range:</span>
            <Input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="w-20 bg-dark-200 border-dark-400 text-white text-xs"
              data-testid="input-price-min"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="w-20 bg-dark-200 border-dark-400 text-white text-xs"
              data-testid="input-price-max"
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg border border-dark-400">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">
              {filteredAndSortedBeats?.length || 0} beats found
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gold-400" />
            <span className="text-sm text-gray-300">
              Avg: ${filteredAndSortedBeats && filteredAndSortedBeats.length > 0 ? (filteredAndSortedBeats.reduce((sum, beat) => sum + (parseFloat(beat.price as string) || 0), 0) / filteredAndSortedBeats.length).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Beat List */}
      <div className="space-y-3">
        {filteredAndSortedBeats?.length === 0 ? (
          <div className="text-center py-12">
            <Music4 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No beats found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedGenre || selectedLicense
                ? 'Try adjusting your search or filters'
                : 'List the first beat to get started!'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedBeats?.map((beat: Beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              isPlaying={playingBeat === beat.id}
              onPlayToggle={() => handlePlayToggle(beat.id)}
            />
          ))
        )}
      </div>

      {/* Create Beat Dialog */}
      {showCreateDialog && (
        <CreateBeatDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}