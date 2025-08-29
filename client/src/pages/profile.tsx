import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Track, type Beat, type Battle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Music, 
  Users, 
  Trophy, 
  Heart, 
  Play, 
  Settings,
  Share,
  Edit
} from "lucide-react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("tracks");

  // Mock user data - in real app, get from auth context
  const user = {
    id: "current-user-id",
    username: "mcthunder",
    displayName: "MC Thunder",
    role: "artist" as const,
    bio: "Bringing lightning to the mic. Born and raised in the streets, speaking truth through rhythm.",
    avatar: "",
    followers: 15420,
    following: 892,
    location: "New York, NY"
  };

  const { data: userTracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks", { artist: user.id }],
  });

  const { data: userBeats, isLoading: beatsLoading } = useQuery<Beat[]>({
    queryKey: ["/api/beats", { producer: user.id }],
  });

  const { data: userBattles, isLoading: battlesLoading } = useQuery<Battle[]>({
    queryKey: ["/api/battles", { user: user.id }],
  });

  const stats = [
    { label: "Total Plays", value: "2.1M", icon: Play },
    { label: "Likes", value: "847K", icon: Heart },
    { label: "Collaborations", value: "23", icon: Users },
    { label: "Battle Wins", value: "18", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="bg-dark-200 border-dark-400 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-electric-500 rounded-full flex items-center justify-center text-4xl font-bold text-white">
                {user.displayName.split(' ').map(n => n[0]).join('')}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1" data-testid="profile-display-name">
                      {user.displayName}
                    </h1>
                    <p className="text-gray-400" data-testid="profile-username">@{user.username}</p>
                    <Badge 
                      variant="outline" 
                      className="border-purple-500 text-purple-500 mt-2"
                      data-testid="profile-role"
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="md:ml-auto flex gap-3">
                    <Button 
                      variant="outline"
                      className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                      data-testid="button-share-profile"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                      data-testid="button-edit-profile"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                <p className="text-gray-400 mb-4 max-w-2xl" data-testid="profile-bio">
                  {user.bio}
                </p>

                {/* Follower Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="font-bold text-white" data-testid="follower-count">
                      {user.followers.toLocaleString()}
                    </span>
                    <span className="text-gray-400 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-white" data-testid="following-count">
                      {user.following.toLocaleString()}
                    </span>
                    <span className="text-gray-400 ml-1">Following</span>
                  </div>
                  <div className="text-gray-400" data-testid="profile-location">
                    📍 {user.location}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="bg-dark-200 border-dark-400">
              <CardContent className="p-4 text-center">
                <stat.icon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm" data-testid={`stat-label-${index}`}>
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-dark-200 border-dark-400 mb-6">
            <TabsTrigger 
              value="tracks" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              data-testid="tab-tracks"
            >
              <Music className="w-4 h-4 mr-2" />
              Tracks
            </TabsTrigger>
            {(['producer', 'artist'] as const).includes(user.role as any) && (
              <TabsTrigger 
                value="beats" 
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                data-testid="tab-beats"
              >
                Beats
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="battles" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              data-testid="tab-battles"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Battles
            </TabsTrigger>
            <TabsTrigger 
              value="collaborations" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              data-testid="tab-collaborations"
            >
              <Users className="w-4 h-4 mr-2" />
              Collabs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks">
            {tracksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-dark-200 border-dark-400">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userTracks && userTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTracks.map((track) => (
                  <Card key={track.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
                    <div className="aspect-video bg-dark-400 rounded-t-lg flex items-center justify-center">
                      <Music className="h-12 w-12 text-gray-400" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-2" data-testid={`track-title-${track.id}`}>
                        {track.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <span>👁 {track.plays?.toLocaleString()}</span>
                        <span>❤️ {track.likes?.toLocaleString()}</span>
                      </div>
                      <Button 
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                        data-testid={`button-play-${track.id}`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No tracks yet</h3>
                <p className="text-gray-500 mb-6">Upload your first track to get started</p>
                <Button 
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                  data-testid="button-upload-track"
                >
                  Upload Track
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="beats">
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No beats available</h3>
              <p className="text-gray-500">Beat production coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="battles">
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No battles yet</h3>
              <p className="text-gray-500 mb-6">Join your first rap battle</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                data-testid="button-join-battle"
              >
                Join Battle
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="collaborations">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No collaborations yet</h3>
              <p className="text-gray-500 mb-6">Start collaborating with other artists</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                data-testid="button-start-collab"
              >
                Start Collaboration
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
