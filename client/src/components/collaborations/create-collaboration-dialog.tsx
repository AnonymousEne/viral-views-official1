import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertCollaborationSchema } from '@shared/schema';
import { useCreateCollaboration, useUsers, useTracks } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Users, Music, MessageSquare } from 'lucide-react';
import type { InsertCollaboration } from '@shared/schema';

interface CreateCollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES = [
  { value: 'featured', label: 'Featured Artist', desc: 'Main vocal or rap feature' },
  { value: 'producer', label: 'Producer', desc: 'Beat production and mixing' },
  { value: 'writer', label: 'Writer', desc: 'Lyrics and songwriting' },
  { value: 'lead', label: 'Lead Artist', desc: 'Primary artist on track' },
];

export default function CreateCollaborationDialog({ open, onOpenChange }: CreateCollaborationDialogProps) {
  const { user } = useAuth();
  const createCollaboration = useCreateCollaboration();
  const { data: users } = useUsers();
  const { data: tracks } = useTracks(user?.id);

  // Filter to artists and producers only
  const collaborators = users?.filter(u => 
    u.id !== user?.id && (u.role === 'artist' || u.role === 'producer')
  );

  // Filter to user's tracks only
  const myTracks = tracks?.filter(t => t.artistId === user?.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InsertCollaboration>({
    resolver: zodResolver(insertCollaborationSchema),
    defaultValues: {
      initiatorId: user?.id || '',
      initiatorName: user?.displayName || '',
      // status: 'pending', // Remove this field as it's not in the form schema
    },
  });

  const selectedTrackId = watch('trackId');
  const selectedCollaboratorId = watch('collaboratorId');
  const selectedRole = watch('role');

  const selectedTrack = myTracks?.find(t => t.id === selectedTrackId);
  const selectedCollaborator = collaborators?.find(u => u.id === selectedCollaboratorId);

  const onSubmit = async (data: InsertCollaboration) => {
    try {
      // Set track title if a track is selected
      if (selectedTrack) {
        data.trackTitle = selectedTrack.title;
      }

      await createCollaboration.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create collaboration:', error);
    }
  };

  const handleCollaboratorChange = (userId: string) => {
    const selectedUser = collaborators?.find(u => u.id === userId);
    if (selectedUser) {
      setValue('collaboratorId', userId);
      setValue('collaboratorName', selectedUser.displayName);
    }
  };

  const handleTrackChange = (trackId: string) => {
    const track = myTracks?.find(t => t.id === trackId);
    if (track) {
      setValue('trackId', trackId);
      setValue('trackTitle', track.title);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-dark-200 border-dark-400">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Invite Collaborator</span>
          </DialogTitle>
          <DialogDescription>
            Invite another artist or producer to collaborate on your track
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          {/* Track Selection */}
          <div className="space-y-2">
            <Label htmlFor="track">Select Track*</Label>
            <Select onValueChange={handleTrackChange} data-testid="select-track">
              <SelectTrigger>
                <SelectValue placeholder="Choose a track to collaborate on" />
              </SelectTrigger>
              <SelectContent>
                {myTracks?.map((track) => (
                  <SelectItem key={track.id} value={track.id}>
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4" />
                      <span>{track.title}</span>
                      {track.genre && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {track.genre}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.trackId && (
              <p className="text-red-400 text-sm">{errors.trackId.message}</p>
            )}
          </div>

          {/* Collaborator Selection */}
          <div className="space-y-2">
            <Label htmlFor="collaborator">Choose Collaborator*</Label>
            <Select onValueChange={handleCollaboratorChange} data-testid="select-collaborator">
              <SelectTrigger>
                <SelectValue placeholder="Select an artist or producer" />
              </SelectTrigger>
              <SelectContent>
                {collaborators?.map((collaborator) => (
                  <SelectItem key={collaborator.id} value={collaborator.id}>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {collaborator.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{collaborator.displayName}</span>
                      <Badge variant="outline" className="ml-2">
                        {collaborator.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.collaboratorId && (
              <p className="text-red-400 text-sm">{errors.collaboratorId.message}</p>
            )}
          </div>

          {/* Role Assignment */}
          <div className="space-y-3">
            <Label>Collaboration Role*</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <div
                  key={role.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? 'border-purple-400 bg-purple-400/10'
                      : 'border-dark-400 hover:border-dark-300'
                  }`}
                  onClick={() => setValue('role', role.value)}
                  data-testid={`role-${role.value}`}
                >
                  <h4 className="font-medium text-white">{role.label}</h4>
                  <p className="text-sm text-gray-400 mt-1">{role.desc}</p>
                </div>
              ))}
            </div>
            {errors.role && (
              <p className="text-red-400 text-sm">{errors.role.message}</p>
            )}
          </div>

          {/* Description/Message */}
          <div className="space-y-2">
            <Label htmlFor="description">Collaboration Message</Label>
            <Textarea
              id="description"
              data-testid="input-collaboration-message"
              {...register('description')}
              placeholder="Tell them about your vision for this collaboration..."
              className="bg-dark-300 border-dark-400 min-h-[100px]"
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Explain what you're looking for and how they can contribute to the track
            </p>
          </div>

          {/* Preview */}
          {selectedTrack && selectedCollaborator && selectedRole && (
            <div className="p-4 bg-dark-300 rounded-lg border border-dark-400">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Collaboration Preview
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="text-purple-400">Track:</span> {selectedTrack.title}
                </p>
                <p className="text-gray-300">
                  <span className="text-purple-400">Inviting:</span> {selectedCollaborator.displayName}
                </p>
                <p className="text-gray-300">
                  <span className="text-purple-400">Role:</span> {ROLES.find(r => r.value === selectedRole)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCollaboration.isPending || !selectedTrackId || !selectedCollaboratorId}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-send-invitation"
            >
              {createCollaboration.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}