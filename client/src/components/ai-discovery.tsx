import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Brain, TrendingUp, Clock, Heart, Users, 
  Star, Zap, Music, Headphones, Play,
  ThumbsUp, ThumbsDown, Shuffle, Target,
  Sparkles, Filter, Search, MoreHorizontal
} from "lucide-react";

interface AIRecommendation {
  id: string;
  type: 'track' | 'artist' | 'beat' | 'collaboration' | 'battle';
  title: string;
  artist: string;
  thumbnail: string;
  confidence: number;
  reason: string;
  tags: string[];
  metadata: {
    duration?: number;
    bpm?: number;
    genre?: string;
    mood?: string;
    energy?: number;
    danceability?: number;
    valence?: number;
  };
  engagement: {
    likes: number;
    views: number;
    shares: number;
  };
  isLiked: boolean;
  isPlaying: boolean;
}

interface TrendingTopic {
  id: string;
  name: string;
  type: 'hashtag' | 'challenge' | 'genre' | 'mood';
  growth: number;
  posts: number;
  participants: number;
  description: string;
}

interface UserPreferences {
  genres: string[];
  moods: string[];
  bpmRange: [number, number];
  energy: number;
  danceability: number;
  valence: number;
  discovery: number; // How adventurous the user wants recommendations
}

interface AIDiscoveryProps {
  onRecommendationInteraction?: (id: string, action: 'like' | 'dislike' | 'play' | 'share') => void;
  onPreferencesUpdate?: (preferences: UserPreferences) => void;
  className?: string;
}

export default function AIDiscovery({
  onRecommendationInteraction,
  onPreferencesUpdate,
  className = ""
}: AIDiscoveryProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    genres: ['Hip-Hop', 'Trap'],
    moods: ['Energetic', 'Dark'],
    bpmRange: [80, 160],
    energy: 75,
    danceability: 65,
    valence: 50,
    discovery: 60
  });
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'discovery' | 'preferences'>('for-you');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Mock AI recommendations
  const generateRecommendations = useCallback((): AIRecommendation[] => {
    const reasons = [
      "Based on your love for energetic trap beats",
      "Similar artists you've liked recently",
      "Trending in your area right now",
      "Perfect for your current mood",
      "Matches your recent listening patterns",
      "Popular with artists you follow",
      "Rising artist in your favorite genre",
      "Recommended by AI based on your activity"
    ];

    const genres = ['Hip-Hop', 'Trap', 'Drill', 'R&B', 'Pop', 'Afrobeats', 'Lo-Fi'];
    const moods = ['Energetic', 'Chill', 'Dark', 'Uplifting', 'Aggressive', 'Romantic', 'Atmospheric'];

    return Array.from({ length: 20 }, (_, i) => ({
      id: `rec-${i}`,
      type: ['track', 'artist', 'beat', 'collaboration', 'battle'][Math.floor(Math.random() * 5)] as AIRecommendation['type'],
      title: `Recommendation ${i + 1}`,
      artist: `Artist${i + 1}`,
      thumbnail: `/api/placeholder/300/300?text=Rec${i}`,
      confidence: 70 + Math.random() * 30,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      tags: ['ai-pick', 'trending', 'new', 'hot'].slice(0, Math.floor(Math.random() * 3) + 1),
      metadata: {
        duration: 120 + Math.random() * 180,
        bpm: 80 + Math.random() * 80,
        genre: genres[Math.floor(Math.random() * genres.length)],
        mood: moods[Math.floor(Math.random() * moods.length)],
        energy: Math.random() * 100,
        danceability: Math.random() * 100,
        valence: Math.random() * 100
      },
      engagement: {
        likes: Math.floor(Math.random() * 10000),
        views: Math.floor(Math.random() * 100000),
        shares: Math.floor(Math.random() * 1000)
      },
      isLiked: Math.random() > 0.7,
      isPlaying: false
    }));
  }, []);

  // Mock trending topics
  const generateTrendingTopics = useCallback((): TrendingTopic[] => {
    return [
      {
        id: 'drill-beats',
        name: '#DrillBeats',
        type: 'hashtag',
        growth: 156,
        posts: 45670,
        participants: 8234,
        description: 'UK Drill beats are taking over the platform'
      },
      {
        id: 'freestyle-friday',
        name: '#FreestyleFriday',
        type: 'challenge',
        growth: 89,
        posts: 12340,
        participants: 5670,
        description: 'Weekly freestyle challenge trending globally'
      },
      {
        id: 'afrobeats-fusion',
        name: 'Afrobeats Fusion',
        type: 'genre',
        growth: 234,
        posts: 23450,
        participants: 12340,
        description: 'Afrobeats mixed with hip-hop is exploding'
      },
      {
        id: 'late-night-vibes',
        name: 'Late Night Vibes',
        type: 'mood',
        growth: 67,
        posts: 34560,
        participants: 15670,
        description: 'Chill, atmospheric tracks for night sessions'
      }
    ];
  }, []);

  useEffect(() => {
    setRecommendations(generateRecommendations());
    setTrendingTopics(generateTrendingTopics());
  }, [generateRecommendations, generateTrendingTopics]);

  // Handle recommendation interactions
  const handleInteraction = useCallback((id: string, action: 'like' | 'dislike' | 'play' | 'share') => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? {
        ...rec,
        isLiked: action === 'like' ? !rec.isLiked : rec.isLiked,
        isPlaying: action === 'play' ? !rec.isPlaying : rec.isPlaying
      } : rec
    ));
    
    onRecommendationInteraction?.(id, action);
  }, [onRecommendationInteraction]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRecommendations(generateRecommendations());
      setIsRefreshing(false);
    }, 1000);
  }, [generateRecommendations]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    onPreferencesUpdate?.(updated);
  }, [preferences, onPreferencesUpdate]);

  const getTypeIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'track': return '🎵';
      case 'artist': return '🎤';
      case 'beat': return '🥁';
      case 'collaboration': return '🤝';
      case 'battle': return '⚔️';
      default: return '🎶';
    }
  };

  const getTypeColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'track': return 'bg-blue-500';
      case 'artist': return 'bg-purple-500';
      case 'beat': return 'bg-green-500';
      case 'collaboration': return 'bg-orange-500';
      case 'battle': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">AI Discovery</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={refreshRecommendations}
              variant="ghost"
              size="icon"
              className="text-white"
              disabled={isRefreshing}
            >
              <Shuffle className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'for-you', label: 'For You', icon: Target },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'discovery', label: 'Discovery', icon: Sparkles },
          { id: 'preferences', label: 'Tune AI', icon: Brain }
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
        {activeTab === 'for-you' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Handpicked for You</h2>
              <p className="text-gray-400">AI-curated content based on your taste and activity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.slice(0, 10).map((rec) => (
                <Card key={rec.id} className="bg-black/50 border-gray-700 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={rec.thumbnail} 
                      alt={rec.title}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        onClick={() => handleInteraction(rec.id, 'play')}
                        size="icon"
                        className="bg-white/20 hover:bg-white/30 rounded-full"
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* Type badge */}
                    <Badge className={`absolute top-2 left-2 ${getTypeColor(rec.type)}`}>
                      <span className="mr-1">{getTypeIcon(rec.type)}</span>
                      {rec.type}
                    </Badge>

                    {/* AI confidence */}
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                      🤖 {Math.round(rec.confidence)}%
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold truncate">{rec.title}</h3>
                        <p className="text-sm text-gray-400">by {rec.artist}</p>
                      </div>
                    </div>

                    <p className="text-xs text-purple-400 mb-3">{rec.reason}</p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <div className="flex items-center space-x-3">
                        {rec.metadata.bpm && <span>{rec.metadata.bpm} BPM</span>}
                        {rec.metadata.genre && <span>{rec.metadata.genre}</span>}
                        {rec.metadata.mood && <span>{rec.metadata.mood}</span>}
                      </div>
                    </div>

                    {/* Audio features */}
                    {rec.metadata.energy !== undefined && (
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Energy</span>
                          <span>{Math.round(rec.metadata.energy)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-green-500 h-1 rounded-full"
                            style={{ width: `${rec.metadata.energy}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Heart className="w-3 h-3" />
                        <span>{rec.engagement.likes.toLocaleString()}</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleInteraction(rec.id, 'like')}
                          variant="ghost"
                          size="icon"
                          className={`w-8 h-8 ${rec.isLiked ? 'text-red-500' : 'text-gray-400'}`}
                        >
                          <Heart className={`w-4 h-4 ${rec.isLiked ? 'fill-current' : ''}`} />
                        </Button>
                        
                        <Button
                          onClick={() => handleInteraction(rec.id, 'dislike')}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          onClick={() => handleInteraction(rec.id, 'share')}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">What's Trending</h2>
              <p className="text-gray-400">Hot topics and viral content right now</p>
            </div>

            {/* Trending Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {trendingTopics.map((topic) => (
                <Card key={topic.id} className="bg-black/50 border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{topic.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{topic.description}</p>
                    </div>
                    <Badge className="bg-green-500 ml-2">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{topic.growth}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-bold text-white">{topic.posts.toLocaleString()}</div>
                      <div className="text-gray-400">Posts</div>
                    </div>
                    <div>
                      <div className="font-bold text-white">{topic.participants.toLocaleString()}</div>
                      <div className="text-gray-400">Artists</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-400">+{topic.growth}%</div>
                      <div className="text-gray-400">Growth</div>
                    </div>
                  </div>

                  <Button className="w-full mt-4 bg-purple-500 hover:bg-purple-600">
                    Explore
                  </Button>
                </Card>
              ))}
            </div>

            {/* Trending Content */}
            <div>
              <h3 className="text-lg font-bold mb-4">Trending Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.filter(r => r.tags.includes('trending')).slice(0, 6).map((rec) => (
                  <Card key={rec.id} className="bg-black/50 border-gray-700 overflow-hidden">
                    <img 
                      src={rec.thumbnail} 
                      alt={rec.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                      <p className="text-xs text-gray-400">by {rec.artist}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>Trending</span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-white p-1">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discovery' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Discover New Music</h2>
              <p className="text-gray-400">Explore beyond your comfort zone</p>
            </div>

            {/* Discovery Controls */}
            <Card className="bg-black/50 border-gray-700 p-4 mb-6">
              <h3 className="font-semibold mb-4">Discovery Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Adventure Level</label>
                  <Slider
                    value={[preferences.discovery]}
                    onValueChange={(value) => updatePreferences({ discovery: value[0] })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Safe</span>
                    <span>Adventurous</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Discovery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.filter(r => r.confidence < 70).map((rec) => (
                <Card key={rec.id} className="bg-black/50 border-gray-700 overflow-hidden">
                  <img 
                    src={rec.thumbnail} 
                    alt={rec.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Discovery
                      </Badge>
                      <span className="text-xs text-yellow-400">
                        {Math.round(rec.confidence)}% match
                      </span>
                    </div>
                    
                    <h3 className="font-bold truncate">{rec.title}</h3>
                    <p className="text-sm text-gray-400">by {rec.artist}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <Button
                        onClick={() => handleInteraction(rec.id, 'play')}
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Try It
                      </Button>
                      
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => handleInteraction(rec.id, 'like')}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleInteraction(rec.id, 'dislike')}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Tune Your AI</h2>
              <p className="text-gray-400">Help AI understand your taste better</p>
            </div>

            {/* Audio Preferences */}
            <Card className="bg-black/50 border-gray-700 p-6">
              <h3 className="font-semibold mb-4">Audio Preferences</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Energy Level</label>
                  <Slider
                    value={[preferences.energy]}
                    onValueChange={(value) => updatePreferences({ energy: value[0] })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{preferences.energy}% energy</div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Danceability</label>
                  <Slider
                    value={[preferences.danceability]}
                    onValueChange={(value) => updatePreferences({ danceability: value[0] })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{preferences.danceability}% danceability</div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Mood (Valence)</label>
                  <Slider
                    value={[preferences.valence]}
                    onValueChange={(value) => updatePreferences({ valence: value[0] })}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Sad/Dark</span>
                    <span>Happy/Uplifting</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">BPM Range</label>
                  <Slider
                    value={preferences.bpmRange}
                    onValueChange={(value) => updatePreferences({ bpmRange: value as [number, number] })}
                    max={200}
                    min={60}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {preferences.bpmRange[0]} - {preferences.bpmRange[1]} BPM
                  </div>
                </div>
              </div>
            </Card>

            {/* Genre Preferences */}
            <Card className="bg-black/50 border-gray-700 p-6">
              <h3 className="font-semibold mb-4">Favorite Genres</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Hip-Hop', 'Trap', 'Drill', 'R&B', 'Pop', 'Afrobeats', 'Lo-Fi', 'Jazz', 'Rock'].map((genre) => (
                  <Button
                    key={genre}
                    onClick={() => {
                      const isSelected = preferences.genres.includes(genre);
                      updatePreferences({
                        genres: isSelected 
                          ? preferences.genres.filter(g => g !== genre)
                          : [...preferences.genres, genre]
                      });
                    }}
                    variant={preferences.genres.includes(genre) ? "default" : "outline"}
                    className="text-sm"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Save Preferences */}
            <Button 
              onClick={() => refreshRecommendations()}
              className="w-full bg-purple-500 hover:bg-purple-600"
              size="lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              Update AI Recommendations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}