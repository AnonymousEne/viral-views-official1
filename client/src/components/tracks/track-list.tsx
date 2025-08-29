import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Music } from 'lucide-react';
import { useTracks } from '@/hooks/useApi';
import TrackCard from './track-card';
import { useAuth } from '@/hooks/useAuth';
import CreateTrackDialog from './create-track-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import type { Track } from '@shared/schema';

const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Country', 'Reggae'];

export default function TrackList() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: tracks, isLoading, error } = useTracks();
  
  const filteredTracks = tracks?.filter((track: Track) => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artistName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !selectedGenre || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handlePlayToggle = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId);
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
        <p className="text-red-400">Failed to load tracks. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Music className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Tracks</h1>
          <Badge variant="secondary">{tracks?.length || 0}</Badge>
        </div>
        
        {user && (user.role === 'artist' || user.role === 'producer') && (
          <Button
            data-testid="button-create-track"
            onClick={() => setShowCreateDialog(true)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Track
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            data-testid="input-search-tracks"
            placeholder="Search tracks or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-dark-200 border-dark-400 text-white"
          />
        </div>

        {/* Genre Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            <Button
              data-testid="filter-all-genres"
              variant={!selectedGenre ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGenre('')}
              className="text-xs"
            >
              All
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
      </div>

      {/* Track List */}
      <div className="space-y-3">
        {filteredTracks?.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No tracks found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedGenre 
                ? 'Try adjusting your search or filters'
                : 'Upload the first track to get started!'
              }
            </p>
          </div>
        ) : (
          filteredTracks?.map((track: Track) => (
            <TrackCard
              key={track.id}
              track={track}
              isPlaying={playingTrack === track.id}
              onPlayToggle={() => handlePlayToggle(track.id)}
            />
          ))
        )}
      </div>

      {/* Create Track Dialog */}
      {showCreateDialog && (
        <CreateTrackDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}