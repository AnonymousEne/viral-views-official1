import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send,
  Search,
  Plus,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Star,
  Archive,
  Trash2,
  Music,
  Mic,
  Play,
  Download,
  Users,
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'audio' | 'file' | 'collaboration' | 'beat';
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    duration?: number;
  }[];
  replyTo?: string;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  type: 'direct' | 'group' | 'collaboration';
  title?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  isPinned?: boolean;
}

// Mock data
const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'BeatMaker Pro',
    avatar: 'https://picsum.photos/100/100?random=1',
    role: 'Producer',
    status: 'online'
  },
  {
    id: 'user-2',
    name: 'MC Rhyme Flow',
    avatar: 'https://picsum.photos/100/100?random=2',
    role: 'Rapper',
    status: 'away',
    lastSeen: '2025-08-28T15:30:00Z'
  },
  {
    id: 'user-3',
    name: 'SoulSinger',
    avatar: 'https://picsum.photos/100/100?random=3',
    role: 'Vocalist',
    status: 'offline',
    lastSeen: '2025-08-27T20:15:00Z'
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-1',
    content: 'Hey! I listened to your track and it\'s fire! 🔥 Would love to collaborate on something similar.',
    timestamp: '2025-08-28T10:30:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: 'msg-2',
    senderId: 'current-user',
    content: 'Thanks! I\'m definitely interested. What kind of vibe were you thinking?',
    timestamp: '2025-08-28T10:35:00Z',
    type: 'text',
    status: 'read'
  },
  {
    id: 'msg-3',
    senderId: 'user-1',
    content: 'Check out this beat I\'ve been working on',
    timestamp: '2025-08-28T10:40:00Z',
    type: 'audio',
    status: 'read',
    attachments: [{
      id: 'audio-1',
      name: 'Dark Trap Beat.mp3',
      type: 'audio/mp3',
      url: '/audio/sample-beat.mp3',
      duration: 180
    }]
  },
  {
    id: 'msg-4',
    senderId: 'current-user',
    content: 'This is sick! The 808s hit different. I can already hear myself on this.',
    timestamp: '2025-08-28T10:45:00Z',
    type: 'text',
    status: 'delivered'
  }
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [mockUsers[0]],
    lastMessage: mockMessages[3],
    unreadCount: 0,
    type: 'direct',
    createdAt: '2025-08-28T10:30:00Z',
    updatedAt: '2025-08-28T10:45:00Z',
    isPinned: true
  },
  {
    id: 'conv-2',
    participants: [mockUsers[1]],
    lastMessage: {
      id: 'msg-5',
      senderId: 'user-2',
      content: 'When are we hitting the studio?',
      timestamp: '2025-08-27T18:20:00Z',
      type: 'text',
      status: 'delivered'
    },
    unreadCount: 2,
    type: 'direct',
    createdAt: '2025-08-27T15:00:00Z',
    updatedAt: '2025-08-27T18:20:00Z'
  },
  {
    id: 'conv-3',
    participants: [mockUsers[2]],
    lastMessage: {
      id: 'msg-6',
      senderId: 'current-user',
      content: 'Let me know when you\'re free to record',
      timestamp: '2025-08-26T14:10:00Z',
      type: 'text',
      status: 'read'
    },
    unreadCount: 0,
    type: 'direct',
    createdAt: '2025-08-26T10:00:00Z',
    updatedAt: '2025-08-26T14:10:00Z'
  },
  {
    id: 'conv-4',
    participants: [mockUsers[0], mockUsers[1], mockUsers[2]],
    lastMessage: {
      id: 'msg-7',
      senderId: 'user-1',
      content: 'Group session this weekend?',
      timestamp: '2025-08-25T16:30:00Z',
      type: 'text',
      status: 'read'
    },
    unreadCount: 1,
    type: 'group',
    title: 'Studio Squad',
    createdAt: '2025-08-20T12:00:00Z',
    updatedAt: '2025-08-25T16:30:00Z'
  }
];

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation?: string;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  searchQuery, 
  onSearchChange 
}: ConversationListProps) {
  const filteredConversations = conversations.filter(conv => {
    const participants = conv.participants.map(p => p.name).join(' ').toLowerCase();
    const title = conv.title?.toLowerCase() || '';
    const content = conv.lastMessage.content.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return participants.includes(query) || title.includes(query) || content.includes(query);
  });

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'group' && conversation.title) {
      return conversation.title;
    }
    return conversation.participants.map(p => p.name).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar || 'https://picsum.photos/100/100?random=group';
    }
    return conversation.participants[0]?.avatar;
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-electric-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-dark-300 border-dark-400"
        />
      </div>

      {/* Conversations */}
      <div className="space-y-2">
        {filteredConversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={cn(
              "cursor-pointer transition-all duration-200 bg-dark-200 border-dark-400 hover:bg-dark-300",
              selectedConversation === conversation.id && "bg-electric-500/10 border-electric-500/50"
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getConversationAvatar(conversation)} />
                    <AvatarFallback>
                      {conversation.type === 'group' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        conversation.participants[0]?.name.charAt(0)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.type === 'direct' && conversation.participants[0]?.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-dark-200 rounded-full" />
                  )}
                  {conversation.isPinned && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-electric-500 rounded-full flex items-center justify-center">
                      <Star className="w-2 h-2 text-white fill-current" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {getConversationTitle(conversation)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(conversation.lastMessage.status)}
                      <span className="text-xs text-gray-400">
                        {format(new Date(conversation.lastMessage.timestamp), 'HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.lastMessage.type === 'audio' ? (
                        <span className="flex items-center">
                          <Mic className="w-3 h-3 mr-1" />
                          Audio message
                        </span>
                      ) : (
                        conversation.lastMessage.content
                      )}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-electric-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>

                  {conversation.type === 'direct' && conversation.participants[0]?.role && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {conversation.participants[0].role}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  sender: User | undefined;
  isOwn: boolean;
  onPlay?: (audioUrl: string) => void;
}

function MessageBubble({ message, sender, isOwn, onPlay }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: Message['status']) => {
    if (!isOwn) return null;
    
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-electric-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex items-end space-x-2", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={sender?.avatar} />
          <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "max-w-[70%] space-y-1",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Message bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2",
          isOwn 
            ? "bg-electric-500 text-white ml-auto" 
            : "bg-dark-300 text-white"
        )}>
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}

          {message.type === 'audio' && message.attachments && (
            <div className="space-y-2">
              <p className="text-sm">{message.content}</p>
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-3 p-3 bg-black/20 rounded-lg"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-2 h-8 w-8"
                    onClick={() => onPlay?.(attachment.url)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{attachment.name}</p>
                    {attachment.duration && (
                      <p className="text-xs opacity-70">
                        {formatDuration(attachment.duration)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-2 h-8 w-8"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message info */}
        <div className={cn(
          "flex items-center space-x-1 text-xs text-gray-400",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span>{formatTime(message.timestamp)}</span>
          {getStatusIcon(message.status)}
        </div>
      </div>

      {isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

interface ChatAreaProps {
  conversation: Conversation | undefined;
  messages: Message[];
  onSendMessage: (content: string, type?: Message['type'], attachments?: any[]) => void;
  currentUser: string;
}

function ChatArea({ conversation, messages, onSendMessage, currentUser }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-100">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
          <p className="text-gray-400">Choose a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const getConversationTitle = () => {
    if (conversation.type === 'group' && conversation.title) {
      return conversation.title;
    }
    return conversation.participants.map(p => p.name).join(', ');
  };

  const getOnlineStatus = () => {
    if (conversation.type === 'group') {
      const onlineCount = conversation.participants.filter(p => p.status === 'online').length;
      return `${onlineCount} online`;
    }
    
    const participant = conversation.participants[0];
    if (participant?.status === 'online') return 'Online';
    if (participant?.status === 'away') return 'Away';
    if (participant?.lastSeen) {
      return `Last seen ${format(new Date(participant.lastSeen), 'MMM d, HH:mm')}`;
    }
    return 'Offline';
  };

  return (
    <div className="flex-1 flex flex-col bg-dark-100">
      {/* Chat Header */}
      <div className="border-b border-dark-400 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={
                conversation.type === 'group' 
                  ? conversation.avatar 
                  : conversation.participants[0]?.avatar
              } />
              <AvatarFallback>
                {conversation.type === 'group' ? (
                  <Users className="w-5 h-5" />
                ) : (
                  conversation.participants[0]?.name.charAt(0)
                )}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-white">{getConversationTitle()}</h3>
              <p className="text-sm text-gray-400">{getOnlineStatus()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="p-2">
              <Phone className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Video className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Info className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => {
          const sender = mockUsers.find(u => u.id === message.senderId);
          const isOwn = message.senderId === currentUser;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              sender={sender}
              isOwn={isOwn}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-dark-400 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" className="p-2">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Mic className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Music className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="resize-none bg-dark-300 border-dark-400 focus:border-electric-500"
            />
          </div>

          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" className="p-2">
              <Smile className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="bg-electric-500 hover:bg-electric-600 p-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArtistMessaging() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const currentUser = 'current-user';

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = (content: string, type: Message['type'] = 'text', attachments?: any[]) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser,
      content,
      timestamp: new Date().toISOString(),
      type,
      status: 'sent',
      attachments
    };

    setMessages(prev => [...prev, newMessage]);

    // Update conversation's last message
    if (selectedConversation) {
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation
          ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.timestamp }
          : conv
      ));
    }
  };

  return (
    <div className="h-screen flex bg-dark-100">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-dark-400 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <Button size="sm" variant="ghost" className="p-2">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Chat Area */}
      <ChatArea
        conversation={selectedConversationData}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
      />
    </div>
  );
}
