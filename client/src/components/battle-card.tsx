import { type Battle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface BattleCardProps {
  battle: Battle;
  featured?: boolean;
  onVote?: (battleId: string, contestantId: string) => void;
  isVoting?: boolean;
}

export default function BattleCard({ battle, featured = false, onVote, isVoting = false }: BattleCardProps) {
  const getPercentages = () => {
    const total = battle.totalVotes || 0;
    if (total === 0) return { contestant1: 50, contestant2: 50 };
    
    const contestant1Percent = Math.round(((battle.contestant1Votes || 0) / total) * 100);
    const contestant2Percent = 100 - contestant1Percent;
    
    return { contestant1: contestant1Percent, contestant2: contestant2Percent };
  };

  const percentages = getPercentages();

  const getStatusColor = () => {
    switch (battle.status) {
      case 'active': return 'bg-success-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-highlight-500';
    }
  };

  const getCategoryColor = () => {
    switch (battle.category) {
      case 'freestyle': return 'text-highlight-500';
      case 'championship': return 'text-gold-500';
      case 'team': return 'text-success-500';
      case 'open_mic': return 'text-purple-500';
      default: return 'text-purple-500';
    }
  };

  return (
    <Card className={`bg-dark-200 border-dark-400 ${featured ? 'p-8' : ''}`} data-testid={`battle-card-${battle.id}`}>
      <CardContent className={featured ? 'p-0' : 'p-6'}>
        {featured && (
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4" data-testid={`battle-title-${battle.id}`}>
              {battle.title}
            </h3>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-400 mb-4">
              <Badge className={`${getCategoryColor()} bg-transparent border`} data-testid={`battle-category-${battle.id}`}>
                {battle.category.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {battle.totalVotes?.toLocaleString() || 0} votes
              </span>
              {battle.endTime && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Ends {new Date(battle.endTime).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        <div className={`grid ${featured ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'} gap-8 items-center`}>
          {/* Contestant 1 */}
          <div className="text-center lg:text-right">
            <div className="inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full border-4 border-purple-500 flex items-center justify-center text-xl font-bold text-white">
                {battle.contestant1Name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <h4 className="text-2xl font-bold mb-2 text-white" data-testid={`contestant1-name-${battle.id}`}>
              {battle.contestant1Name}
            </h4>
            <p className="text-gray-400 mb-4">The Lightning Strike</p>
            <div className="bg-purple-500 rounded-lg p-4">
              <div className="text-3xl font-black mb-2 text-white" data-testid={`contestant1-percentage-${battle.id}`}>
                {percentages.contestant1}%
              </div>
              {onVote && battle.status === 'active' && (
                <Button 
                  onClick={() => onVote(battle.id, battle.contestant1Id)}
                  disabled={isVoting}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium transition-all"
                  data-testid={`button-vote-contestant1-${battle.id}`}
                >
                  {isVoting ? 'Voting...' : `Vote ${battle.contestant1Name.split(' ')[0]}`}
                </Button>
              )}
            </div>
          </div>

          {/* VS Section */}
          <div className="text-center">
            <div className="text-6xl font-black text-gray-600 mb-4">VS</div>
            <div className="bg-dark-300 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Battle Status</div>
              <div className={`font-bold ${getCategoryColor()}`} data-testid={`battle-status-${battle.id}`}>
                {battle.status === 'active' ? 'ACTIVE' : (battle.status || 'active').toUpperCase()}
              </div>
              {battle.endTime && battle.status === 'active' && (
                <div className="text-sm text-gray-400 mt-2">
                  Ends {new Date(battle.endTime).toLocaleDateString()}
                </div>
              )}
            </div>
            <Button 
              className="mt-4 bg-gradient-to-r from-purple-500 to-electric-500 text-white font-bold hover:from-purple-600 hover:to-electric-600 transition-all"
              data-testid={`button-watch-battle-${battle.id}`}
            >
              Watch Battle
            </Button>
          </div>

          {/* Contestant 2 */}
          <div className="text-center lg:text-left">
            <div className="inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-electric-500 to-electric-600 rounded-full border-4 border-electric-500 flex items-center justify-center text-xl font-bold text-white">
                {battle.contestant2Name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <h4 className="text-2xl font-bold mb-2 text-white" data-testid={`contestant2-name-${battle.id}`}>
              {battle.contestant2Name}
            </h4>
            <p className="text-gray-400 mb-4">Wordplay Royalty</p>
            <div className="bg-electric-500 rounded-lg p-4">
              <div className="text-3xl font-black mb-2 text-white" data-testid={`contestant2-percentage-${battle.id}`}>
                {percentages.contestant2}%
              </div>
              {onVote && battle.status === 'active' && (
                <Button 
                  onClick={() => onVote(battle.id, battle.contestant2Id)}
                  disabled={isVoting}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium transition-all"
                  data-testid={`button-vote-contestant2-${battle.id}`}
                >
                  {isVoting ? 'Voting...' : `Vote ${battle.contestant2Name.split(' ')[0]}`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {!featured && (
          <div className="mt-6 pt-4 border-t border-dark-400">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4 text-gray-400">
                <span data-testid={`battle-votes-${battle.id}`}>
                  {battle.totalVotes?.toLocaleString() || 0} votes
                </span>
                <span data-testid={`battle-views-${battle.id}`}>
                  {battle.views?.toLocaleString() || 0} views
                </span>
              </div>
              <Badge 
                className={`${getStatusColor()} text-white`}
                data-testid={`battle-status-badge-${battle.id}`}
              >
                {battle.status?.toUpperCase()}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
