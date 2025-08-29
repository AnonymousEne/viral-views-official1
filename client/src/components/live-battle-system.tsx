import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AudioStreamer from "@/components/audio-streamer";
import WebRTCManager from "@/components/webrtc-manager";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Crown, Flame, Users, Timer, Mic, MicOff,
  Volume2, VolumeX, ThumbsUp, ThumbsDown,
  Star, Trophy, Medal, Zap, Target, Sword
} from "lucide-react";

interface Contestant {
  id: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  votes: number;
  isCurrentTurn: boolean;
  streak: number;
  rating: number;
}

interface Battle {
  id: string;
  title: string;
  type: 'freestyle' | 'cypher' | 'tournament' | 'challenge';
  status: 'waiting' | 'active' | 'voting' | 'completed';
  contestant1: Contestant;
  contestant2: Contestant;
  timeLeft: number;
  totalTime: number;
  viewerCount: number;
  prize: number;
  round: number;
  maxRounds: number;
  beat?: {
    id: string;
    name: string;
    bpm: number;
  };
}

interface LiveBattleSystemProps {
  battle?: Battle;
  onVote?: (contestantId: string) => void;
  onJoinBattle?: () => void;
  onLeaveBattle?: () => void;
  isParticipating?: boolean;
  className?: string;
}

export default function LiveBattleSystem({
  battle,
  onVote,
  onJoinBattle,
  onLeaveBattle,
  isParticipating = false,
  className = ""
}: LiveBattleSystemProps) {
  const { user } = useAuth();
  const { joinRoom, leaveRoom, castVote } = useWebSocket();
  
  // Audio streaming state
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [battleRoomId, setBattleRoomId] = useState<string>("");
  
  // Default battle data
  const defaultBattle: Battle = {
    id: 'live-battle-1',
    title: 'Epic Rap Battle: Fire vs Ice',
    type: 'freestyle',
    status: 'active',
    contestant1: {
      id: 'mc-fire',
      username: 'MC_Fire',
      avatar: '/api/placeholder/100/100?text=🔥',
      isVerified: true,
      votes: 234,
      isCurrentTurn: true,
      streak: 5,
      rating: 1850
    },
    contestant2: {
      id: 'ice-cold',
      username: 'IceCold_Beats',
      avatar: '/api/placeholder/100/100?text=❄️',
      isVerified: false,
      votes: 187,
      isCurrentTurn: false,
      streak: 3,
      rating: 1720
    },
    timeLeft: 45,
    totalTime: 60,
    viewerCount: 1247,
    prize: 500,
    round: 2,
    maxRounds: 3,
    beat: {
      id: 'battle-beat-1',
      name: 'Heavy Artillery',
      bpm: 140
    }
  };

  const currentBattle = battle || defaultBattle;
  
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(currentBattle.timeLeft);
  const [showVotingResults, setShowVotingResults] = useState(false);
  const [battleEffects, setBattleEffects] = useState<{ id: string; type: string; x: number; y: number }[]>([]);

  const battleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Battle timer
  useEffect(() => {
    if (currentBattle.status === 'active') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up, switch to voting
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentBattle.status]);

  // Handle voting
  const handleVote = useCallback((contestantId: string) => {
    if (hasVoted || currentBattle.status !== 'voting') return;
    
    setHasVoted(true);
    setVotedFor(contestantId);
    onVote?.(contestantId);

    // Send real-time vote via WebSocket
    if (user) {
      castVote(currentBattle.id, contestantId);
    }

    // Add visual effect
    const container = battleRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const effect = {
        id: `vote-${Date.now()}`,
        type: 'vote',
        x: Math.random() * rect.width,
        y: Math.random() * rect.height
      };
      setBattleEffects(prev => [...prev, effect]);
      
      setTimeout(() => {
        setBattleEffects(prev => prev.filter(e => e.id !== effect.id));
      }, 2000);
    }
  }, [hasVoted, currentBattle.status, onVote, user, castVote, currentBattle.id]);

  // Handle joining battle with audio streaming
  const handleJoinBattle = () => {
    if (user && currentBattle) {
      const roomId = `battle-${currentBattle.id}`;
      setBattleRoomId(roomId);
      joinRoom(roomId, user.displayName || user.username || 'Anonymous', false);
      onJoinBattle?.();
    }
  };
  
  // Handle leaving battle
  const handleLeaveBattle = () => {
    leaveRoom();
    setAudioStream(null);
    setBattleRoomId("");
    onLeaveBattle?.();
  };
  
  // Audio stream handlers
  const handleAudioStreamStart = (stream: MediaStream) => {
    setAudioStream(stream);
    setIsAudioEnabled(true);
  };
  
  const handleAudioStreamEnd = () => {
    setAudioStream(null);
    setIsAudioEnabled(false);
  };

  // Calculate vote percentages
  const totalVotes = currentBattle.contestant1.votes + currentBattle.contestant2.votes;
  const contestant1Percentage = totalVotes > 0 ? (currentBattle.contestant1.votes / totalVotes) * 100 : 50;
  const contestant2Percentage = totalVotes > 0 ? (currentBattle.contestant2.votes / totalVotes) * 100 : 50;

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={battleRef}
      className={`relative w-full h-full bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 ${className}`}
    >
      {/* Battle background effects */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Floating battle effects */}
      <AnimatePresence>
        {battleEffects.map(effect => (
          <motion.div
            key={effect.id}
            initial={{ scale: 0, x: effect.x, y: effect.y, opacity: 1 }}
            animate={{ 
              scale: [0, 1.5, 1],
              y: effect.y - 100,
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute pointer-events-none z-30"
          >
            {effect.type === 'vote' && (
              <div className="text-yellow-400">
                <Star className="w-8 h-8 fill-current" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-500 text-white px-3 py-1 animate-pulse">
              🔴 LIVE BATTLE
            </Badge>
            <Badge variant="outline" className="text-white border-white">
              Round {currentBattle.round}/{currentBattle.maxRounds}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{currentBattle.viewerCount.toLocaleString()}</span>
            </div>
            {currentBattle.prize > 0 && (
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>${currentBattle.prize}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contestants */}
      <div className="absolute inset-0 flex items-center">
        {/* Contestant 1 */}
        <div className="flex-1 text-center text-white relative">
          <motion.div
            animate={currentBattle.contestant1.isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`relative ${currentBattle.contestant1.isCurrentTurn ? 'ring-4 ring-blue-500 rounded-full' : ''}`}
          >
            <div className="text-6xl mb-4">{currentBattle.contestant1.avatar}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl font-bold">{currentBattle.contestant1.username}</span>
                {currentBattle.contestant1.isVerified && <Crown className="w-5 h-5 text-yellow-400" />}
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4" />
                  <span>{currentBattle.contestant1.streak} streak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{currentBattle.contestant1.rating}</span>
                </div>
              </div>

              {/* Vote count */}
              <div className="mt-4">
                <div className="text-3xl font-bold text-blue-400">{currentBattle.contestant1.votes}</div>
                <div className="text-sm text-gray-300">votes</div>
                <div className="mt-2 bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${contestant1Percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Vote button */}
          {currentBattle.status === 'voting' && (
            <Button
              onClick={() => handleVote(currentBattle.contestant1.id)}
              disabled={hasVoted}
              className={`mt-4 ${
                votedFor === currentBattle.contestant1.id 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } ${hasVoted && votedFor !== currentBattle.contestant1.id ? 'opacity-50' : ''}`}
              size="lg"
            >
              {votedFor === currentBattle.contestant1.id ? (
                <>
                  <Star className="w-5 h-5 mr-2 fill-current" />
                  Voted!
                </>
              ) : (
                <>
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Vote
                </>
              )}
            </Button>
          )}
        </div>

        {/* VS and Timer */}
        <div className="w-32 text-center text-white">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl font-bold mb-4 text-transparent bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text"
          >
            VS
          </motion.div>

          {/* Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <Timer className="w-5 h-5" />
              <span className="text-xl font-mono">{formatTime(timeRemaining)}</span>
            </div>
            
            <Progress 
              value={(timeRemaining / currentBattle.totalTime) * 100}
              className="w-20 h-2 mx-auto"
            />

            <div className="text-xs text-gray-300">
              {currentBattle.status === 'active' ? 'Battle Time' : 
               currentBattle.status === 'voting' ? 'Voting Time' : 
               currentBattle.status === 'waiting' ? 'Starting Soon' : 'Complete'}
            </div>
          </div>

          {/* Beat info */}
          {currentBattle.beat && (
            <div className="mt-4 text-xs text-gray-300">
              <div className="flex items-center justify-center space-x-1">
                <Volume2 className="w-3 h-3" />
                <span>{currentBattle.beat.name}</span>
              </div>
              <div>{currentBattle.beat.bpm} BPM</div>
            </div>
          )}
        </div>

        {/* Contestant 2 */}
        <div className="flex-1 text-center text-white relative">
          <motion.div
            animate={currentBattle.contestant2.isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={`relative ${currentBattle.contestant2.isCurrentTurn ? 'ring-4 ring-red-500 rounded-full' : ''}`}
          >
            <div className="text-6xl mb-4">{currentBattle.contestant2.avatar}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl font-bold">{currentBattle.contestant2.username}</span>
                {currentBattle.contestant2.isVerified && <Crown className="w-5 h-5 text-yellow-400" />}
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4" />
                  <span>{currentBattle.contestant2.streak} streak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{currentBattle.contestant2.rating}</span>
                </div>
              </div>

              {/* Vote count */}
              <div className="mt-4">
                <div className="text-3xl font-bold text-red-400">{currentBattle.contestant2.votes}</div>
                <div className="text-sm text-gray-300">votes</div>
                <div className="mt-2 bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="bg-red-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${contestant2Percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Vote button */}
          {currentBattle.status === 'voting' && (
            <Button
              onClick={() => handleVote(currentBattle.contestant2.id)}
              disabled={hasVoted}
              className={`mt-4 ${
                votedFor === currentBattle.contestant2.id 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-red-500 hover:bg-red-600'
              } ${hasVoted && votedFor !== currentBattle.contestant2.id ? 'opacity-50' : ''}`}
              size="lg"
            >
              {votedFor === currentBattle.contestant2.id ? (
                <>
                  <Star className="w-5 h-5 mr-2 fill-current" />
                  Voted!
                </>
              ) : (
                <>
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Vote
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Audio streaming for participants */}
      {isParticipating && battleRoomId && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <AudioStreamer
            isStreaming={true}
            onStreamStart={handleAudioStreamStart}
            onStreamEnd={handleAudioStreamEnd}
            quality="medium"
            roomId={battleRoomId}
          />
          
          {/* WebRTC for peer connections */}
          {user && (
            <WebRTCManager
              roomId={battleRoomId}
              username={user.displayName || user.username || 'Anonymous'}
              isHost={false}
              enableAudio={isAudioEnabled}
              enableVideo={false}
              maxPeers={2}
            />
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="flex items-center justify-between">
          {!isParticipating ? (
            <Button
              onClick={handleJoinBattle}
              className="bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Join Battle
            </Button>
          ) : (
            <Button
              onClick={handleLeaveBattle}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              size="lg"
            >
              <MicOff className="w-5 h-5 mr-2" />
              Leave
            </Button>
          )}

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`text-white border-white ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              disabled={!isParticipating}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon" className="text-white border-white">
              <Target className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status overlay */}
      <AnimatePresence>
        {currentBattle.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-30"
          >
            <div className="text-center text-white">
              <Sword className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <div className="text-2xl font-bold mb-2">Battle Starting Soon</div>
              <div className="text-gray-300">Waiting for contestants...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Battle notification component
export function BattleNotification({ 
  battle, 
  onJoin, 
  onDismiss 
}: { 
  battle: Battle; 
  onJoin: () => void; 
  onDismiss: () => void; 
}) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-red-600 to-purple-600 text-white p-4 rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sword className="w-6 h-6" />
          <div>
            <div className="font-bold">Live Battle Starting!</div>
            <div className="text-sm opacity-90">
              {battle.contestant1.username} vs {battle.contestant2.username}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={onJoin} size="sm" className="bg-white text-black hover:bg-gray-100">
            Join
          </Button>
          <Button onClick={onDismiss} size="sm" variant="ghost" className="text-white">
            ×
          </Button>
        </div>
      </div>
    </motion.div>
  );
}