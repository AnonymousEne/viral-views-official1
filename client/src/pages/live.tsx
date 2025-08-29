import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AudioStreamer from "@/components/audio-streamer";
import VideoStreamer from "@/components/video-streamer";
import WebRTCManager from "@/components/webrtc-manager";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Video, 
  Mic, 
  Users, 
  Clock, 
  Calendar,
  Radio,
  VideoOff,
  MicOff,
  Settings,
  Share
} from "lucide-react";

export default function Live() {
  const { user } = useAuth();
  const { joinRoom, leaveRoom, isConnected } = useWebSocket();
  const [isLive, setIsLive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [viewerCount, setViewerCount] = useState(0);

  const liveStreams = [
    {
      id: "1",
      title: "Freestyle Friday: Open Cypher Session",
      streamer: "ViralViews",
      viewers: 2300,
      category: "Freestyle",
      thumbnail: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=450"
    },
    {
      id: "2",
      title: "Beat Making Session - Trap Vibes",
      streamer: "BeatMaster",
      viewers: 892,
      category: "Production",
      thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=450"
    },
    {
      id: "3",
      title: "Late Night Rap Battle Tournament",
      streamer: "BattleZone",
      viewers: 1456,
      category: "Battle",
      thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=450"
    }
  ];

  const scheduledEvents = [
    {
      id: "1",
      title: "Weekly Producer Showcase",
      time: "Today 8:00 PM",
      participants: 25,
      category: "Showcase"
    },
    {
      id: "2",
      title: "Collaboration Thursday",
      time: "Tomorrow 6:00 PM",
      participants: 18,
      category: "Collab"
    },
    {
      id: "3",
      title: "Championship Battle Finals",
      time: "Saturday 9:00 PM",
      participants: 500,
      category: "Battle"
    }
  ];

  const handleGoLive = () => {
    const newRoomId = `live-${user?.id}-${Date.now()}`;
    setRoomId(newRoomId);
    setIsLive(true);
    
    // Join WebSocket room for live streaming
    if (user) {
      joinRoom(newRoomId, user.displayName || user.username || 'Anonymous', true);
    }
  };

  const handleEndStream = () => {
    setIsLive(false);
    setViewerCount(0);
    leaveRoom();
    
    // Stop all streams
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const handleAudioStreamStart = (stream: MediaStream) => {
    setAudioStream(stream);
    setIsAudioOn(true);
  };

  const handleVideoStreamStart = (stream: MediaStream) => {
    setVideoStream(stream);
    setIsVideoOn(true);
  };

  const handleAudioStreamEnd = () => {
    setAudioStream(null);
    setIsAudioOn(false);
  };

  const handleVideoStreamEnd = () => {
    setVideoStream(null);
    setIsVideoOn(false);
  };

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-red-500 animate-pulse">🔴 LIVE</span> RAP BATTLES
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Start a live freestyle battle or cipher with real-time audio streaming
          </p>
        </div>

        {/* Live Stream Controls */}
        <Card className="bg-dark-200 border-dark-400 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center">
              <Video className="mr-3" />
              Your Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isLive ? (
              <div className="text-center py-12">
                <div className="w-32 h-32 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Mic className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Ready to battle?</h3>
                <p className="text-gray-400 mb-6">Start live audio streaming for freestyle battles</p>
                <Button 
                  onClick={handleGoLive}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 text-lg animate-pulse"
                  data-testid="button-go-live"
                >
                  <Radio className="mr-2" />
                  START BATTLE STREAM
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Live Video Stream */}
                <div className="bg-dark-400 rounded-xl overflow-hidden">
                  <VideoStreamer
                    isStreaming={isLive}
                    onStreamStart={handleVideoStreamStart}
                    onStreamEnd={handleVideoStreamEnd}
                    quality="high"
                    roomId={roomId}
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                      🔴 LIVE
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black bg-opacity-60 text-white">
                      👁 {viewerCount} viewers
                    </Badge>
                  </div>
                </div>

                {/* Audio Stream Controls */}
                <AudioStreamer
                  isStreaming={isLive}
                  onStreamStart={handleAudioStreamStart}
                  onStreamEnd={handleAudioStreamEnd}
                  quality="high"
                  roomId={roomId}
                />

                {/* WebRTC Manager for Peer Connections */}
                {isLive && roomId && user && (
                  <WebRTCManager
                    roomId={roomId}
                    username={user.displayName || user.username || 'Anonymous'}
                    isHost={true}
                    enableAudio={isAudioOn}
                    enableVideo={isVideoOn}
                    onPeerJoined={(peerId) => setViewerCount(prev => prev + 1)}
                    onPeerLeft={(peerId) => setViewerCount(prev => Math.max(0, prev - 1))}
                  />
                )}

                {/* Stream Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={isVideoOn ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsVideoOn(!isVideoOn)}
                      className={isVideoOn ? "bg-green-500 hover:bg-green-600" : "border-red-500 text-red-500"}
                      data-testid="button-toggle-video"
                    >
                      {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant={isAudioOn ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsAudioOn(!isAudioOn)}
                      className={isAudioOn ? "bg-green-500 hover:bg-green-600" : "border-red-500 text-red-500"}
                      data-testid="button-toggle-audio"
                    >
                      {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle quality settings for stream
                        const newQuality = audioStream ? 'ultra' : 'high';
                        console.log('Adjusting stream quality to:', newQuality);
                      }}
                      className="border-dark-400 text-gray-400 hover:text-white"
                      data-testid="button-stream-settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (navigator.share && roomId) {
                          navigator.share({
                            title: 'Live Rap Battle',
                            text: 'Join my live rap battle!',
                            url: `${window.location.origin}/live/${roomId}`
                          });
                        } else {
                          navigator.clipboard.writeText(`${window.location.origin}/live/${roomId}`);
                          console.log('Stream link copied to clipboard');
                        }
                      }}
                      className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                      data-testid="button-share-stream"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      onClick={handleEndStream}
                      variant="destructive"
                      className="bg-red-500 hover:bg-red-600"
                      data-testid="button-end-stream"
                    >
                      End Stream
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Streams */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Live Now</h2>
            <div className="space-y-6">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors cursor-pointer">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <img 
                          src={stream.thumbnail} 
                          alt={stream.title}
                          className="w-full h-32 md:h-full object-cover rounded-l-lg"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                            LIVE
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="bg-black bg-opacity-60 text-white text-xs">
                            👁 {stream.viewers.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 p-4">
                        <h3 className="text-lg font-bold text-white mb-2" data-testid={`stream-title-${stream.id}`}>
                          {stream.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3" data-testid={`stream-streamer-${stream.id}`}>
                          by {stream.streamer}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className="border-purple-500 text-purple-500"
                            data-testid={`stream-category-${stream.id}`}
                          >
                            {stream.category}
                          </Badge>
                          <Button 
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            data-testid={`button-watch-${stream.id}`}
                          >
                            Watch
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Scheduled Events */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Scheduled Events</h2>
            <div className="space-y-4">
              {scheduledEvents.map((event) => (
                <Card key={event.id} className="bg-dark-200 border-dark-400">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-white mb-2" data-testid={`event-title-${event.id}`}>
                      {event.title}
                    </h4>
                    <div className="flex items-center text-gray-400 text-sm mb-2">
                      <Clock className="w-4 h-4 mr-1" />
                      <span data-testid={`event-time-${event.id}`}>{event.time}</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm mb-3">
                      <Users className="w-4 h-4 mr-1" />
                      <span data-testid={`event-participants-${event.id}`}>{event.participants} interested</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="border-success-500 text-success-500"
                        data-testid={`event-category-${event.id}`}
                      >
                        {event.category}
                      </Badge>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                        data-testid={`button-remind-${event.id}`}
                      >
                        Remind Me
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Start */}
            <Card className="bg-dark-200 border-dark-400 mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-electric-500 hover:from-purple-600 hover:to-electric-600 text-white justify-start"
                  data-testid="button-start-cypher"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Cypher Session
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white justify-start"
                  data-testid="button-host-battle"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Host Battle Event
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-success-500 text-success-500 hover:bg-success-500 hover:text-white justify-start"
                  data-testid="button-schedule-collab"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Collaboration
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
