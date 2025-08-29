import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Users, Clock, Trophy, Vote } from 'lucide-react';
import { useState } from 'react';
import { useVoteInBattle } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import type { Battle } from '@shared/schema';

interface BattleCardProps {
  battle: Battle;
  className?: string;
  showVoting?: boolean;
}

export default function BattleCard({ battle, className, showVoting = true }: BattleCardProps) {
  const { user } = useAuth();
  const { castVote } = useWebSocket();
  const voteInBattle = useVoteInBattle();
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  const totalVotes = (battle.contestant1Votes || 0) + (battle.contestant2Votes || 0);
  const contestant1Percentage = totalVotes > 0 ? ((battle.contestant1Votes || 0) / totalVotes) * 100 : 50;
  const contestant2Percentage = totalVotes > 0 ? ((battle.contestant2Votes || 0) / totalVotes) * 100 : 50;

  const handleVote = (contestantId: string) => {
    if (!user) return;
    
    voteInBattle.mutate({
      battleId: battle.id,
      userId: user.id,
      contestantId,
    });

    // Send real-time vote update
    castVote(battle.id, contestantId);
  };

  const getBattleStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'freestyle':
        return 'bg-purple-500';
      case 'championship':
        return 'bg-gold-500';
      case 'team':
        return 'bg-blue-500';
      case 'open_mic':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimeRemaining = (endTime: Date | null) => {
    if (!endTime) return null;
    
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <Card className={cn("bg-dark-200 border-dark-400 hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white" data-testid={`text-battle-title-${battle.id}`}>
              {battle.title}
            </h3>
            <Badge className={getCategoryColor(battle.category)}>
              {battle.category.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getBattleStatusColor(battle.status || 'active')}>
              {(battle.status || 'active').toUpperCase()}
            </Badge>
            
            {battle.endTime && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatTimeRemaining(battle.endTime)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Battle Contestants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contestant 1 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white" data-testid={`text-contestant1-${battle.id}`}>
                {battle.contestant1Name}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {battle.contestant1Votes} votes ({contestant1Percentage.toFixed(1)}%)
              </Badge>
            </div>
            
            <Progress 
              value={contestant1Percentage} 
              className="h-2 bg-dark-300"
              data-testid={`progress-contestant1-${battle.id}`}
            />
            
            <div className="flex items-center space-x-2">
              {battle.contestant1Track && (
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`button-play-contestant1-${battle.id}`}
                  onClick={() => setIsPlaying1(!isPlaying1)}
                >
                  {isPlaying1 ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  Play Track
                </Button>
              )}
              
              {showVoting && battle.status === 'active' && user && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-purple-500 hover:bg-purple-600"
                  data-testid={`button-vote-contestant1-${battle.id}`}
                  onClick={() => handleVote(battle.contestant1Id)}
                  disabled={voteInBattle.isPending}
                >
                  <Vote className="w-3 h-3 mr-1" />
                  Vote
                </Button>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center md:col-span-1">
            <div className="bg-gradient-to-r from-purple-500 to-electric-500 text-white px-3 py-1 rounded-full font-bold text-sm">
              VS
            </div>
          </div>

          {/* Contestant 2 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white" data-testid={`text-contestant2-${battle.id}`}>
                {battle.contestant2Name}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {battle.contestant2Votes} votes ({contestant2Percentage.toFixed(1)}%)
              </Badge>
            </div>
            
            <Progress 
              value={contestant2Percentage} 
              className="h-2 bg-dark-300"
              data-testid={`progress-contestant2-${battle.id}`}
            />
            
            <div className="flex items-center space-x-2">
              {battle.contestant2Track && (
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`button-play-contestant2-${battle.id}`}
                  onClick={() => setIsPlaying2(!isPlaying2)}
                >
                  {isPlaying2 ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  Play Track
                </Button>
              )}
              
              {showVoting && battle.status === 'active' && user && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-purple-500 hover:bg-purple-600"
                  data-testid={`button-vote-contestant2-${battle.id}`}
                  onClick={() => handleVote(battle.contestant2Id)}
                  disabled={voteInBattle.isPending}
                >
                  <Vote className="w-3 h-3 mr-1" />
                  Vote
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-400">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span data-testid={`text-total-votes-${battle.id}`}>
                {totalVotes} total votes
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4" />
              <span data-testid={`text-views-${battle.id}`}>
                {battle.views?.toLocaleString() || 0} views
              </span>
            </div>
          </div>
          
          {battle.status === 'completed' && totalVotes > 0 && (
            <Badge className="bg-gold-500">
              Winner: {(battle.contestant1Votes || 0) > (battle.contestant2Votes || 0) 
                ? battle.contestant1Name 
                : battle.contestant2Name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}