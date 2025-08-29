import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Users, Mic, MicOff, Volume2, VolumeX, 
  Crown, Settings, UserPlus, UserMinus,
  Music, Headphones, Circle, Square,
  MoreHorizontal, Hand, Clock, Flame
} from "lucide-react";

interface Participant {
  id: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  isMuted: boolean;
  isOwner: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  joinedAt: Date;
}

interface CollaborationRoom {
  id: string;
  name: string;
  type: 'cypher' | 'remix' | 'beat-session' | 'jam' | 'workshop';
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  owner: Participant;
  beat?: {
    id: string;
    name: string;
    bpm: number;
    producer: string;
  };
  isRecording: boolean;
  recordingDuration: number;
  isLive: boolean;
  tags: string[];
  createdAt: Date;
}

interface CollaborationRoomsProps {
  onJoinRoom?: (roomId: string) => void;
  onLeaveRoom?: (roomId: string) => void;
  onCreateRoom?: (roomData: any) => void;
  onInviteUser?: (roomId: string, userId: string) => void;
  className?: string;
}

export default function CollaborationRooms({
  onJoinRoom,
  onLeaveRoom,
  onCreateRoom,
  onInviteUser,
  className = ""
}: CollaborationRoomsProps) {
  const [rooms, setRooms] = useState<CollaborationRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<CollaborationRoom | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [isInQueue, setIsInQueue] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock rooms data
  const generateMockRooms = useCallback((): CollaborationRoom[] => {
    const roomTypes: CollaborationRoom['type'][] = ['cypher', 'remix', 'beat-session', 'jam', 'workshop'];
    const roomNames = [
      'Late Night Cypher', 'Beat Making Lab', 'Freestyle Friday',
      'Remix Workshop', 'Trap Session', 'R&B Vibes', 'Hip-Hop Heads',
      'Producer Circle', 'New Artist Showcase', 'Collaboration Station'
    ];

    return Array.from({ length: 10 }, (_, i) => {
      const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const maxParticipants = [4, 6, 8, 10][Math.floor(Math.random() * 4)];
      const currentParticipants = Math.floor(Math.random() * maxParticipants) + 1;
      
      const participants: Participant[] = Array.from({ length: currentParticipants }, (_, j) => ({
        id: `user-${i}-${j}`,
        username: `User${j + 1}`,
        avatar: ['🎤', '🎹', '🎧', '🔥', '⚡'][j % 5],
        isVerified: Math.random() > 0.7,
        isMuted: Math.random() > 0.8,
        isOwner: j === 0,
        isSpeaking: Math.random() > 0.7,
        audioLevel: Math.random() * 100,
        joinedAt: new Date(Date.now() - Math.random() * 3600000)
      }));

      return {
        id: `room-${i}`,
        name: roomNames[i],
        type,
        description: `${type === 'cypher' ? 'Freestyle rap session' : 
                     type === 'remix' ? 'Collaborative remixing' :
                     type === 'beat-session' ? 'Beat making together' :
                     type === 'jam' ? 'Musical jam session' : 'Learning workshop'}`,
        maxParticipants,
        currentParticipants,
        participants,
        owner: participants[0],
        beat: Math.random() > 0.5 ? {
          id: `beat-${i}`,
          name: 'Session Beat',
          bpm: 120 + Math.floor(Math.random() * 40),
          producer: 'BeatMaster'
        } : undefined,
        isRecording: Math.random() > 0.8,
        recordingDuration: Math.floor(Math.random() * 1800),
        isLive: Math.random() > 0.3,
        tags: ['freestyle', 'collaboration', 'live'].slice(0, Math.floor(Math.random() * 3) + 1),
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      };
    });
  }, []);

  useEffect(() => {
    setRooms(generateMockRooms());
  }, [generateMockRooms]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const joinRoom = useCallback((room: CollaborationRoom) => {
    setCurrentRoom(room);
    onJoinRoom?.(room.id);
  }, [onJoinRoom]);

  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      onLeaveRoom?.(currentRoom.id);
      setCurrentRoom(null);
      setIsInQueue(false);
      setQueuePosition(0);
    }
  }, [currentRoom, onLeaveRoom]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const joinQueue = useCallback(() => {
    setIsInQueue(true);
    setQueuePosition(Math.floor(Math.random() * 5) + 1);
  }, []);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoomTypeIcon = (type: CollaborationRoom['type']) => {
    switch (type) {
      case 'cypher': return '🎤';
      case 'remix': return '🎛️';
      case 'beat-session': return '🥁';
      case 'jam': return '🎵';
      case 'workshop': return '📚';
      default: return '🎶';
    }
  };

  const getRoomTypeColor = (type: CollaborationRoom['type']) => {
    switch (type) {
      case 'cypher': return 'bg-red-500';
      case 'remix': return 'bg-purple-500';
      case 'beat-session': return 'bg-blue-500';
      case 'jam': return 'bg-green-500';
      case 'workshop': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Room list view
  if (!currentRoom) {
    return (
      <div className={`h-screen w-full bg-black text-white ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Collaboration Rooms</h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>
        </div>

        {/* Room list */}
        <div className="p-4 space-y-4 max-h-screen overflow-y-auto">
          {rooms.map((room) => (
            <Card key={room.id} className="bg-dark-200 border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getRoomTypeIcon(room.type)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">{room.name}</h3>
                        {room.isLive && (
                          <Badge className="bg-red-500 text-white px-2 py-1 text-xs animate-pulse">
                            LIVE
                          </Badge>
                        )}
                        {room.isRecording && (
                          <Badge className="bg-purple-500 text-white px-2 py-1 text-xs">
                            <Circle className="w-3 h-3 mr-1 fill-current" />
                            REC
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{room.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{room.currentParticipants}/{room.maxParticipants}</span>
                    </div>
                    {room.beat && (
                      <div className="flex items-center space-x-1">
                        <Music className="w-4 h-4" />
                        <span>{room.beat.name} ({room.beat.bpm} BPM)</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{Math.floor((Date.now() - room.createdAt.getTime()) / (1000 * 60))}m ago</span>
                    </div>
                  </div>

                  {/* Participants preview */}
                  <div className="flex items-center space-x-2 mb-3">
                    {room.participants.slice(0, 4).map((participant, index) => (
                      <div key={participant.id} className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm">
                          {participant.avatar}
                        </div>
                        {participant.isSpeaking && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        )}
                        {participant.isOwner && (
                          <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    ))}
                    {room.participants.length > 4 && (
                      <div className="text-sm text-gray-400">
                        +{room.participants.length - 4} more
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {room.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Join button */}
                <div className="ml-4">
                  <Button
                    onClick={() => joinRoom(room)}
                    disabled={room.currentParticipants >= room.maxParticipants}
                    className={`${getRoomTypeColor(room.type)} hover:opacity-90`}
                  >
                    {room.currentParticipants >= room.maxParticipants ? 'Full' : 'Join'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Room view
  return (
    <div className={`h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={leaveRoom}
              variant="ghost"
              size="icon"
              className="text-white"
            >
              ←
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getRoomTypeIcon(currentRoom.type)}</span>
                <h2 className="font-bold">{currentRoom.name}</h2>
                {currentRoom.isLive && (
                  <Badge className="bg-red-500 text-white px-2 py-1 text-xs animate-pulse">
                    LIVE
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-400">{currentRoom.description}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowParticipants(!showParticipants)}
              variant="ghost"
              size="icon"
              className="text-white"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main room area */}
      <div className="flex-1 p-6">
        {/* Center stage */}
        <div className="text-center mb-8">
          {/* Current speaker or beat info */}
          {currentRoom.beat ? (
            <div className="space-y-4">
              <Music className="w-16 h-16 mx-auto text-purple-400" />
              <div>
                <h3 className="text-2xl font-bold">{currentRoom.beat.name}</h3>
                <p className="text-gray-400">by {currentRoom.beat.producer} • {currentRoom.beat.bpm} BPM</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Mic className="w-16 h-16 mx-auto text-blue-400" />
              <div>
                <h3 className="text-2xl font-bold">Open Mic</h3>
                <p className="text-gray-400">Ready to freestyle? Join the queue!</p>
              </div>
            </div>
          )}

          {/* Queue status */}
          {isInQueue && (
            <div className="mt-6 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <Hand className="w-5 h-5" />
                <span>You're #{queuePosition} in queue</span>
              </div>
            </div>
          )}
        </div>

        {/* Participants grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {currentRoom.participants.map((participant) => (
            <Card key={participant.id} className="bg-black/30 border-gray-700 p-4">
              <div className="text-center space-y-2">
                <div className="relative mx-auto">
                  <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-2xl mx-auto">
                    {participant.avatar}
                  </div>
                  {participant.isSpeaking && (
                    <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-pulse" />
                  )}
                  {participant.isOwner && (
                    <Crown className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" />
                  )}
                  {participant.isMuted && (
                    <MicOff className="absolute -bottom-2 -right-2 w-5 h-5 text-red-500 bg-black rounded-full p-1" />
                  )}
                </div>
                
                <div>
                  <div className="font-semibold flex items-center justify-center space-x-1">
                    <span>{participant.username}</span>
                    {participant.isVerified && <Crown className="w-3 h-3 text-yellow-400" />}
                  </div>
                  
                  {/* Audio level indicator */}
                  {participant.isSpeaking && (
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                      <motion.div 
                        className="bg-green-500 h-1 rounded-full"
                        animate={{ width: `${participant.audioLevel}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-4 bg-black/50 backdrop-blur-sm border-t border-gray-800">
        <div className="flex items-center justify-between">
          {/* Audio controls */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "default"}
              size="icon"
              className="rounded-full"
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <div className="flex items-center space-x-2">
              <VolumeX className="w-4 h-4 text-gray-400" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-24"
              />
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Center actions */}
          <div className="flex items-center space-x-4">
            {!isInQueue ? (
              <Button
                onClick={joinQueue}
                className="bg-green-500 hover:bg-green-600"
              >
                <Hand className="w-4 h-4 mr-2" />
                Raise Hand
              </Button>
            ) : (
              <Button
                onClick={() => setIsInQueue(false)}
                variant="outline"
                className="border-yellow-500 text-yellow-500"
              >
                <Hand className="w-4 h-4 mr-2" />
                In Queue #{queuePosition}
              </Button>
            )}

            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className={isRecording ? "animate-pulse" : ""}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop ({formatTime(recordingTime)})
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2 fill-current" />
                  Record
                </>
              )}
            </Button>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-white">
              <UserPlus className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}