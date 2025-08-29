import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          handler(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const subscribeToMessage = useCallback((messageType: string, handler: (data: any) => void) => {
    messageHandlers.current.set(messageType, handler);
    
    return () => {
      messageHandlers.current.delete(messageType);
    };
  }, []);

  // Room management for live features
  const joinRoom = useCallback((roomId: string, username: string, isHost = false) => {
    sendMessage({
      type: 'join-room',
      roomId,
      username,
      isHost
    });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({
      type: 'leave-room'
    });
  }, [sendMessage]);

  // Battle real-time updates
  const joinBattle = useCallback((battleId: string) => {
    sendMessage({
      type: 'join-battle',
      battleId
    });
  }, [sendMessage]);

  const castVote = useCallback((battleId: string, contestantId: string) => {
    sendMessage({
      type: 'cast-vote',
      battleId,
      contestantId
    });
  }, [sendMessage]);

  // Collaboration real-time updates
  const joinCollaboration = useCallback((collaborationId: string) => {
    sendMessage({
      type: 'join-collaboration',
      collaborationId
    });
  }, [sendMessage]);

  const updateCollaborationLayer = useCallback((collaborationId: string, layerData: any) => {
    sendMessage({
      type: 'update-layer',
      collaborationId,
      layerData
    });
  }, [sendMessage]);

  // WebRTC signaling for live features
  const sendSignal = useCallback((peerId: string, signal: any) => {
    sendMessage({
      type: 'signal',
      peerId,
      ...signal
    });
  }, [sendMessage]);

  const updateMediaState = useCallback((audioEnabled: boolean, videoEnabled: boolean, screenSharing = false) => {
    sendMessage({
      type: 'media-state',
      audioEnabled,
      videoEnabled,
      screenSharing
    });
  }, [sendMessage]);

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    subscribeToMessage,
    // Room management
    joinRoom,
    leaveRoom,
    // Battle features
    joinBattle,
    castVote,
    // Collaboration features
    joinCollaboration,
    updateCollaborationLayer,
    // WebRTC features
    sendSignal,
    updateMediaState
  };
}