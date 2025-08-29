import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Star, Crown, Flame, Zap, Target,
  Medal, Award, Gem, Sword, Shield, 
  TrendingUp, Calendar, Clock, Users,
  Gift, Coins, Sparkles, CheckCircle
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  category: 'battle' | 'streaming' | 'social' | 'creation' | 'collaboration';
}

interface Skill {
  id: string;
  name: string;
  level: number;
  experience: number;
  nextLevelXp: number;
  category: 'freestyle' | 'rhythm' | 'creativity' | 'collaboration' | 'performance';
  icon: string;
  color: string;
}

interface Streak {
  type: 'daily' | 'weekly' | 'battle' | 'creation';
  current: number;
  best: number;
  reward: number;
  nextReward: number;
}

interface UserStats {
  level: number;
  experience: number;
  nextLevelXp: number;
  totalPoints: number;
  rank: string;
  percentile: number;
  battlesWon: number;
  streamsCompleted: number;
  collaborations: number;
  achievements: Achievement[];
  skills: Skill[];
  streaks: Streak[];
}

interface GamificationSystemProps {
  userId?: string;
  onClaimReward?: (rewardId: string) => void;
  onShareAchievement?: (achievementId: string) => void;
  className?: string;
}

export default function GamificationSystem({
  userId,
  onClaimReward,
  onShareAchievement,
  className = ""
}: GamificationSystemProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'skills' | 'leaderboard'>('overview');
  const [showRewardModal, setShowRewardModal] = useState<Achievement | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);

  // Mock user stats
  const generateMockStats = useCallback((): UserStats => {
    const achievements: Achievement[] = [
      {
        id: 'first-battle',
        title: 'First Battle',
        description: 'Complete your first rap battle',
        icon: '⚔️',
        rarity: 'common',
        points: 100,
        unlockedAt: new Date(),
        category: 'battle'
      },
      {
        id: 'win-streak-5',
        title: 'Hot Streak',
        description: 'Win 5 battles in a row',
        icon: '🔥',
        rarity: 'rare',
        points: 500,
        progress: 3,
        maxProgress: 5,
        category: 'battle'
      },
      {
        id: 'stream-master',
        title: 'Stream Master',
        description: 'Complete 100 live streams',
        icon: '📺',
        rarity: 'epic',
        points: 1000,
        progress: 47,
        maxProgress: 100,
        category: 'streaming'
      },
      {
        id: 'legendary-artist',
        title: 'Legendary Artist',
        description: 'Reach the top 1% of artists',
        icon: '👑',
        rarity: 'legendary',
        points: 5000,
        category: 'social'
      }
    ];

    const skills: Skill[] = [
      {
        id: 'freestyle',
        name: 'Freestyle',
        level: 12,
        experience: 2400,
        nextLevelXp: 2600,
        category: 'freestyle',
        icon: '🎤',
        color: 'text-red-500'
      },
      {
        id: 'rhythm',
        name: 'Rhythm',
        level: 8,
        experience: 1200,
        nextLevelXp: 1400,
        category: 'rhythm',
        icon: '🥁',
        color: 'text-blue-500'
      },
      {
        id: 'creativity',
        name: 'Creativity',
        level: 15,
        experience: 3200,
        nextLevelXp: 3500,
        category: 'creativity',
        icon: '🎨',
        color: 'text-purple-500'
      },
      {
        id: 'collaboration',
        name: 'Collaboration',
        level: 6,
        experience: 800,
        nextLevelXp: 1000,
        category: 'collaboration',
        icon: '🤝',
        color: 'text-green-500'
      },
      {
        id: 'performance',
        name: 'Performance',
        level: 10,
        experience: 1800,
        nextLevelXp: 2000,
        category: 'performance',
        icon: '⭐',
        color: 'text-yellow-500'
      }
    ];

    const streaks: Streak[] = [
      { type: 'daily', current: 7, best: 21, reward: 50, nextReward: 100 },
      { type: 'weekly', current: 2, best: 8, reward: 200, nextReward: 500 },
      { type: 'battle', current: 3, best: 12, reward: 150, nextReward: 300 },
      { type: 'creation', current: 5, best: 15, reward: 100, nextReward: 250 }
    ];

    return {
      level: 24,
      experience: 12750,
      nextLevelXp: 15000,
      totalPoints: 8450,
      rank: 'Gold',
      percentile: 15,
      battlesWon: 127,
      streamsCompleted: 47,
      collaborations: 23,
      achievements,
      skills,
      streaks
    };
  }, []);

  // Mock daily tasks
  const generateDailyTasks = useCallback(() => {
    return [
      { id: 'daily-stream', title: 'Complete a live stream', progress: 0, max: 1, reward: 100, completed: false },
      { id: 'daily-battle', title: 'Participate in 3 battles', progress: 1, max: 3, reward: 150, completed: false },
      { id: 'daily-collab', title: 'Join a collaboration room', progress: 1, max: 1, reward: 75, completed: true },
      { id: 'daily-social', title: 'Like and comment on 10 posts', progress: 7, max: 10, reward: 50, completed: false }
    ];
  }, []);

  useEffect(() => {
    setUserStats(generateMockStats());
    setDailyTasks(generateDailyTasks());
  }, [generateMockStats, generateDailyTasks]);

  // Simulate new achievement
  useEffect(() => {
    const timer = setTimeout(() => {
      const newAchievement: Achievement = {
        id: 'social-butterfly',
        title: 'Social Butterfly',
        description: 'Get 100 likes on a single stream',
        icon: '🦋',
        rarity: 'rare',
        points: 300,
        unlockedAt: new Date(),
        category: 'social'
      };
      setNewAchievements([newAchievement]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-500/20';
      case 'rare': return 'border-blue-500 bg-blue-500/20';
      case 'epic': return 'border-purple-500 bg-purple-500/20';
      case 'legendary': return 'border-yellow-500 bg-yellow-500/20';
      default: return 'border-gray-500 bg-gray-500/20';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Bronze': return '🥉';
      case 'Silver': return '🥈';
      case 'Gold': return '🥇';
      case 'Platinum': return '💎';
      case 'Diamond': return '💍';
      default: return '⭐';
    }
  };

  const formatStreak = (type: string) => {
    switch (type) {
      case 'daily': return 'Daily Login';
      case 'weekly': return 'Weekly Active';
      case 'battle': return 'Battle Wins';
      case 'creation': return 'Content Created';
      default: return type;
    }
  };

  if (!userStats) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-3xl">{getRankIcon(userStats.rank)}</div>
              <div className="text-xs text-gray-400">Level {userStats.level}</div>
            </div>
            <div>
              <h1 className="text-xl font-bold">Your Progress</h1>
              <div className="text-sm text-gray-400">
                {userStats.rank} Rank • Top {userStats.percentile}%
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{userStats.totalPoints}</div>
            <div className="text-xs text-gray-400">Total Points</div>
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Level {userStats.level}</span>
            <span>{userStats.experience} / {userStats.nextLevelXp} XP</span>
          </div>
          <Progress 
            value={(userStats.experience / userStats.nextLevelXp) * 100}
            className="h-2"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'skills', label: 'Skills', icon: Star },
          { id: 'leaderboard', label: 'Leaderboard', icon: Crown }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant="ghost"
            className={`flex-1 rounded-none py-4 ${
              activeTab === tab.id ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Sword className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{userStats.battlesWon}</div>
                <div className="text-xs text-gray-400">Battles Won</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{userStats.streamsCompleted}</div>
                <div className="text-xs text-gray-400">Streams</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{userStats.collaborations}</div>
                <div className="text-xs text-gray-400">Collaborations</div>
              </Card>
              
              <Card className="bg-black/50 border-gray-700 p-4 text-center">
                <Medal className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{userStats.achievements.filter(a => a.unlockedAt).length}</div>
                <div className="text-xs text-gray-400">Achievements</div>
              </Card>
            </div>

            {/* Daily Tasks */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-bold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Daily Tasks
              </h3>
              <div className="space-y-3">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </div>
                        {task.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="text-xs text-gray-400">
                        {task.progress}/{task.max} • {task.reward} points
                      </div>
                      {!task.completed && (
                        <Progress 
                          value={(task.progress / task.max) * 100}
                          className="h-1 mt-1"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Streaks */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-bold mb-4 flex items-center">
                <Flame className="w-5 h-5 mr-2" />
                Streaks
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {userStats.streaks.map((streak) => (
                  <div key={streak.type} className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{streak.current}</div>
                    <div className="text-sm">{formatStreak(streak.type)}</div>
                    <div className="text-xs text-gray-400">Best: {streak.best}</div>
                    <Button size="sm" className="mt-2 bg-orange-500 hover:bg-orange-600">
                      Claim {streak.reward}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userStats.achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`p-4 border-2 ${getRarityColor(achievement.rarity)} ${
                  achievement.unlockedAt ? '' : 'opacity-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{achievement.title}</h3>
                      <Badge className={`text-xs ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-500' :
                        achievement.rarity === 'epic' ? 'bg-purple-500' :
                        achievement.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                    
                    {achievement.progress !== undefined && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-400 mb-1">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                        <Progress 
                          value={(achievement.progress / (achievement.maxProgress || 1)) * 100}
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-yellow-400">+{achievement.points} points</div>
                      {achievement.unlockedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onShareAchievement?.(achievement.id)}
                        >
                          Share
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            {userStats.skills.map((skill) => (
              <Card key={skill.id} className="bg-black/50 border-gray-700 p-4">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{skill.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-bold ${skill.color}`}>{skill.name}</h3>
                      <Badge className="bg-gray-700">Level {skill.level}</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2">
                      {skill.experience} / {skill.nextLevelXp} XP
                    </div>
                    
                    <Progress 
                      value={(skill.experience / skill.nextLevelXp) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{getRankIcon(userStats.rank)}</div>
              <h2 className="text-2xl font-bold">{userStats.rank} Rank</h2>
              <p className="text-gray-400">You're in the top {userStats.percentile}% of artists</p>
            </div>

            {/* Mock leaderboard */}
            <Card className="bg-black/50 border-gray-700 p-4">
              <h3 className="font-bold mb-4">This Week's Top Artists</h3>
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'FlowMaster', points: 12500, avatar: '👑' },
                  { rank: 2, name: 'BeatQueen', points: 11200, avatar: '🎵' },
                  { rank: 3, name: 'RhymeKing', points: 10800, avatar: '🎤' },
                  { rank: 4, name: 'LyricLord', points: 9600, avatar: '✨' },
                  { rank: 5, name: 'You', points: userStats.totalPoints, avatar: '🔥', isUser: true }
                ].map((artist) => (
                  <div 
                    key={artist.rank} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      artist.isUser ? 'bg-purple-500/20 border border-purple-500' : 'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{artist.avatar}</div>
                      <div>
                        <div className="font-semibold">{artist.name}</div>
                        <div className="text-sm text-gray-400">#{artist.rank}</div>
                      </div>
                    </div>
                    <div className="text-yellow-400 font-bold">{artist.points}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* New Achievement Modal */}
      <AnimatePresence>
        {newAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-center max-w-sm w-full"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
              <div className="text-4xl mb-2">{newAchievements[0].icon}</div>
              <h3 className="text-xl font-bold mb-2">{newAchievements[0].title}</h3>
              <p className="text-sm opacity-90 mb-4">{newAchievements[0].description}</p>
              <div className="text-yellow-400 font-bold mb-4">+{newAchievements[0].points} points</div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setNewAchievements([])}
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  Awesome!
                </Button>
                <Button
                  onClick={() => {
                    onShareAchievement?.(newAchievements[0].id);
                    setNewAchievements([]);
                  }}
                  variant="outline"
                  className="flex-1 border-white text-white"
                >
                  Share
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}