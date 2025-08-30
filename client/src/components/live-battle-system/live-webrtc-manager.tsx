import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Settings, 
  Users, 
  Volume2, 
  VolumeX, 
  Monitor,
  MonitorOff,
  Maximize,
  Minimize,
  MessageCircle,
  Radio,
  Disc3,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebRTCPeer {
  id: string;
  name: string;
  avatar?: string;
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  connection?: RTCPeerConnection;
  role: 'participant' | 'host' | 'judge';
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

interface BattleRoom {
  id: string;
  title: string;
  type: 'rap_battle' | 'beat_battle' | 'freestyle' | 'collaboration';
  status: 'waiting' | 'active' | 'ended';
  participants: WebRTCPeer[];
  maxParticipants: number;
  isPublic: boolean;
  timeLimit?: number;
  currentRound?: number;
  totalRounds?: number;
  activeParticipant?: string;
}

interface UseWebRTCProps {
  roomId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  onPeerJoined?: (peer: WebRTCPeer) => void;
  onPeerLeft?: (peerId: string) => void;
  onStreamReceived?: (peerId: string, stream: MediaStream) => void;
}

// Mock WebSocket for demo purposes
class MockWebSocket {
  private callbacks: { [key: string]: Function[] } = {};
  private isConnected = false;
  
  constructor(private url: string) {
    setTimeout(() => {
      this.isConnected = true;
      this.emit('open', {});
    }, 1000);
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event: string, data: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  send(data: string) {
    console.log('Sending message:', data);
    // Simulate server response
    setTimeout(() => {
      const message = JSON.parse(data);
      if (message.type === 'join-room') {
        this.emit('message', JSON.stringify({
          type: 'peer-joined',
          peerId: 'mock-peer-' + Math.random().toString(36).substr(2, 9),
          userName: 'Demo User',
          userAvatar: 'https://picsum.photos/100/100?random=' + Math.random()
        }));
      }
    }, 500);
  }

  close() {
    this.isConnected = false;
  }

  get readyState() {
    return this.isConnected ? 1 : 0; // 1 = OPEN
  }
}

function useWebRTC({ roomId, userId, userName, userAvatar, onPeerJoined, onPeerLeft, onStreamReceived }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: WebRTCPeer }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const wsRef = useRef<MockWebSocket | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const initializeLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480, frameRate: 30 } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      });
      
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          targetPeer: peerId,
          candidate: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setPeers(prev => ({
        ...prev,
        [peerId]: {
          ...prev[peerId],
          stream
        }
      }));
      onStreamReceived?.(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      setPeers(prev => ({
        ...prev,
        [peerId]: {
          ...prev[peerId],
          status: pc.connectionState === 'connected' ? 'connected' : 'connecting'
        }
      }));
    };

    peerConnectionsRef.current[peerId] = pc;
    return pc;
  }, [onStreamReceived]);

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      setConnectionStatus('connecting');
      
      // Initialize WebSocket connection
      wsRef.current = new MockWebSocket(`ws://localhost:5000/ws`);
      
      wsRef.current.on('open', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        
        wsRef.current?.send(JSON.stringify({
          type: 'join-room',
          roomId,
          userId,
          userName,
          userAvatar
        }));
      });

      wsRef.current.on('message', async (messageData: string) => {
        const message = JSON.parse(messageData);
        
        switch (message.type) {
          case 'peer-joined':
            const newPeer: WebRTCPeer = {
              id: message.peerId,
              name: message.userName,
              avatar: message.userAvatar,
              isVideoEnabled: true,
              isAudioEnabled: true,
              isScreenSharing: false,
              role: 'participant',
              status: 'connecting'
            };
            
            setPeers(prev => ({ ...prev, [message.peerId]: newPeer }));
            onPeerJoined?.(newPeer);
            break;

          case 'peer-left':
            setPeers(prev => {
              const updated = { ...prev };
              delete updated[message.peerId];
              return updated;
            });
            onPeerLeft?.(message.peerId);
            break;

          case 'offer':
            const pc = createPeerConnection(message.fromPeer);
            if (localStream) {
              localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
              });
            }
            
            await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            wsRef.current?.send(JSON.stringify({
              type: 'answer',
              targetPeer: message.fromPeer,
              answer
            }));
            break;

          case 'answer':
            const answerPc = peerConnectionsRef.current[message.fromPeer];
            if (answerPc) {
              await answerPc.setRemoteDescription(new RTCSessionDescription(message.answer));
            }
            break;

          case 'ice-candidate':
            const candidatePc = peerConnectionsRef.current[message.fromPeer];
            if (candidatePc) {
              await candidatePc.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
            break;
        }
      });

    } catch (error) {
      console.error('Error joining room:', error);
      setConnectionStatus('error');
    }
  }, [userId, userName, userAvatar, localStream, createPeerConnection, onPeerJoined, onPeerLeft]);

  const leaveRoom = useCallback(() => {
    // Close peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close WebSocket
    wsRef.current?.close();
    wsRef.current = null;

    setPeers({});
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        // Notify other peers about the change
        wsRef.current?.send(JSON.stringify({
          type: 'toggle-video',
          enabled: videoTrack.enabled
        }));
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        // Notify other peers about the change
        wsRef.current?.send(JSON.stringify({
          type: 'toggle-audio',
          enabled: audioTrack.enabled
        }));
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender && screenStream.getVideoTracks()[0]) {
          sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
      });

      // Update local stream
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.removeTrack(videoTrack);
        }
        screenStream.getVideoTracks().forEach(track => {
          localStream.addTrack(track);
        });
      }

      setLocalStream(localStream);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [localStream]);

  return {
    localStream,
    peers,
    isConnected,
    connectionStatus,
    initializeLocalStream,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    startScreenShare
  };
}

interface VideoStreamProps {
  stream?: MediaStream;
  userName: string;
  userAvatar?: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isLocal?: boolean;
  role?: string;
  status?: string;
  className?: string;
}

function VideoStream({ 
  stream, 
  userName, 
  userAvatar, 
  isMuted, 
  isVideoEnabled = true, 
  isLocal, 
  role,
  status,
  className 
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'host': return 'bg-red-500';
      case 'judge': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={cn("relative bg-dark-300 rounded-lg overflow-hidden", className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className={cn(
          "w-full h-full object-cover",
          !isVideoEnabled && "hidden"
        )}
      />

      {/* Avatar placeholder when video is off */}
      {!isVideoEnabled && (
        <div className="w-full h-full flex items-center justify-center bg-dark-400">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-electric-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      
      {/* Top Info */}
      <div className="absolute top-2 left-2 flex items-center space-x-2">
        {role && (
          <Badge className={cn("text-xs", getRoleColor(role))}>
            {role.toUpperCase()}
          </Badge>
        )}
        {status && (
          <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium text-sm truncate">{userName}</span>
          {isLocal && (
            <Badge variant="outline" className="text-xs">You</Badge>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {!isVideoEnabled && (
            <VideoOff className="w-4 h-4 text-red-500" />
          )}
          {isMuted && (
            <MicOff className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleFullscreen}
          className="p-2 bg-black/50 hover:bg-black/70"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4 text-white" />
          ) : (
            <Maximize className="w-4 h-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface RoomControlsProps {
  isConnected: boolean;
  localStream?: MediaStream;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onStartScreenShare: () => void;
  connectionStatus: string;
}

function RoomControls({
  isConnected,
  localStream,
  onJoinRoom,
  onLeaveRoom,
  onToggleVideo,
  onToggleAudio,
  onStartScreenShare,
  connectionStatus
}: RoomControlsProps) {
  const isVideoEnabled = localStream?.getVideoTracks()[0]?.enabled ?? false;
  const isAudioEnabled = localStream?.getAudioTracks()[0]?.enabled ?? false;

  return (
    <Card className="bg-dark-200 border-dark-400">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-white capitalize">{connectionStatus}</span>
            </div>
            
            {isConnected && (
              <Badge variant="outline" className="text-xs">
                Live
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {!isConnected ? (
              <Button 
                onClick={onJoinRoom}
                className="bg-electric-500 hover:bg-electric-600"
              >
                <Radio className="w-4 h-4 mr-2" />
                Join Battle
              </Button>
            ) : (
              <>
                <Button
                  variant={isVideoEnabled ? "default" : "destructive"}
                  size="sm"
                  onClick={onToggleVideo}
                >
                  {isVideoEnabled ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant={isAudioEnabled ? "default" : "destructive"}
                  size="sm"
                  onClick={onToggleAudio}
                >
                  {isAudioEnabled ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartScreenShare}
                >
                  <Monitor className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onLeaveRoom}
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LiveBattleRoomProps {
  room: BattleRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

export default function LiveBattleRoom({ 
  room, 
  currentUserId, 
  currentUserName, 
  currentUserAvatar 
}: LiveBattleRoomProps) {
  const [hasInitialized, setHasInitialized] = useState(false);

  const {
    localStream,
    peers,
    isConnected,
    connectionStatus,
    initializeLocalStream,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    startScreenShare
  } = useWebRTC({
    roomId: room.id,
    userId: currentUserId,
    userName: currentUserName,
    userAvatar: currentUserAvatar,
    onPeerJoined: (peer) => console.log('Peer joined:', peer),
    onPeerLeft: (peerId) => console.log('Peer left:', peerId),
    onStreamReceived: (peerId, stream) => console.log('Stream received from:', peerId)
  });

  const handleJoinRoom = async () => {
    try {
      if (!hasInitialized) {
        await initializeLocalStream(true, true);
        setHasInitialized(true);
      }
      await joinRoom(room.id);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const peerList = Object.values(peers);
  const totalParticipants = peerList.length + (isConnected ? 1 : 0);

  return (
    <div className="min-h-screen bg-dark-100 p-4 space-y-4">
      {/* Room Header */}
      <Card className="bg-dark-200 border-dark-400">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center space-x-2">
                <Disc3 className="w-5 h-5 text-electric-500" />
                <span>{room.title}</span>
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                {totalParticipants}/{room.maxParticipants} participants • {room.type.replace('_', ' ')}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={cn(
                room.status === 'active' ? "bg-green-500" :
                room.status === 'waiting' ? "bg-yellow-500" : "bg-gray-500"
              )}>
                {room.status.toUpperCase()}
              </Badge>
              
              {room.currentRound && room.totalRounds && (
                <Badge variant="outline">
                  Round {room.currentRound}/{room.totalRounds}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Local Stream */}
        {isConnected && localStream && (
          <VideoStream
            stream={localStream}
            userName={currentUserName}
            userAvatar={currentUserAvatar}
            isLocal={true}
            role="participant"
            status="connected"
            isVideoEnabled={localStream.getVideoTracks()[0]?.enabled}
            isMuted={!localStream.getAudioTracks()[0]?.enabled}
            className="aspect-video"
          />
        )}

        {/* Peer Streams */}
        {peerList.map((peer) => (
          <VideoStream
            key={peer.id}
            stream={peer.stream}
            userName={peer.name}
            userAvatar={peer.avatar}
            role={peer.role}
            status={peer.status}
            isVideoEnabled={peer.isVideoEnabled}
            isMuted={!peer.isAudioEnabled}
            className="aspect-video"
          />
        ))}

        {/* Empty Slots */}
        {Array.from({ length: Math.max(0, room.maxParticipants - totalParticipants) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-video bg-dark-300 rounded-lg border-2 border-dashed border-dark-400 flex items-center justify-center"
          >
            <div className="text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Waiting for participant</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <RoomControls
        isConnected={isConnected}
        localStream={localStream || undefined}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={leaveRoom}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onStartScreenShare={startScreenShare}
        connectionStatus={connectionStatus}
      />

      {/* Chat Panel - Minimized for now */}
      <Card className="bg-dark-200 border-dark-400">
        <CardHeader className="py-3">
          <CardTitle className="text-sm text-white flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Live Chat ({peerList.length} online)
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

// Demo component with mock data
export function LiveBattleRoomDemo() {
  const mockRoom: BattleRoom = {
    id: 'battle-room-1',
    title: 'Friday Night Rap Battle',
    type: 'rap_battle',
    status: 'waiting',
    participants: [],
    maxParticipants: 6,
    isPublic: true,
    timeLimit: 120,
    currentRound: 1,
    totalRounds: 3
  };

  return (
    <LiveBattleRoom
      room={mockRoom}
      currentUserId="current-user"
      currentUserName="Demo User"
      currentUserAvatar="https://picsum.photos/100/100?random=demo"
    />
  );
}
