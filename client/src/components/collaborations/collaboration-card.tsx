import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Clock, Play, Pause, CheckCircle, X, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useUpdateCollaborationStatus } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import type { Collaboration } from '@shared/schema';

interface CollaborationCardProps {
  collaboration: Collaboration;
  className?: string;
  onJoinSession?: () => void;
}

export default function CollaborationCard({ collaboration, className, onJoinSession }: CollaborationCardProps) {
  const { user } = useAuth();
  const { joinCollaboration } = useWebSocket();
  const updateStatus = useUpdateCollaborationStatus();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStatusUpdate = (status: string) => {
    updateStatus.mutate({
      id: collaboration.id,
      status,
    });
  };

  const handleJoinSession = () => {
    joinCollaboration(collaboration.id);
    onJoinSession?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lead':
        return 'bg-purple-500';
      case 'featured':
        return 'bg-gold-500';
      case 'producer':
        return 'bg-blue-500';
      case 'writer':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isInvolved = user && (
    collaboration.initiatorId === user.id || 
    collaboration.collaboratorId === user.id
  );

  const canManageStatus = user && collaboration.initiatorId === user.id;
  const isPending = collaboration.status === 'pending';
  const isActive = collaboration.status === 'active';

  return (
    <Card className={cn("bg-dark-200 border-dark-400 hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white" data-testid={`text-collab-track-${collaboration.id}`}>
              {collaboration.trackTitle}
            </h3>
            <Badge className={getStatusColor(collaboration.status || 'pending')}>
              {(collaboration.status || 'pending').toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getRoleColor(collaboration.role)} data-testid={`badge-role-${collaboration.id}`}>
              {collaboration.role.toUpperCase()}
            </Badge>
            
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatDate(collaboration.createdAt || new Date())}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Collaborators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Initiator */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{collaboration.initiatorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white" data-testid={`text-initiator-${collaboration.id}`}>
                  {collaboration.initiatorName}
                </p>
                <p className="text-xs text-gray-400">Initiator</p>
              </div>
            </div>

            {/* Collaboration Arrow */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-electric-500"></div>
              <Users className="w-4 h-4 text-purple-400" />
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-electric-500"></div>
            </div>

            {/* Collaborator */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{collaboration.collaboratorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white" data-testid={`text-collaborator-${collaboration.id}`}>
                  {collaboration.collaboratorName}
                </p>
                <p className="text-xs text-gray-400">{collaboration.role}</p>
              </div>
            </div>
          </div>

          {/* Play Track */}
          {collaboration.trackId && (
            <Button
              size="sm"
              variant="outline"
              data-testid={`button-play-track-${collaboration.id}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
              Play Track
            </Button>
          )}
        </div>

        {/* Description */}
        {collaboration.description && (
          <div className="p-3 bg-dark-300 rounded-lg">
            <p className="text-sm text-gray-300" data-testid={`text-description-${collaboration.id}`}>
              {collaboration.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-400">
          <div className="flex items-center space-x-2">
            {/* Status Management for Initiator */}
            {canManageStatus && isPending && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                  data-testid={`button-approve-${collaboration.id}`}
                  onClick={() => handleStatusUpdate('active')}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  data-testid={`button-decline-${collaboration.id}`}
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={updateStatus.isPending}
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Response for Collaborator */}
            {user && collaboration.collaboratorId === user.id && isPending && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                  data-testid={`button-accept-${collaboration.id}`}
                  onClick={() => handleStatusUpdate('active')}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  data-testid={`button-reject-${collaboration.id}`}
                  onClick={() => handleStatusUpdate('declined')}
                  disabled={updateStatus.isPending}
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {/* Join Live Session */}
            {isInvolved && isActive && (
              <Button
                size="sm"
                variant="default"
                className="bg-purple-500 hover:bg-purple-600"
                data-testid={`button-join-session-${collaboration.id}`}
                onClick={handleJoinSession}
              >
                <Users className="w-3 h-3 mr-1" />
                Join Session
              </Button>
            )}
          </div>

          {/* Chat/Messages */}
          <div className="flex items-center space-x-2">
            {isInvolved && (
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                data-testid={`button-chat-${collaboration.id}`}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Indicator for Active Collaborations */}
        {isActive && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-dark-300 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-purple-500 to-electric-500 h-1.5 rounded-full w-3/4"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}