import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Track } from "@shared/schema";
import VideoCard from "@/components/video-card";
import BattleCard from "@/components/battle-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [contentFilter, setContentFilter] = useState<'all' | 'battles' | 'freestyles' | 'collaborations'>('all');
  
  const { data: tracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: battles = [], isLoading: battlesLoading } = useQuery<any[]>({
    queryKey: ["/api/battles/active"],
  });

  // Filter tracks based on selected content type
  const filteredTracks = tracks?.filter(track => {
    if (contentFilter === 'all') return true;
    if (contentFilter === 'battles') return track.genre === 'battle' || track.isCollaborative;
    if (contentFilter === 'freestyles') return track.genre === 'freestyle';
    if (contentFilter === 'collaborations') return track.isCollaborative;
    return true;
  });

  return (
    <div className="min-h-screen bg-dark-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="text-red-500">LIVE</span> RAP BATTLES
              <span className="bg-gradient-to-r from-purple-500 via-electric-500 to-success-500 bg-clip-text text-transparent block">
                & CIPHERS
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Stream live rap battles, freestyle ciphers, and real-time music collaboration. Battle opponents with live audio streaming.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/live">
                <Button 
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all animate-pulse"
                  data-testid="button-go-live-now"
                >
                  🔴 GO LIVE NOW - RAP BATTLES
                </Button>
              </Link>
              <Link href="/battles">
                <Button 
                  variant="outline"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white px-8 py-4 text-lg font-bold"
                  data-testid="button-join-cipher"
                >
                  Join Cipher
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="bg-dark-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <div className="flex space-x-4">
              <Button 
                className={`font-medium ${contentFilter === 'battles' ? 'bg-purple-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                onClick={() => setContentFilter('battles')}
                data-testid="filter-battles"
              >
                Battles
              </Button>
              <Button 
                className={`font-medium ${contentFilter === 'freestyles' ? 'bg-purple-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                onClick={() => setContentFilter('freestyles')}
                data-testid="filter-freestyles"
              >
                Freestyles
              </Button>
              <Button 
                className={`font-medium ${contentFilter === 'collaborations' ? 'bg-purple-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                onClick={() => setContentFilter('collaborations')}
                data-testid="filter-collaborations"
              >
                Collaborations
              </Button>
              <Button 
                className={`font-medium ${contentFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                onClick={() => setContentFilter('all')}
                data-testid="filter-all"
              >
                All
              </Button>
            </div>
          </div>

          {tracksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-dark-300 rounded-xl overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTracks?.slice(0, 6).map((track) => (
                <VideoCard key={track.id} track={track} />
              ))}
              {filteredTracks?.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-400 text-lg">No {contentFilter === 'all' ? 'content' : contentFilter} found</p>
                  <Link href="/live">
                    <Button className="mt-4 bg-red-500 hover:bg-red-600 text-white">
                      🔴 Start Live Battle
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Battle */}
      {!battlesLoading && battles && battles.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Epic Rap Battle</h2>
              <p className="text-gray-400 text-xl">Vote for your favorite and join the ultimate competition</p>
            </div>
            <BattleCard battle={battles[0]} featured={true} />
          </div>
        </section>
      )}
    </div>
  );
}
