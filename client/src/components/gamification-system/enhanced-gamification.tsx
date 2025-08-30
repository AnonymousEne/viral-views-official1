import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy,
  Star,
  Zap,
  Target,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Fire,
  Music,
  Mic,
  Users,
  Calendar,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Gift,
  Coins,
  Diamond,
  Gem,
  Sparkles,
  Clock,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'battles' | 'collaborations' | 'social' | 'music' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: string[];
  rewards: {
    xp: number;
    coins: number;
    badges?: string[];
    unlocks?: string[];
  };
}

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalXP: number;
  coins: number;
  gems: number;
  rank: number;
  battlesWon: number;
  battlesTotal: number;
  winRate: number;
  streakCurrent: number;
  streakBest: number;
  collaborations: number;
  tracksCreated: number;
  totalPlays: number;
  totalLikes: number;
  followersGained: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
    title?: string;
  };
  score: number;
  change: number; // Position change from last week
  streak?: number;
  category: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  category: 'battle' | 'social' | 'create' | 'listen';
  difficulty: 'easy' | 'medium' | 'hard';
  progress: number;
  maxProgress: number;
  rewards: {
    xp: number;
    coins: number;
    bonus?: string;
  };
  timeRemaining: number; // in hours
  isCompleted: boolean;
}

interface Reward {
  id: string;
  type: 'badge' | 'title' | 'avatar' | 'theme' | 'boost' | 'unlock';
  name: string;
  description: string;
  icon: string;
  cost: {
    coins?: number;
    gems?: number;
    level?: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isOwned: boolean;
  category: string;
}

// Mock data
const mockUserStats: UserStats = {
  level: 42,
  xp: 15750,
  xpToNext: 2250,
  totalXP: 15750,
  coins: 3420,
  gems: 89,
  rank: 247,
  battlesWon: 23,
  battlesTotal: 31,
  winRate: 74.2,
  streakCurrent: 5,
  streakBest: 12,
  collaborations: 8,
  tracksCreated: 15,
  totalPlays: 12500,
  totalLikes: 892,
  followersGained: 156,
  achievementsUnlocked: 18,
  totalAchievements: 45
};

const mockAchievements: Achievement[] = [
  {
    id: 'first-battle-win',
    title: 'First Victory',
    description: 'Win your first rap battle',
    icon: Trophy,
    category: 'battles',
    tier: 'bronze',
    points: 100,
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    unlockedAt: '2025-08-20T10:30:00Z',
    rarity: 'common',
    requirements: ['Win 1 rap battle'],
    rewards: {
      xp: 100,
      coins: 50,
      badges: ['first-winner']
    }
  },
  {
    id: 'battle-streak-5',
    title: 'Hot Streak',
    description: 'Win 5 battles in a row',
    icon: Fire,
    category: 'battles',
    tier: 'gold',
    points: 500,
    progress: 5,
    maxProgress: 5,
    isUnlocked: true,
    unlockedAt: '2025-08-25T16:20:00Z',
    rarity: 'rare',
    requirements: ['Win 5 consecutive battles'],
    rewards: {
      xp: 500,
      coins: 250,
      badges: ['streak-master'],
      unlocks: ['victory-celebration']
    }
  },
  {
    id: 'legendary-producer',
    title: 'Legendary Producer',
    description: 'Create 50 beats that each get 1000+ plays',
    icon: Crown,
    category: 'music',
    tier: 'diamond',
    points: 2000,
    progress: 12,
    maxProgress: 50,
    isUnlocked: false,
    rarity: 'legendary',
    requirements: ['Create 50 beats with 1000+ plays each'],
    rewards: {
      xp: 2000,
      coins: 1000,
      badges: ['legendary-producer'],
      unlocks: ['premium-effects', 'exclusive-samples']
    }
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Complete 10 successful collaborations',
    icon: Users,
    category: 'collaborations',
    tier: 'silver',
    points: 300,
    progress: 8,
    maxProgress: 10,
    isUnlocked: false,
    rarity: 'common',
    requirements: ['Complete 10 collaborations'],
    rewards: {
      xp: 300,
      coins: 150,
      badges: ['collaborator']
    }
  },
  {
    id: 'viral-hit',
    title: 'Viral Hit',
    description: 'Get a track to 100K plays in 24 hours',
    icon: TrendingUp,
    category: 'music',
    tier: 'platinum',
    points: 1500,
    progress: 0,
    maxProgress: 1,
    isUnlocked: false,
    rarity: 'epic',
    requirements: ['Reach 100K plays in 24 hours on one track'],
    rewards: {
      xp: 1500,
      coins: 750,
      badges: ['viral-artist'],
      unlocks: ['trending-boost']
    }
  }
];

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    user: {
      id: 'user-1',
      name: 'BeatKing Supreme',
      avatar: 'https://picsum.photos/100/100?random=1',
      level: 89,
      title: 'Legendary Producer'
    },
    score: 45890,
    change: 0,
    streak: 15,
    category: 'Overall'
  },
  {
    rank: 2,
    user: {
      id: 'user-2',
      name: 'RhymeFlow Master',
      avatar: 'https://picsum.photos/100/100?random=2',
      level: 76,
      title: 'Battle Champion'
    },
    score: 42100,
    change: 1,
    streak: 8,
    category: 'Overall'
  },
  {
    rank: 3,
    user: {
      id: 'user-3',
      name: 'SoulVibe Producer',
      avatar: 'https://picsum.photos/100/100?random=3',
      level: 68,
      title: 'Collaboration King'
    },
    score: 38750,
    change: -1,
    category: 'Overall'
  }
];

const mockDailyChallenges: DailyChallenge[] = [
  {
    id: 'daily-battle',
    title: 'Daily Battle Champion',
    description: 'Win 3 rap battles today',
    category: 'battle',
    difficulty: 'medium',
    progress: 2,
    maxProgress: 3,
    rewards: {
      xp: 200,
      coins: 100,
      bonus: '2x XP for next battle'
    },
    timeRemaining: 14,
    isCompleted: false
  },
  {
    id: 'social-engagement',
    title: 'Social Butterfly',
    description: 'Like 20 tracks and comment on 5',
    category: 'social',
    difficulty: 'easy',
    progress: 5,
    maxProgress: 25,
    rewards: {
      xp: 100,
      coins: 50
    },
    timeRemaining: 14,
    isCompleted: false
  },
  {
    id: 'beat-creation',
    title: 'Beat Maker',
    description: 'Create and upload 1 new beat',
    category: 'create',
    difficulty: 'hard',
    progress: 0,
    maxProgress: 1,
    rewards: {
      xp: 300,
      coins: 150,
      bonus: 'Featured placement chance'
    },
    timeRemaining: 14,
    isCompleted: false
  }
];

const mockRewards: Reward[] = [
  {
    id: 'golden-crown',
    type: 'avatar',
    name: 'Golden Crown',
    description: 'Show your royal status',
    icon: '👑',
    cost: { coins: 500 },
    rarity: 'rare',
    isOwned: false,
    category: 'Avatar Items'
  },
  {
    id: 'beat-master',
    type: 'title',
    name: 'Beat Master',
    description: 'Display your production skills',
    icon: '🎵',
    cost: { coins: 300, level: 25 },
    rarity: 'common',
    isOwned: true,
    category: 'Titles'
  },
  {
    id: 'legendary-theme',
    type: 'theme',
    name: 'Legendary Theme',
    description: 'Exclusive dark theme with gold accents',
    icon: '✨',
    cost: { gems: 50 },
    rarity: 'legendary',
    isOwned: false,
    category: 'Themes'
  }
];

function ProgressRing({ progress, max, size = 120, strokeWidth = 8, className }: {
  progress: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / max) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-dark-400"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          className="text-electric-500 transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {Math.round((progress / max) * 100)}%
        </span>
      </div>
    </div>
  );
}

function StatsOverview({ stats }: { stats: UserStats }) {
  const levelProgress = (stats.xp / (stats.xp + stats.xpToNext)) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Level & XP */}
      <Card className="bg-dark-200 border-dark-400">
        <CardContent className="p-6 text-center">
          <ProgressRing progress={stats.xp} max={stats.xp + stats.xpToNext} size={100} />
          <h3 className="text-2xl font-bold text-white mt-4">Level {stats.level}</h3>
          <p className="text-sm text-gray-400">
            {stats.xpToNext.toLocaleString()} XP to next level
          </p>
        </CardContent>
      </Card>

      {/* Battle Stats */}
      <Card className="bg-dark-200 border-dark-400">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="text-xl font-bold text-white">{stats.battlesWon}</h3>
              <p className="text-sm text-gray-400">Battles Won</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Win Rate</span>
              <span className="text-green-500">{stats.winRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Streak</span>
              <span className="text-electric-500">{stats.streakCurrent}</span>
            </div>
            <Progress value={stats.winRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="bg-dark-200 border-dark-400">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-400">Coins</span>
              </div>
              <span className="text-lg font-bold text-white">
                {stats.coins.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Diamond className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-400">Gems</span>
              </div>
              <span className="text-lg font-bold text-white">
                {stats.gems.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-dark-200 border-dark-400">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="text-xl font-bold text-white">
                {stats.achievementsUnlocked}/{stats.totalAchievements}
              </h3>
              <p className="text-sm text-gray-400">Achievements</p>
            </div>
          </div>
          <Progress 
            value={(stats.achievementsUnlocked / stats.totalAchievements) * 100} 
            className="h-2" 
          />
          <p className="text-xs text-gray-400 mt-2">
            Rank #{stats.rank} globally
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const IconComponent = achievement.icon;
  
  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-600/20';
      case 'silver': return 'text-gray-300 bg-gray-300/20';
      case 'gold': return 'text-yellow-500 bg-yellow-500/20';
      case 'platinum': return 'text-blue-300 bg-blue-300/20';
      case 'diamond': return 'text-cyan-400 bg-cyan-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-500';
      case 'rare': return 'border-blue-500';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-yellow-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <Card className={cn(
      "relative bg-dark-200 border-dark-400 transition-all duration-200 hover:shadow-xl",
      achievement.isUnlocked ? "border-electric-500/50" : "opacity-75",
      getRarityColor(achievement.rarity)
    )}>
      {achievement.isUnlocked && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-electric-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            getTierColor(achievement.tier)
          )}>
            <IconComponent className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={cn(
                  "font-semibold",
                  achievement.isUnlocked ? "text-white" : "text-gray-400"
                )}>
                  {achievement.isUnlocked ? achievement.title : '???'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {achievement.isUnlocked ? achievement.description : 'Complete requirements to unlock'}
                </p>
              </div>
              
              <Badge className={cn("text-xs capitalize", getTierColor(achievement.tier))}>
                {achievement.tier}
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">
                  {achievement.progress}/{achievement.maxProgress}
                </span>
              </div>
              <Progress 
                value={(achievement.progress / achievement.maxProgress) * 100} 
                className="h-2"
              />
            </div>

            {/* Rewards */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span className="text-gray-400">{achievement.rewards.xp} XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-gray-400">{achievement.rewards.coins}</span>
                </div>
              </div>
              
              {achievement.points > 0 && (
                <Badge variant="outline" className="text-xs">
                  {achievement.points} pts
                </Badge>
              )}
            </div>

            {achievement.isUnlocked && achievement.unlockedAt && (
              <p className="text-xs text-electric-500 mt-2">
                Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({ entry }: { entry: LeaderboardEntry }) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-white';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-lg font-bold text-white">#{rank}</span>;
    }
  };

  return (
    <Card className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center">
            {getRankIcon(entry.rank)}
          </div>

          <Avatar className="w-12 h-12">
            <AvatarImage src={entry.user.avatar} />
            <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">{entry.user.name}</h3>
              <Badge variant="outline" className="text-xs">
                Lv.{entry.user.level}
              </Badge>
            </div>
            {entry.user.title && (
              <p className="text-sm text-electric-500">{entry.user.title}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-white">
              {entry.score.toLocaleString()}
            </p>
            <div className="flex items-center space-x-2 text-sm">
              {entry.change !== 0 && (
                <div className={cn(
                  "flex items-center",
                  entry.change > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {entry.change > 0 ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(entry.change)}</span>
                </div>
              )}
              {entry.streak && (
                <div className="flex items-center text-orange-500">
                  <Fire className="w-3 h-3 mr-1" />
                  <span>{entry.streak}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyChallengeCard({ challenge }: { challenge: DailyChallenge }) {
  const getDifficultyColor = (difficulty: DailyChallenge['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      case 'hard': return 'text-red-500 bg-red-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getCategoryIcon = (category: DailyChallenge['category']) => {
    switch (category) {
      case 'battle': return <Trophy className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      case 'create': return <Music className="w-4 h-4" />;
      case 'listen': return <Volume2 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <Card className={cn(
      "bg-dark-200 border-dark-400",
      challenge.isCompleted && "border-green-500/50 bg-green-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(challenge.category)}
            <h3 className="font-semibold text-white">{challenge.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs capitalize", getDifficultyColor(challenge.difficulty))}>
              {challenge.difficulty}
            </Badge>
            <div className="flex items-center text-sm text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>{challenge.timeRemaining}h</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">{challenge.description}</p>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white">
              {challenge.progress}/{challenge.maxProgress}
            </span>
          </div>
          <Progress 
            value={(challenge.progress / challenge.maxProgress) * 100} 
            className="h-2"
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-gray-400">{challenge.rewards.xp} XP</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-gray-400">{challenge.rewards.coins}</span>
            </div>
          </div>

          {challenge.isCompleted ? (
            <Badge className="bg-green-500 text-white">
              Completed
            </Badge>
          ) : (
            <Button size="sm" variant="outline">
              Continue
            </Button>
          )}
        </div>

        {challenge.rewards.bonus && (
          <div className="mt-3 p-2 bg-electric-500/20 rounded border border-electric-500/30">
            <p className="text-xs text-electric-400">
              <Gift className="w-3 h-3 inline mr-1" />
              Bonus: {challenge.rewards.bonus}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GamificationSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [achievementFilter, setAchievementFilter] = useState('all');
  const [leaderboardCategory, setLeaderboardCategory] = useState('overall');

  const filteredAchievements = achievementFilter === 'all' 
    ? mockAchievements 
    : achievementFilter === 'unlocked'
    ? mockAchievements.filter(a => a.isUnlocked)
    : mockAchievements.filter(a => !a.isUnlocked);

  return (
    <div className="min-h-screen bg-dark-100 p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Player Progress</h1>
        <p className="text-gray-400 text-lg">Track your journey to becoming a legend</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full bg-dark-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatsOverview stats={mockUserStats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-200 border-dark-400">
              <CardHeader>
                <CardTitle className="text-white">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAchievements
                  .filter(a => a.isUnlocked)
                  .slice(0, 3)
                  .map(achievement => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-dark-400">
              <CardHeader>
                <CardTitle className="text-white">Daily Challenges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockDailyChallenges.slice(0, 2).map(challenge => (
                  <DailyChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {['all', 'unlocked', 'locked'].map((filter) => (
                <Button
                  key={filter}
                  variant={achievementFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAchievementFilter(filter)}
                  className="capitalize"
                >
                  {filter === 'locked' ? 'In Progress' : filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['overall', 'battles', 'production', 'social'].map((category) => (
                <Button
                  key={category}
                  variant={leaderboardCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLeaderboardCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            <Badge className="bg-electric-500">
              Your Rank: #{mockUserStats.rank}
            </Badge>
          </div>

          <div className="space-y-4">
            {mockLeaderboard.map(entry => (
              <LeaderboardCard key={entry.user.id} entry={entry} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDailyChallenges.map(challenge => (
              <DailyChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-white">
                  {mockUserStats.coins.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Diamond className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-bold text-white">
                  {mockUserStats.gems.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRewards.map(reward => (
              <Card
                key={reward.id}
                className={cn(
                  "bg-dark-200 border-dark-400",
                  reward.isOwned && "border-green-500/50 bg-green-500/5"
                )}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-3">{reward.icon}</div>
                  <h3 className="font-semibold text-white mb-2">{reward.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{reward.description}</p>
                  
                  <div className="flex items-center justify-center space-x-4 mb-4 text-sm">
                    {reward.cost.coins && (
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-white">{reward.cost.coins}</span>
                      </div>
                    )}
                    {reward.cost.gems && (
                      <div className="flex items-center space-x-1">
                        <Diamond className="w-4 h-4 text-blue-500" />
                        <span className="text-white">{reward.cost.gems}</span>
                      </div>
                    )}
                    {reward.cost.level && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-purple-500" />
                        <span className="text-white">Lv.{reward.cost.level}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    disabled={reward.isOwned}
                    className={cn(
                      reward.isOwned 
                        ? "bg-green-500 text-white" 
                        : "bg-electric-500 hover:bg-electric-600"
                    )}
                  >
                    {reward.isOwned ? "Owned" : "Purchase"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
