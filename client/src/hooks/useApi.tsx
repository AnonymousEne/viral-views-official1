import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { 
  User, InsertUser,
  Track, InsertTrack,
  Battle, InsertBattle,
  Beat, InsertBeat,
  Collaboration, InsertCollaboration,
  Vote, InsertVote,
  File, InsertFile
} from '@shared/schema';

// User API Hooks
export function useUsers() {
  return useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return await response.json() as User[];
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['/api/users', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${id}`);
      return await response.json() as User;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest('POST', '/api/users', data);
      return await response.json() as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });
}

// Track API Hooks
export function useTracks(artistId?: string) {
  return useQuery({
    queryKey: artistId ? ['/api/tracks', { artist: artistId }] : ['/api/tracks'],
    queryFn: async () => {
      const url = artistId ? `/api/tracks?artist=${artistId}` : '/api/tracks';
      const response = await apiRequest('GET', url);
      return await response.json() as Track[];
    },
  });
}

export function useTrack(id: string) {
  return useQuery({
    queryKey: ['/api/tracks', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tracks/${id}`);
      return await response.json() as Track;
    },
    enabled: !!id,
  });
}

export function useCreateTrack() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTrack) => {
      const response = await apiRequest('POST', '/api/tracks', data);
      return await response.json() as Track;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      toast({
        title: 'Success',
        description: 'Track created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create track',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTrackPlays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/tracks/${id}/play`);
      return await response.json() as Track;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/tracks', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
    },
  });
}

export function useUpdateTrackLikes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/tracks/${id}/like`);
      return await response.json() as Track;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/tracks', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
    },
  });
}

// Battle API Hooks
export function useBattles() {
  return useQuery({
    queryKey: ['/api/battles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/battles');
      return await response.json() as Battle[];
    },
  });
}

export function useActiveBattles() {
  return useQuery({
    queryKey: ['/api/battles/active'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/battles/active');
      return await response.json() as Battle[];
    },
  });
}

export function useBattle(id: string) {
  return useQuery({
    queryKey: ['/api/battles', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/battles/${id}`);
      return await response.json() as Battle;
    },
    enabled: !!id,
  });
}

export function useUserBattles(userId: string) {
  return useQuery({
    queryKey: ['/api/battles/user', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/battles/user/${userId}`);
      return await response.json() as Battle[];
    },
    enabled: !!userId,
  });
}

export function useCreateBattle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBattle) => {
      const response = await apiRequest('POST', '/api/battles', data);
      return await response.json() as Battle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      toast({
        title: 'Battle Created!',
        description: 'Your battle has been created and is now live',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create battle',
        variant: 'destructive',
      });
    },
  });
}

export function useVoteInBattle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertVote) => {
      const response = await apiRequest('POST', '/api/battles/vote', data);
      return await response.json() as Vote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles', variables.battleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      toast({
        title: 'Vote Cast!',
        description: 'Your vote has been recorded',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cast vote',
        variant: 'destructive',
      });
    },
  });
}

// Beat API Hooks
export function useBeats(genre?: string, producerId?: string) {
  return useQuery({
    queryKey: genre || producerId 
      ? ['/api/beats', { genre, producerId }] 
      : ['/api/beats'],
    queryFn: async () => {
      let url = '/api/beats';
      const params = new URLSearchParams();
      if (genre) params.append('genre', genre);
      if (producerId) params.append('producer', producerId);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiRequest('GET', url);
      return await response.json() as Beat[];
    },
  });
}

export function useBeat(id: string) {
  return useQuery({
    queryKey: ['/api/beats', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/beats/${id}`);
      return await response.json() as Beat;
    },
    enabled: !!id,
  });
}

export function useCreateBeat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBeat) => {
      const response = await apiRequest('POST', '/api/beats', data);
      return await response.json() as Beat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({
        title: 'Beat Listed!',
        description: 'Your beat is now available in the marketplace',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to list beat',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBeatPlays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/beats/${id}/play`);
      return await response.json() as Beat;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/beats', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
    },
  });
}

export function useUpdateBeatLikes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/beats/${id}/like`);
      return await response.json() as Beat;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/beats', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
    },
  });
}

export function usePurchaseBeat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/beats/${id}/purchase`);
      return await response.json() as Beat;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/beats', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({
        title: 'Beat Purchased!',
        description: 'You now own this beat and can use it in your projects',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase beat',
        variant: 'destructive',
      });
    },
  });
}

// Collaboration API Hooks
export function useCollaborations() {
  return useQuery({
    queryKey: ['/api/collaborations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/collaborations');
      return await response.json() as Collaboration[];
    },
  });
}

export function useTrackCollaborations(trackId: string) {
  return useQuery({
    queryKey: ['/api/collaborations/track', trackId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/collaborations/track/${trackId}`);
      return await response.json() as Collaboration[];
    },
    enabled: !!trackId,
  });
}

export function useUserCollaborations(userId: string) {
  return useQuery({
    queryKey: ['/api/collaborations/user', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/collaborations/user/${userId}`);
      return await response.json() as Collaboration[];
    },
    enabled: !!userId,
  });
}

export function useCreateCollaboration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCollaboration) => {
      const response = await apiRequest('POST', '/api/collaborations', data);
      return await response.json() as Collaboration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations'] });
      toast({
        title: 'Collaboration Invited!',
        description: 'Collaboration request sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create collaboration',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCollaborationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/collaborations/${id}`, { status });
      return await response.json() as Collaboration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations'] });
      toast({
        title: 'Status Updated',
        description: 'Collaboration status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    },
  });
}

// File API Hooks  
export function useFiles(directory?: string, fileType?: string) {
  return useQuery({
    queryKey: directory || fileType 
      ? ['/api/files', { directory, fileType }] 
      : ['/api/files'],
    queryFn: async () => {
      let url = '/api/files';
      const params = new URLSearchParams();
      if (directory) params.append('directory', directory);
      if (fileType) params.append('type', fileType);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiRequest('GET', url);
      return await response.json() as File[];
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertFile) => {
      const response = await apiRequest('POST', '/api/files', data);
      return await response.json() as File;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'File Uploaded!',
        description: 'Your file has been uploaded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });
}