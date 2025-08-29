import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PermissionGuide from "@/components/permission-guide";
import { 
  Users, Wifi, WifiOff, Settings, PhoneCall, PhoneOff,
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff
} from "lucide-react";

interface Peer {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  username?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

interface WebRTCManagerProps {
  roomId: string;
  username: string;
  isHost?: boolean;
  onPeerJoined?: (peerId: string, username?: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onStreamReceived?: (peerId: string, stream: MediaStream) => void;
  enableAudio?: boolean;
  enableVideo?: boolean;
  enableScreenShare?: boolean;
  maxPeers?: number;
}

export default function WebRTCManager({
  roomId,
  username,
  isHost = false,
  onPeerJoined,
  onPeerLeft,
  onStreamReceived,
  enableAudio = true,
  enableVideo = true,
  enableScreenShare = true,
  maxPeers = 8
}: WebRTCManagerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      // Join room
      wsRef.current?.send(JSON.stringify({
        type: 'join-room',
        roomId,
        username,
        isHost
      }));
    };

    wsRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await handleWebSocketMessage(message);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Connection to the room was lost.",
        variant: "destructive"
      });
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the room.",
        variant: "destructive"
      });
    };
  }, [roomId, username, isHost, toast]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(async (message: any) => {
    switch (message.type) {
      case 'room-joined':
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Connected",
          description: `Joined room ${roomId} successfully.`
        });
        break;

      case 'peer-joined':
        await createPeerConnection(message.peerId, message.username, true);
        onPeerJoined?.(message.peerId, message.username);
        break;

      case 'peer-left':
        removePeer(message.peerId);
        onPeerLeft?.(message.peerId);
        break;

      case 'offer':
        await handleOffer(message.peerId, message.offer);
        break;

      case 'answer':
        await handleAnswer(message.peerId, message.answer);
        break;

      case 'ice-candidate':
        await handleIceCandidate(message.peerId, message.candidate);
        break;

      case 'peer-media-state':
        updatePeerMediaState(message.peerId, message.audioEnabled, message.videoEnabled, message.screenSharing);
        break;
    }
  }, [roomId, onPeerJoined, onPeerLeft, toast]);

  // Create peer connection
  const createPeerConnection = useCallback(async (peerId: string, peerUsername?: string, isInitiator = false) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    const peer: Peer = {
      id: peerId,
      connection: peerConnection,
      username: peerUsername,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false
    };

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', peerId);
      peer.stream = event.streams[0];
      onStreamReceived?.(peerId, event.streams[0]);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          peerId,
          candidate: event.candidate
        }));
      }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, peerConnection.connectionState);
      updateConnectionQuality();
    };

    setPeers(prev => new Map(prev.set(peerId, peer)));

    // Create offer if initiator
    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        peerId,
        offer
      }));
    }

    return peer;
  }, [localStream, onStreamReceived]);

  // Handle offer
  const handleOffer = useCallback(async (peerId: string, offer: RTCSessionDescriptionInit) => {
    const peer = peers.get(peerId) || await createPeerConnection(peerId, undefined, false);
    
    await peer.connection.setRemoteDescription(offer);
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);
    
    wsRef.current?.send(JSON.stringify({
      type: 'answer',
      peerId,
      answer
    }));
  }, [peers, createPeerConnection]);

  // Handle answer
  const handleAnswer = useCallback(async (peerId: string, answer: RTCSessionDescriptionInit) => {
    const peer = peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }, [peers]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit) => {
    const peer = peers.get(peerId);
    if (peer) {
      await peer.connection.addIceCandidate(candidate);
    }
  }, [peers]);

  // Remove peer
  const removePeer = useCallback((peerId: string) => {
    const peer = peers.get(peerId);
    if (peer) {
      peer.connection.close();
      setPeers(prev => {
        const newPeers = new Map(prev);
        newPeers.delete(peerId);
        return newPeers;
      });
    }
  }, [peers]);

  // Update peer media state
  const updatePeerMediaState = useCallback((peerId: string, audioEnabled: boolean, videoEnabled: boolean, screenSharing: boolean) => {
    setPeers(prev => {
      const newPeers = new Map(prev);
      const peer = newPeers.get(peerId);
      if (peer) {
        peer.isAudioEnabled = audioEnabled;
        peer.isVideoEnabled = videoEnabled;
        peer.isScreenSharing = screenSharing;
      }
      return newPeers;
    });
  }, []);

  // Update connection quality
  const updateConnectionQuality = useCallback(() => {
    // Simplified quality assessment based on peer connections
    const connectedPeers = Array.from(peers.values()).filter(
      peer => peer.connection.connectionState === 'connected'
    );
    
    if (connectedPeers.length === peers.size) {
      setConnectionQuality('excellent');
    } else if (connectedPeers.length >= peers.size * 0.75) {
      setConnectionQuality('good');
    } else if (connectedPeers.length >= peers.size * 0.5) {
      setConnectionQuality('fair');
    } else {
      setConnectionQuality('poor');
    }
  }, [peers]);

  // Get user media
  const getUserMedia = useCallback(async () => {
    try {
      // Check if at least one of audio or video is enabled
      if (!enableAudio && !enableVideo) {
        console.log('Neither audio nor video enabled, skipping getUserMedia');
        return null;
      }

      const constraints = {
        audio: enableAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: enableVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      console.log('User media access granted:', {
        audio: enableAudio,
        video: enableVideo,
        tracks: stream.getTracks().length
      });

      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      
      let errorMessage = "Failed to access camera/microphone.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Please allow camera and microphone access to join the room.";
          setShowPermissionGuide(true); // Show permission guide
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera or microphone found on your device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera or microphone is already in use by another application.";
        }
      }
      
      toast({
        title: "Media Access Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  }, [enableAudio, enableVideo, toast]);

  // Join room
  const joinRoom = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    
    // Get user media first
    await getUserMedia();
    
    // Initialize WebSocket
    initializeWebSocket();
  }, [isConnecting, isConnected, getUserMedia, initializeWebSocket]);

  // Leave room
  const leaveRoom = useCallback(() => {
    // Close all peer connections
    peers.forEach(peer => {
      peer.connection.close();
    });
    setPeers(new Map());

    // Stop local streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsScreenSharing(false);
  }, [peers, localStream, screenStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        
        // Notify peers
        wsRef.current?.send(JSON.stringify({
          type: 'media-state-change',
          audioEnabled: !isAudioEnabled,
          videoEnabled: isVideoEnabled,
          screenSharing: isScreenSharing
        }));
      }
    }
  }, [localStream, isAudioEnabled, isVideoEnabled, isScreenSharing]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        
        // Notify peers
        wsRef.current?.send(JSON.stringify({
          type: 'media-state-change',
          audioEnabled: isAudioEnabled,
          videoEnabled: !isVideoEnabled,
          screenSharing: isScreenSharing
        }));
      }
    }
  }, [localStream, isAudioEnabled, isVideoEnabled, isScreenSharing]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!enableScreenShare) return;

    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Replace video track in all peer connections
        const videoTrack = stream.getVideoTracks()[0];
        peers.forEach(peer => {
          const sender = peer.connection.getSenders().find(
            s => s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Handle screen share end
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          
          // Switch back to camera
          if (localStream) {
            const cameraTrack = localStream.getVideoTracks()[0];
            peers.forEach(peer => {
              const sender = peer.connection.getSenders().find(
                s => s.track && s.track.kind === 'video'
              );
              if (sender && cameraTrack) {
                sender.replaceTrack(cameraTrack);
              }
            });
          }
        };
      } else {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }
        setIsScreenSharing(false);

        // Switch back to camera
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          peers.forEach(peer => {
            const sender = peer.connection.getSenders().find(
              s => s.track && s.track.kind === 'video'
            );
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }

      // Notify peers
      wsRef.current?.send(JSON.stringify({
        type: 'media-state-change',
        audioEnabled: isAudioEnabled,
        videoEnabled: isVideoEnabled,
        screenSharing: !isScreenSharing
      }));

    } catch (error) {
      console.error('Screen share error:', error);
      toast({
        title: "Screen Share Error",
        description: "Failed to start screen sharing.",
        variant: "destructive"
      });
    }
  }, [enableScreenShare, isScreenSharing, screenStream, localStream, peers, isAudioEnabled, isVideoEnabled, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return (
    <>
      {showPermissionGuide && (
        <PermissionGuide
          onClose={() => setShowPermissionGuide(false)}
          showCamera={enableVideo}
          showMicrophone={enableAudio}
        />
      )}
      
      <Card className="bg-dark-200 border-dark-400 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Room Connection</h3>
            <Badge variant="outline" className="text-xs">
              {roomId}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionQuality === 'excellent' ? 'bg-green-500' :
              connectionQuality === 'good' ? 'bg-yellow-500' :
              connectionQuality === 'fair' ? 'bg-orange-500' : 'bg-red-500'
            }`} />
            <Badge 
              className={`${
                isConnected ? 'bg-green-500' : 'bg-gray-500'
              } text-white`}
              data-testid="connection-status"
            >
              {isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING...' : 'DISCONNECTED'}
            </Badge>
          </div>
        </div>

        {/* Local Video Preview */}
        {localStream && (
          <div className="relative aspect-video bg-dark-400 rounded-lg overflow-hidden max-w-xs">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isVideoEnabled ? 'opacity-0' : ''}`}
              data-testid="local-video"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
                <VideoOff className="w-8 h-8 text-gray-500" />
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
              You {isScreenSharing && '(Screen)'}
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Participants ({peers.size + 1}/{maxPeers})
            </span>
          </div>
          
          <div className="space-y-1">
            {/* Self */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-white">{username} (You)</span>
              {isHost && <Badge className="bg-purple-500 text-white text-xs">HOST</Badge>}
            </div>
            
            {/* Peers */}
            {Array.from(peers.values()).map(peer => (
              <div key={peer.id} className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  peer.connection.connectionState === 'connected' ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className="text-white">{peer.username || `User ${peer.id.slice(0, 8)}`}</span>
                <div className="flex items-center space-x-1">
                  {!peer.isAudioEnabled && <MicOff className="w-3 h-3 text-red-500" />}
                  {!peer.isVideoEnabled && <VideoOff className="w-3 h-3 text-red-500" />}
                  {peer.isScreenSharing && <Monitor className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Button
                  onClick={toggleAudio}
                  size="icon"
                  variant="outline"
                  className={`border-dark-400 ${!isAudioEnabled ? 'text-red-500' : 'text-white'}`}
                  data-testid="toggle-audio"
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={toggleVideo}
                  size="icon"
                  variant="outline"
                  className={`border-dark-400 ${!isVideoEnabled ? 'text-red-500' : 'text-white'}`}
                  data-testid="toggle-video"
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>

                {enableScreenShare && (
                  <Button
                    onClick={toggleScreenShare}
                    size="icon"
                    variant="outline"
                    className={`border-dark-400 ${isScreenSharing ? 'text-blue-500' : 'text-white'}`}
                    data-testid="toggle-screen-share"
                  >
                    {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </Button>
                )}
              </>
            ) : null}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={isConnected ? leaveRoom : joinRoom}
              className={`${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-purple-500 hover:bg-purple-600'
              } text-white font-medium`}
              disabled={isConnecting}
              data-testid="connection-toggle"
            >
              {isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Leave Room
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4 mr-2" />
                  {isConnecting ? 'Joining...' : 'Join Room'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
    </>
  );
}