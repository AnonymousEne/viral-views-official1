import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBeatSchema } from '@shared/schema';
import { useCreateBeat } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Music4, DollarSign, Loader2 } from 'lucide-react';
import type { InsertBeat } from '@shared/schema';

interface CreateBeatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENRES = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Country', 'Reggae'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LICENSE_TYPES = [
  { value: 'basic', label: 'Basic License', desc: 'Standard commercial use' },
  { value: 'premium', label: 'Premium License', desc: 'Enhanced commercial rights' },
  { value: 'exclusive', label: 'Exclusive License', desc: 'Full ownership transfer' },
];

export default function CreateBeatDialog({ open, onOpenChange }: CreateBeatDialogProps) {
  const { user } = useAuth();
  const createBeat = useCreateBeat();
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
  } = useForm<InsertBeat>({
    resolver: zodResolver(insertBeatSchema),
    defaultValues: {
      producerId: user?.id || '',
      producerName: user?.displayName || '',
      licenseType: 'basic',
      price: '29.99',
    },
  });

  const selectedLicenseType = watch('licenseType');

  const onSubmit = async (data: InsertBeat) => {
    try {
      setIsUploading(true);
      await createBeat.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create beat:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      toast({
        title: 'Success',
        description: 'Beat audio uploaded successfully',
      });
    } catch (error) {
      console.error('Audio upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload beat audio. Please try again.',
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
        description: 'Cover artwork uploaded successfully',
      });
    } catch (error) {
      console.error('Cover upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload cover artwork. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const getSuggestedPrice = (licenseType: string) => {
    switch (licenseType) {
      case 'basic':
        return 29.99;
      case 'premium':
        return 99.99;
      case 'exclusive':
        return 499.99;
      default:
        return 29.99;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-dark-200 border-dark-400 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Music4 className="w-5 h-5 text-gold-400" />
            <span>List New Beat</span>
          </DialogTitle>
          <DialogDescription>
            Share your beats with artists and earn from your music
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Audio Upload */}
          <div className="space-y-2">
            <Label htmlFor="audioFile">Beat Audio File*</Label>
            <div className="border-2 border-dashed border-dark-400 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                id="audioFile"
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
                data-testid="input-beat-audio"
                disabled={isUploadingAudio}
              />
              <Label htmlFor="audioFile" className="cursor-pointer">
                {isUploadingAudio ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-gold-400">Uploading beat...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-gold-400 hover:text-gold-300">Upload beat audio</span>
                    <p className="text-sm text-gray-500 mt-1">MP3, WAV, or M4A (max 100MB)</p>
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Beat Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Beat Title*</Label>
              <Input
                id="title"
                data-testid="input-beat-title"
                {...register('title')}
                placeholder="Fire Beat 2024"
                className="bg-dark-300 border-dark-400"
              />
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre*</Label>
              <Select onValueChange={(value) => setValue('genre', value)}>
                <SelectTrigger data-testid="select-beat-genre">
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
              {errors.genre && (
                <p className="text-red-400 text-sm">{errors.genre.message}</p>
              )}
            </div>
          </div>

          {/* Beat Properties */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM*</Label>
              <Input
                id="bpm"
                data-testid="input-beat-bpm"
                {...register('bpm', { valueAsNumber: true })}
                type="number"
                placeholder="140"
                className="bg-dark-300 border-dark-400"
              />
              {errors.bpm && (
                <p className="text-red-400 text-sm">{errors.bpm.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Select onValueChange={(value) => console.log('Key selected:', value)}>
                <SelectTrigger data-testid="select-beat-key">
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  {KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood/Style</Label>
              <Input
                id="mood"
                data-testid="input-beat-mood"
                onChange={(e) => console.log('Mood:', e.target.value)}
                placeholder="Dark, Melodic, etc."
                className="bg-dark-300 border-dark-400"
              />
            </div>
          </div>

          {/* License and Pricing */}
          <div className="space-y-4">
            <Label>License Type & Pricing</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LICENSE_TYPES.map((license) => (
                <div
                  key={license.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedLicenseType === license.value
                      ? 'border-gold-400 bg-gold-400/10'
                      : 'border-dark-400 hover:border-dark-300'
                  }`}
                  onClick={() => {
                    setValue('licenseType', license.value);
                    setValue('price', getSuggestedPrice(license.value).toString());
                  }}
                  data-testid={`license-${license.value}`}
                >
                  <h4 className="font-medium text-white">{license.label}</h4>
                  <p className="text-sm text-gray-400 mt-1">{license.desc}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold">
                      ${getSuggestedPrice(license.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Custom Price*</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <Input
                  id="price"
                  data-testid="input-beat-price"
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="29.99"
                  className="bg-dark-300 border-dark-400 flex-1"
                />
              </div>
              {errors.price && (
                <p className="text-red-400 text-sm">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid="input-beat-description"
              onChange={(e) => console.log('Description:', e.target.value)}
              placeholder="Describe your beat, its style, and what makes it unique..."
              className="bg-dark-300 border-dark-400 min-h-[80px]"
              rows={4}
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Artwork</Label>
            <div className="border border-dark-400 rounded-lg p-4">
              <input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                data-testid="input-beat-cover"
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
              disabled={isUploading || createBeat.isPending}
              className="bg-gold-500 hover:bg-gold-600 text-black font-medium"
              data-testid="button-list-beat"
            >
              {isUploading || createBeat.isPending ? 'Listing...' : 'List Beat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}