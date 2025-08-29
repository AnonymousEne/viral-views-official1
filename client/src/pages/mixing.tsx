import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Track } from "@shared/schema";
import MixingInterface from "@/components/mixing-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Music, Users, Mic } from "lucide-react";

export default function Mixing() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const collaborativeTracks = tracks?.filter(track => track.isCollaborative) || [];

  if (selectedProject) {
    return <MixingInterface projectId={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Collaborative <span className="text-purple-500">Studio</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Mix tracks, layer vocals, and create music together in real-time
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-electric-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Start New Project</h3>
              <p className="text-gray-400">Create a collaborative track from scratch</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Record Layer</h3>
              <p className="text-gray-400">Add your vocals to existing tracks</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-highlight-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Music className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload Beat</h3>
              <p className="text-gray-400">Share your beats for collaboration</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Collaborations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Active Collaborations</h2>
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="button-view-all-collaborations"
            >
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-dark-200 border-dark-400">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex items-center space-x-2 mb-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collaborativeTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collaborativeTracks.map((track) => (
                <Card key={track.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2" data-testid={`track-title-${track.id}`}>
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4" data-testid={`track-artist-${track.id}`}>
                      by {track.artistName}
                    </p>
                    
                    {/* Collaborators */}
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(3, track.collaborators?.length || 0))].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-8 bg-gradient-to-br from-purple-500 to-electric-500 rounded-full border-2 border-dark-200"
                          ></div>
                        ))}
                        {(track.collaborators?.length || 0) > 3 && (
                          <div className="w-8 h-8 bg-dark-400 rounded-full border-2 border-dark-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">+{(track.collaborators?.length || 0) - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-electric-500 hover:from-purple-600 hover:to-electric-600 text-white"
                      onClick={() => setSelectedProject(track.id)}
                      data-testid={`button-join-${track.id}`}
                    >
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-dark-200 rounded-xl">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Active Collaborations</h3>
              <p className="text-gray-500 mb-6">Start a new project and invite artists to collaborate</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                data-testid="button-start-collaboration"
              >
                Start Collaboration
              </Button>
            </div>
          )}
        </div>

        {/* Featured Collaboration */}
        <Card className="bg-dark-200 border-dark-400">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Open Collaboration: "City Lights Cypher"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-gray-400 mb-4">
                Join this community track where artists worldwide are adding their unique layers
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-400 mb-6">
                <span><Music className="h-4 w-4 inline mr-1" />Hip-Hop Beat</span>
                <span><Users className="h-4 w-4 inline mr-1" />12 Collaborators</span>
                <span>🎵 120 BPM</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-success-500 hover:bg-success-600 text-white font-bold"
                onClick={() => setSelectedProject("community-cypher")}
                data-testid="button-join-cypher"
              >
                Join Cypher
              </Button>
              <Button 
                variant="outline"
                className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-bold"
                data-testid="button-listen-preview"
              >
                Listen to Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
