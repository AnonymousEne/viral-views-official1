import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Trophy, Zap } from 'lucide-react';
import { useBattles, useActiveBattles } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import BattleCard from './battle-card';
import CreateBattleDialog from './create-battle-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import type { Battle } from '@shared/schema';

const CATEGORIES = ['freestyle', 'championship', 'team', 'open_mic'];
const STATUSES = ['active', 'completed', 'pending'];

export default function BattleList() {
  const { user } = useAuth();
  const { subscribeToMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Map<string, Partial<Battle>>>(new Map());
  
  const { data: allBattles, isLoading: loadingAll } = useBattles();
  const { data: activeBattles, isLoading: loadingActive } = useActiveBattles();
  
  const battles = selectedStatus === 'active' ? activeBattles : allBattles;
  const isLoading = selectedStatus === 'active' ? loadingActive : loadingAll;

  // Subscribe to real-time battle updates
  useEffect(() => {
    const unsubscribeVote = subscribeToMessage('vote-update', (data) => {
      setLiveUpdates(prev => new Map(prev.set(data.battleId, {
        contestant1Votes: data.contestant1Votes,
        contestant2Votes: data.contestant2Votes,
        totalVotes: data.totalVotes,
      })));
    });

    const unsubscribeBattleUpdate = subscribeToMessage('battle-update', (data) => {
      setLiveUpdates(prev => new Map(prev.set(data.battleId, data.updates)));
    });

    return () => {
      unsubscribeVote();
      unsubscribeBattleUpdate();
    };
  }, [subscribeToMessage]);
  
  const filteredBattles = battles?.filter((battle: Battle) => {
    // Apply live updates if available
    const updatedBattle = liveUpdates.has(battle.id) 
      ? { ...battle, ...liveUpdates.get(battle.id) }
      : battle;
      
    const matchesSearch = updatedBattle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         updatedBattle.contestant1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         updatedBattle.contestant2Name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || updatedBattle.category === selectedCategory;
    const matchesStatus = !selectedStatus || updatedBattle.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Trophy className="w-6 h-6 text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Battles</h1>
          <Badge variant="secondary">{battles?.length || 0}</Badge>
          {selectedStatus === 'active' && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">LIVE</span>
            </div>
          )}
        </div>
        
        {user && (user.role === 'artist' || user.role === 'producer') && (
          <Button
            data-testid="button-create-battle"
            onClick={() => setShowCreateDialog(true)}
            className="bg-gold-500 hover:bg-gold-600 text-black font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Battle
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            data-testid="input-search-battles"
            placeholder="Search battles or contestants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-dark-200 border-dark-400 text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex space-x-2">
            {STATUSES.map((status) => (
              <Button
                key={status}
                data-testid={`filter-status-${status}`}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="text-xs"
              >
                {status === 'active' && <Zap className="w-3 h-3 mr-1" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            data-testid="filter-all-categories"
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className="text-xs"
          >
            All Categories
          </Button>
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              data-testid={`filter-category-${category}`}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
              className="text-xs"
            >
              {category.replace('_', ' ').toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Battle List */}
      <div className="space-y-4">
        {filteredBattles?.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No battles found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filters'
                : selectedStatus === 'active' 
                  ? 'No active battles right now. Check back soon!'
                  : 'Create the first battle to get started!'
              }
            </p>
          </div>
        ) : (
          filteredBattles?.map((battle: Battle) => {
            // Apply live updates if available
            const updatedBattle = liveUpdates.has(battle.id) 
              ? { ...battle, ...liveUpdates.get(battle.id) }
              : battle;
              
            return (
              <BattleCard
                key={battle.id}
                battle={updatedBattle as Battle}
                showVoting={selectedStatus === 'active'}
              />
            );
          })
        )}
      </div>

      {/* Create Battle Dialog */}
      {showCreateDialog && (
        <CreateBattleDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}