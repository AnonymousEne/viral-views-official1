import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageCircle, Share, Gift, Star,
  Flame, Crown, Zap, Music, ThumbsUp,
  Smile, Angry
} from "lucide-react";

interface FloatingReaction {
  id: string;
  type: 'heart' | 'fire' | 'crown' | 'zap' | 'music';
  x: number;
  y: number;
  color: string;
  size: number;
}

interface FloatingComment {
  id: string;
  text: string;
  user: string;
  avatar: string;
  timestamp: number;
  x: number;
  y: number;
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  value: number;
  animation: string;
}

interface SocialInteractionsProps {
  streamId: string;
  onLike?: () => void;
  onComment?: (comment: string) => void;
  onShare?: () => void;
  onGift?: (giftId: string) => void;
  className?: string;
}

export default function SocialInteractions({
  streamId,
  onLike,
  onComment,
  onShare,
  onGift,
  className = ""
}: SocialInteractionsProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [comments, setComments] = useState<FloatingComment[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Gift options
  const gifts: Gift[] = [
    { id: 'rose', name: 'Rose', icon: '🌹', value: 1, animation: 'pulse' },
    { id: 'star', name: 'Star', icon: '⭐', value: 5, animation: 'spin' },
    { id: 'fire', name: 'Fire', icon: '🔥', value: 10, animation: 'bounce' },
    { id: 'crown', name: 'Crown', icon: '👑', value: 25, animation: 'glow' },
    { id: 'diamond', name: 'Diamond', icon: '💎', value: 50, animation: 'sparkle' },
    { id: 'rocket', name: 'Rocket', icon: '🚀', value: 100, animation: 'rocket' }
  ];

  // Emoji reactions
  const emojiReactions = [
    { id: 'heart', icon: '❤️', color: 'text-red-500' },
    { id: 'fire', icon: '🔥', color: 'text-orange-500' },
    { id: 'laugh', icon: '😂', color: 'text-yellow-500' },
    { id: 'wow', icon: '😮', color: 'text-blue-500' },
    { id: 'crown', icon: '👑', color: 'text-yellow-400' },
    { id: 'clap', icon: '👏', color: 'text-green-500' }
  ];

  // Add floating reaction
  const addReaction = useCallback((type: FloatingReaction['type'], event?: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event ? event.clientX - rect.left : Math.random() * rect.width;
    const y = event ? event.clientY - rect.top : rect.height - 100;

    const colors = {
      heart: 'text-red-500',
      fire: 'text-orange-500',
      crown: 'text-yellow-400',
      zap: 'text-blue-500',
      music: 'text-purple-500'
    };

    const reactionId = `reaction-${Date.now()}-${Math.random()}`;
    const newReaction: FloatingReaction = {
      id: reactionId,
      type,
      x,
      y,
      color: colors[type],
      size: 24 + Math.random() * 16
    };

    setReactions(prev => [...prev, newReaction]);

    // Remove after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 3000);
  }, []);

  // Add floating comment
  const addFloatingComment = useCallback((text: string) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const commentId = `comment-${Date.now()}-${Math.random()}`;
    
    const newComment: FloatingComment = {
      id: commentId,
      text,
      user: 'You', // Would come from user context
      avatar: '👤',
      timestamp: Date.now(),
      x: Math.random() * (rect.width - 200),
      y: rect.height - 150
    };

    setComments(prev => [...prev, newComment]);

    // Remove after animation
    setTimeout(() => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }, 5000);
  }, []);

  // Handle like
  const handleLike = useCallback((event?: React.MouseEvent) => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    addReaction('heart', event);
    onLike?.();
  }, [isLiked, addReaction, onLike]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(() => {
    if (commentText.trim()) {
      addFloatingComment(commentText);
      onComment?.(commentText);
      setCommentText('');
    }
  }, [commentText, addFloatingComment, onComment]);

  // Handle gift sending
  const handleGiftSend = useCallback((gift: Gift) => {
    // Create special gift animation
    const container = containerRef.current;
    if (!container) return;

    // Add gift reaction
    addReaction('crown');
    onGift?.(gift.id);
    setShowGifts(false);

    // Show gift notification
    console.log(`Sent ${gift.name} worth ${gift.value} coins`);
  }, [addReaction, onGift]);

  // Render reaction icon
  const renderReactionIcon = (type: FloatingReaction['type']) => {
    const iconMap = {
      heart: Heart,
      fire: Flame,
      crown: Crown,
      zap: Zap,
      music: Music
    };
    
    const IconComponent = iconMap[type];
    return <IconComponent className="w-full h-full" />;
  };

  // Auto-generate reactions
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const types: FloatingReaction['type'][] = ['heart', 'fire', 'crown', 'zap', 'music'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        addReaction(randomType);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [addReaction]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-full w-full ${className}`}
    >
      {/* Floating Reactions */}
      <AnimatePresence>
        {reactions.map(reaction => (
          <motion.div
            key={reaction.id}
            initial={{ 
              scale: 0,
              x: reaction.x,
              y: reaction.y,
              opacity: 1
            }}
            animate={{ 
              scale: [0, 1.2, 1],
              y: reaction.y - 200,
              x: reaction.x + (Math.random() - 0.5) * 100,
              opacity: [1, 1, 0],
              rotate: (Math.random() - 0.5) * 360
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 3,
              ease: "easeOut"
            }}
            className={`absolute pointer-events-none z-50 ${reaction.color}`}
            style={{ 
              width: reaction.size, 
              height: reaction.size 
            }}
          >
            {renderReactionIcon(reaction.type)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Comments */}
      <AnimatePresence>
        {comments.map(comment => (
          <motion.div
            key={comment.id}
            initial={{ 
              x: comment.x,
              y: comment.y,
              opacity: 0,
              scale: 0.8
            }}
            animate={{ 
              y: comment.y - 100,
              opacity: [0, 1, 1, 0],
              scale: 1
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 5,
              ease: "easeOut"
            }}
            className="absolute z-40 pointer-events-none"
          >
            <div className="bg-black/80 text-white px-3 py-2 rounded-full text-sm max-w-48 backdrop-blur-sm">
              <span className="font-semibold text-purple-400">{comment.user}: </span>
              <span>{comment.text}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Action Buttons Overlay */}
      <div className="absolute bottom-20 right-4 z-30 space-y-4">
        {/* Like Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 rounded-full backdrop-blur-sm transition-all ${
              isLiked 
                ? 'bg-red-500/80 text-white scale-110' 
                : 'bg-black/50 text-white hover:bg-red-500/30'
            }`}
            onClick={handleLike}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <div className="text-white text-xs mt-1">{likeCount}</div>
        </div>

        {/* Comment Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-blue-500/30"
            onClick={() => setShowEmojis(!showEmojis)}
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <div className="text-white text-xs mt-1">Chat</div>
        </div>

        {/* Gift Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-yellow-500/30"
            onClick={() => setShowGifts(!showGifts)}
          >
            <Gift className="w-6 h-6" />
          </Button>
          <div className="text-white text-xs mt-1">Gift</div>
        </div>

        {/* Share Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-green-500/30"
            onClick={onShare}
          >
            <Share className="w-6 h-6" />
          </Button>
          <div className="text-white text-xs mt-1">Share</div>
        </div>
      </div>

      {/* Quick Emoji Reactions */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute bottom-20 right-20 z-40"
          >
            <div className="flex flex-col space-y-2">
              {emojiReactions.map(emoji => (
                <Button
                  key={emoji.id}
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm hover:scale-110 transition-transform"
                  onClick={(e) => {
                    addReaction(emoji.id as FloatingReaction['type'], e);
                    setShowEmojis(false);
                  }}
                >
                  <span className="text-lg">{emoji.icon}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Panel */}
      <AnimatePresence>
        {showGifts && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm p-4"
          >
            <div className="text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Send a Gift</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowGifts(false)}
                  className="text-white"
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {gifts.map(gift => (
                  <Button
                    key={gift.id}
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto border-gray-600 hover:border-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => handleGiftSend(gift)}
                  >
                    <span className="text-2xl mb-2">{gift.icon}</span>
                    <span className="text-sm font-medium">{gift.name}</span>
                    <span className="text-xs text-yellow-400">{gift.value} coins</span>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Input */}
      <div className="absolute bottom-4 left-4 right-20 z-30">
        <div className="flex space-x-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
            maxLength={100}
          />
          <Button
            onClick={handleCommentSubmit}
            className="bg-purple-500 hover:bg-purple-600 rounded-full px-6"
            disabled={!commentText.trim()}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Live Activity Indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div className="flex items-center space-x-2 text-white text-sm bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>Live reactions</span>
        </div>
      </div>
    </div>
  );
}

// Hook to trigger reactions from external components
export function useSocialInteractions() {
  const triggerReaction = useCallback((type: string) => {
    window.dispatchEvent(new CustomEvent('trigger-reaction', { 
      detail: { type } 
    }));
  }, []);

  const triggerComment = useCallback((text: string) => {
    window.dispatchEvent(new CustomEvent('trigger-comment', { 
      detail: { text } 
    }));
  }, []);

  return { triggerReaction, triggerComment };
}