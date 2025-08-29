import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Trophy, Users, Music4, TrendingUp, Play, Plus } from 'lucide-react';
import { Link } from 'wouter';
import TrackList from '@/components/tracks/track-list';
import BattleList from '@/components/battles/battle-list';
import BeatList from '@/components/beats/beat-list';
import CollaborationList from '@/components/collaborations/collaboration-list';

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-4">Please log in to access the dashboard</h2>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.displayName}!
              </h1>
              <p className="text-gray-400">
                Ready to create some viral music? Let's get started.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-purple-500 text-white">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-400">Followers</p>
                <p className="font-semibold">{user.followers?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-dark-200 border-dark-400">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Music className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Tracks</p>
                    <p className="text-xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-dark-400">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-gold-400" />
                  <div>
                    <p className="text-sm text-gray-400">Battles Won</p>
                    <p className="text-xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-dark-400">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Collaborations</p>
                    <p className="text-xl font-bold">5</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-dark-400">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Plays</p>
                    <p className="text-xl font-bold">2.5K</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {user.role === 'artist' && (
              <>
                <Card className="bg-gradient-to-br from-purple-500/20 to-electric-500/20 border-purple-400/30 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Music className="w-8 h-8 text-purple-400" />
                      <h3 className="font-semibold">Upload Track</h3>
                      <p className="text-sm text-gray-400">Share your latest creation</p>
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                        <Plus className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gold-400/20 to-gold-600/20 border-gold-400/30 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Trophy className="w-8 h-8 text-gold-400" />
                      <h3 className="font-semibold">Start Battle</h3>
                      <p className="text-sm text-gray-400">Challenge another artist</p>
                      <Button size="sm" className="bg-gold-500 hover:bg-gold-600 text-black">
                        <Plus className="w-3 h-3 mr-1" />
                        Battle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {user.role === 'producer' && (
              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Music4 className="w-8 h-8 text-green-400" />
                    <h3 className="font-semibold">List Beat</h3>
                    <p className="text-sm text-gray-400">Sell your beats to artists</p>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      <Plus className="w-3 h-3 mr-1" />
                      List
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <h3 className="font-semibold">Collaborate</h3>
                  <p className="text-sm text-gray-400">Work with other artists</p>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="w-3 h-3 mr-1" />
                    Invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-12">
          {/* Tracks Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Music className="w-6 h-6 mr-3 text-purple-400" />
                Recent Tracks
              </h2>
              <Link href="/tracks">
                <Button variant="outline">View All Tracks</Button>
              </Link>
            </div>
            <TrackList />
          </section>

          {/* Active Battles Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Trophy className="w-6 h-6 mr-3 text-gold-400" />
                Live Battles
              </h2>
              <Link href="/battles">
                <Button variant="outline">View All Battles</Button>
              </Link>
            </div>
            <BattleList />
          </section>

          {/* Beat Marketplace Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Music4 className="w-6 h-6 mr-3 text-gold-400" />
                Beat Marketplace
              </h2>
              <Link href="/beats">
                <Button variant="outline">Browse All Beats</Button>
              </Link>
            </div>
            <BeatList />
          </section>

          {/* Collaborations Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Users className="w-6 h-6 mr-3 text-purple-400" />
                Your Collaborations
              </h2>
              <Link href="/collaborations">
                <Button variant="outline">View All Collaborations</Button>
              </Link>
            </div>
            <CollaborationList />
          </section>
        </div>
      </div>
    </div>
  );
}