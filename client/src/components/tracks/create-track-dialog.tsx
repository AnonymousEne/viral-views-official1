import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertTrackSchema } from '@shared/schema';
import { useCreateTrack } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Music, Loader2 } from 'lucide-react';
import type { InsertTrack } from '@shared/schema';

interface CreateTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Country', 'Reggae'];

export default function CreateTrackDialog({ open, onOpenChange }: CreateTrackDialogProps) {
  const { user } = useAuth();
  const createTrack = useCreateTrack();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InsertTrack>({
    resolver: zodResolver(insertTrackSchema),
    defaultValues: {
      artistId: user?.id || '',
      artistName: user?.displayName || '',
      isCollaborative: false,
      collaborators: [],
    },
  });

  const isCollaborative = watch('isCollaborative');

  const onSubmit = async (data: InsertTrack) => {
    try {
      setIsUploading(true);
      await createTrack.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create track:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setValue('audioUrl', result.url);
      
      // Extract duration from file
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        setValue('duration', Math.floor(audio.duration));
        URL.revokeObjectURL(audio.src);
      });

      toast({
        title: 'Success',
        description: 'Audio file uploaded successfully',
      });
    } catch (error) {
      console.error('Audio upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload audio file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setValue('coverImage', result.url);

      toast({
        title: 'Success',
        description: 'Cover image uploaded successfully',
      });
    } catch (error) {
      console.error('Cover upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload cover image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-dark-200 border-dark-400">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-purple-400" />
            <span>Upload New Track</span>
          </DialogTitle>
          <DialogDescription>
            Share your music with the Viral Views community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Audio File Upload */}
          <div className="space-y-2">
            <Label htmlFor="audioFile">Audio File*</Label>
            <div className="border-2 border-dashed border-dark-400 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-audio-file"
                disabled={isUploadingAudio}
              />
              <Label htmlFor="audioFile" className="cursor-pointer">
                {isUploadingAudio ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-purple-400">Uploading audio...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-purple-400 hover:text-purple-300">Choose audio file</span>
                    <p className="text-sm text-gray-500 mt-1">MP3, WAV, or M4A (max 100MB)</p>
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Track Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title*</Label>
              <Input
                id="title"
                data-testid="input-track-title"
                {...register('title')}
                placeholder="Track title"
                className="bg-dark-300 border-dark-400"
              />
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select onValueChange={(value) => setValue('genre', value)}>
                <SelectTrigger data-testid="select-track-genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bpm">BPM</Label>
            <Input
              id="bpm"
              data-testid="input-track-bpm"
              {...register('bpm', { valueAsNumber: true })}
              type="number"
              placeholder="120"
              className="bg-dark-300 border-dark-400"
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image</Label>
            <div className="border border-dark-400 rounded-lg p-4">
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                data-testid="input-cover-image"
                disabled={isUploadingCover}
              />
              <Label htmlFor="coverImage" className="cursor-pointer flex items-center space-x-2">
                {isUploadingCover ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-300">Uploading cover...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Upload cover art</span>
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Collaboration Settings */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="collaborative">Enable Collaboration</Label>
              <p className="text-sm text-gray-500">Allow other artists to collaborate on this track</p>
            </div>
            <Switch
              id="collaborative"
              data-testid="switch-collaborative"
              checked={isCollaborative || false}
              onCheckedChange={(checked) => setValue('isCollaborative', checked || false)}
            />
          </div>

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
              disabled={isUploading || createTrack.isPending}
              data-testid="button-upload-track"
            >
              {isUploading || createTrack.isPending ? 'Uploading...' : 'Upload Track'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}