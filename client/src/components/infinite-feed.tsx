import { useState, useEffect, useRef, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { useQuery } from "@tanstack/react-query";
import { type Track } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageCircle, Share, MoreVertical, 
  Play, Pause, VolumeX, Volume2, Users,
  Flame, Crown, Mic, TrendingUp, Music
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedItem {
  id: string;
  type: 'live-stream' | 'battle' | 'beat-session' | 'collaboration';
  artist: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  title: string;
  description: string;
  thumbnail: string;
  viewerCount: number;
  likes: number;
  isLiked: boolean;
  duration?: number;
  tags: string[];
  beat?: {
    id: string;
    name: string;
    producer: string;
    bpm: number;
    genre: string;
  };
  battle?: {
    contestant1: string;
    contestant2: string;
    votes1: number;
    votes2: number;
    timeLeft: number;
  };
  isPlaying: boolean;
  isMuted: boolean;
}

interface InfiniteFeedProps {
  onNavigateToCreate?: () => void;
  onNavigateToProfile?: () => void;
  onJoinStream?: (streamId: string) => void;
}

export default function InfiniteFeed({ 
  onNavigateToCreate, 
  onNavigateToProfile,
  onJoinStream 
}: InfiniteFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState<{ id: string; x: number; y: number }[]>([]);
  const [comments, setComments] = useState<{ id: string; text: string; user: string; timestamp: number }[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Real feed data from API
  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: battles = [] } = useQuery<any[]>({
    queryKey: ["/api/battles/active"],
  });

  const convertToFeedItems = useCallback((): FeedItem[] => {
    const feedItems: FeedItem[] = [];
    
    // Convert tracks to feed items
    tracks.forEach((track, i) => {
      feedItems.push({
        id: track.id,
        type: track.isCollaborative ? 'collaboration' : 'live-stream',
        artist: {
          id: track.artistId || 'unknown',
          username: track.artistName || 'Anonymous',
          avatar: '🎤',
          isVerified: false
        },
        title: track.title,
        description: `${track.genre || 'Music'} track by ${track.artistName}`,
        thumbnail: track.coverImage || '/api/placeholder/400/600?text=Music',
        viewerCount: track.plays || 0,
        likes: track.likes || 0,
        isLiked: false, // TODO: Connect to user preferences
        tags: track.genre ? [track.genre] : ['music'],
        isPlaying: i === 0,
        isMuted: false
      });
    });

    // Convert battles to feed items
    battles.forEach((battle, i) => {
      feedItems.push({
        id: battle.id,
        type: 'battle',
        artist: {
          id: battle.contestant1Id || 'unknown',
          username: battle.contestant1Name || 'Contestant',
          avatar: '🔥',
          isVerified: false
        },
        title: battle.title || 'Live Rap Battle 🔥',
        description: `${battle.contestant1Name} vs ${battle.contestant2Name}`,
        thumbnail: '/api/placeholder/400/600?text=Battle',
        viewerCount: battle.totalVotes || 0,
        likes: battle.totalVotes || 0,
        isLiked: false,
        tags: ['battle', 'live', 'rap'],
        battle: {
          contestant1: battle.contestant1Name,
          contestant2: battle.contestant2Name,
          votes1: battle.contestant1Votes || 0,
          votes2: battle.contestant2Votes || 0,
          timeLeft: 120 // TODO: Calculate from battle time
        },
        isPlaying: false,
        isMuted: false
      });
    });

    return feedItems;
  }, [tracks, battles]);

  // Initialize feed
  useEffect(() => {
    const feed = convertToFeedItems();
    setFeedItems(feed);
    setLoading(false);
  }, [convertToFeedItems]);

  // Swipe handlers for navigation
  const handlers = useSwipeable({
    onSwipedUp: () => navigateToNext(),
    onSwipedDown: () => navigateToPrevious(),
    onSwipedLeft: () => onNavigateToCreate?.(),
    onSwipedRight: () => onNavigateToProfile?.(),
    trackMouse: true
  });

  const navigateToNext = useCallback(() => {
    if (currentIndex < feedItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Load more content
      const newItems = convertToFeedItems();
      setFeedItems(prev => [...prev, ...newItems]);
    }
  }, [currentIndex, feedItems.length, convertToFeedItems]);

  const navigateToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Auto-play management
  useEffect(() => {
    setFeedItems(prev => prev.map((item, index) => ({
      ...item,
      isPlaying: index === currentIndex
    })));
  }, [currentIndex]);

  // Handle double tap to like
  const handleDoubleTap = useCallback((event: React.MouseEvent, itemId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Add heart animation
    const heartId = `heart-${Date.now()}`;
    setHearts(prev => [...prev, { id: heartId, x, y }]);
    
    // Remove heart after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1000);

    // Toggle like
    setFeedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
  }, []);

  // Toggle audio
  const toggleAudio = useCallback((itemId: string) => {
    setFeedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isMuted: !item.isMuted } : item
    ));
  }, []);

  // Add comment
  const addComment = useCallback(() => {
    if (newComment.trim()) {
      setComments(prev => [...prev, {
        id: `comment-${Date.now()}`,
        text: newComment,
        user: 'You',
        timestamp: Date.now()
      }]);
      setNewComment('');
    }
  }, [newComment]);

  const currentItem = feedItems[currentIndex];

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading feed...</div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full bg-black overflow-hidden relative"
      {...handlers}
      ref={containerRef}
    >
      {/* Feed Items */}
      <AnimatePresence mode="wait">
        {currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {/* Background Video/Stream */}
            <div 
              className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-black relative cursor-pointer"
              onDoubleClick={(e) => handleDoubleTap(e, currentItem.id)}
            >
              {/* Mock video background */}
              <div className="absolute inset-0 bg-cover bg-center opacity-20"
                   style={{ backgroundImage: `url(${currentItem.thumbnail})` }} />
              
              {/* Stream overlay content */}
              <div className="absolute inset-0 flex">
                {/* Main content area */}
                <div className="flex-1 relative">
                  {/* Top indicators */}
                  <div className="absolute top-4 left-4 right-20 z-10">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-red-500 text-white px-3 py-1">
                        🔴 LIVE
                      </Badge>
                      <div className="flex items-center space-x-2 text-white text-sm">
                        <Users className="w-4 h-4" />
                        <span>{currentItem.viewerCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center content based on type */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {currentItem.type === 'battle' && currentItem.battle && (
                      <div className="text-center text-white space-y-4">
                        <div className="text-3xl font-bold">RAP BATTLE</div>
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{currentItem.battle.contestant1}</div>
                            <div className="text-2xl font-bold text-blue-400">{currentItem.battle.votes1}</div>
                          </div>
                          <div className="text-4xl">VS</div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{currentItem.battle.contestant2}</div>
                            <div className="text-2xl font-bold text-red-400">{currentItem.battle.votes2}</div>
                          </div>
                        </div>
                        <div className="text-lg">Time Left: {Math.floor(currentItem.battle.timeLeft / 60)}:{(currentItem.battle.timeLeft % 60).toString().padStart(2, '0')}</div>
                      </div>
                    )}

                    {currentItem.type === 'beat-session' && currentItem.beat && (
                      <div className="text-center text-white space-y-4">
                        <Music className="w-16 h-16 mx-auto text-purple-400" />
                        <div className="text-2xl font-bold">{currentItem.beat.name}</div>
                        <div className="text-lg">by {currentItem.beat.producer}</div>
                        <div className="flex items-center justify-center space-x-4 text-sm">
                          <span>{currentItem.beat.bpm} BPM</span>
                          <span>•</span>
                          <span>{currentItem.beat.genre}</span>
                        </div>
                      </div>
                    )}

                    {(currentItem.type === 'live-stream' || currentItem.type === 'collaboration') && (
                      <div className="text-center text-white space-y-4">
                        <div className="text-2xl font-bold">{currentItem.title}</div>
                        <div className="text-lg">{currentItem.description}</div>
                      </div>
                    )}
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-4 left-4 right-20 z-10">
                    <div className="text-white space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-2xl">{currentItem.artist.avatar}</div>
                        <div>
                          <div className="font-semibold flex items-center space-x-1">
                            <span>{currentItem.artist.username}</span>
                            {currentItem.artist.isVerified && <Crown className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <div className="text-sm text-gray-300">{currentItem.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {currentItem.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Audio toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-4 right-24 text-white bg-black/50 rounded-full"
                    onClick={() => toggleAudio(currentItem.id)}
                  >
                    {currentItem.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                </div>

                {/* Right sidebar actions */}
                <div className="w-16 flex flex-col items-center justify-end pb-20 space-y-6">
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white bg-black/50 rounded-full mb-1 relative"
                      onClick={(e) => handleDoubleTap(e, currentItem.id)}
                    >
                      <Heart className={`w-6 h-6 ${currentItem.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <div className="text-white text-xs">{currentItem.likes.toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white bg-black/50 rounded-full mb-1"
                      onClick={() => setShowComments(true)}
                    >
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                    <div className="text-white text-xs">{comments.length}</div>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white bg-black/50 rounded-full mb-1"
                    >
                      <Share className="w-6 h-6" />
                    </Button>
                  </div>

                  {currentItem.type === 'battle' && (
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white bg-red-500/80 rounded-full mb-1"
                      >
                        <Flame className="w-6 h-6" />
                      </Button>
                      <div className="text-white text-xs">Vote</div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/50 rounded-full"
                    onClick={() => onJoinStream?.(currentItem.id)}
                  >
                    <Mic className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {/* Floating hearts animation */}
              <AnimatePresence>
                {hearts.map(heart => (
                  <motion.div
                    key={heart.id}
                    initial={{ scale: 0, x: heart.x, y: heart.y }}
                    animate={{ 
                      scale: [0, 1.2, 1], 
                      y: heart.y - 100,
                      opacity: [1, 1, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute pointer-events-none z-50"
                  >
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation hints */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white/50 text-xs">
        ← Profile
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/50 text-xs">
        Create →
      </div>
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white/50 text-xs">
        ↑ Next
      </div>

      {/* Comments overlay */}
      {showComments && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={() => setShowComments(false)}
        >
          <div className="absolute right-0 top-0 w-80 h-full bg-dark-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Comments</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowComments(false)}
                className="text-white"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="text-white text-sm">
                  <span className="font-semibold text-purple-400">{comment.user}</span>
                  <span className="ml-2">{comment.text}</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-dark-300 text-white px-3 py-2 rounded"
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
              />
              <Button onClick={addComment} className="bg-purple-500">
                Send
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}