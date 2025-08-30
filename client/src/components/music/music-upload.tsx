import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Music, Image, X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AudioPlayer from './audio-player';
import { cn } from '@/lib/utils';

const GENRES = [
  'Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Country', 'Reggae',
  'Trap', 'Drill', 'Lo-fi', 'House', 'Techno', 'Ambient', 'Classical'
];

interface MusicUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (trackData: any) => void;
}

export default function MusicUpload({ isOpen, onClose, onUpload }: MusicUploadProps) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Details, 3: Preview
  const [isUploading, setIsUploading] = useState(false);
  
  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>('');
  
  // Track details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [bpm, setBpm] = useState<number | undefined>();
  const [key, setKey] = useState('');
  const [isExplicit, setIsExplicit] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Auto-populate title from filename
    if (!title) {
      const filename = file.name.replace(/\.[^/.]+$/, "");
      setTitle(filename);
    }
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverUrl(url);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleNext = () => {
    if (step === 1 && audioFile) {
      setStep(2);
    } else if (step === 2 && title.trim()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleUpload = async () => {
    if (!audioFile || !title.trim()) return;

    setIsUploading(true);
    
    try {
      // In a real app, you'd upload to a service like AWS S3 or similar
      // For now, we'll simulate the upload process
      const trackData = {
        title,
        description,
        genre,
        tags,
        bpm,
        key,
        isExplicit,
        audioUrl, // In production, this would be the uploaded file URL
        coverImage: coverUrl, // In production, this would be the uploaded image URL
        duration: 0, // Would be detected from the audio file
        artistName: 'Current User' // Would come from auth context
      };

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onUpload(trackData);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up object URLs
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    
    // Reset state
    setStep(1);
    setAudioFile(null);
    setAudioUrl('');
    setCoverFile(null);
    setCoverUrl('');
    setTitle('');
    setDescription('');
    setGenre('');
    setTags([]);
    setNewTag('');
    setBpm(undefined);
    setKey('');
    setIsExplicit(false);
    
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Upload Your Track</h3>
        <p className="text-gray-400">Select your audio file to get started</p>
      </div>

      {/* Audio Upload */}
      <Card className="bg-dark-300 border-dark-400 border-dashed">
        <CardContent className="p-6">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          
          {audioFile ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{audioFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => audioInputRef.current?.click()}
              >
                Change File
              </Button>
            </div>
          ) : (
            <div
              className="text-center py-8 cursor-pointer hover:bg-dark-200 transition-colors rounded-lg"
              onClick={() => audioInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-white font-medium mb-2">Drop your audio file here</p>
              <p className="text-gray-400 text-sm">or click to browse</p>
              <p className="text-gray-500 text-xs mt-2">Supports MP3, WAV, FLAC (Max 50MB)</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Art Upload */}
      <Card className="bg-dark-300 border-dark-400 border-dashed">
        <CardContent className="p-4">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
          
          <div className="flex items-center space-x-4">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Cover"
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-dark-400 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <p className="text-white font-medium">Cover Art (Optional)</p>
              <p className="text-gray-400 text-sm">Square image recommended (1400x1400px)</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverFile ? 'Change' : 'Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Track Details</h3>
        <p className="text-gray-400">Add information about your track</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter track title"
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your track..."
            rows={3}
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-dark-300 border-dark-400">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bpm">BPM</Label>
            <Input
              id="bpm"
              type="number"
              value={bpm || ''}
              onChange={(e) => setBpm(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="120"
              className="bg-dark-300 border-dark-400"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g., C major, Am"
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex space-x-2 mb-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              className="bg-dark-300 border-dark-400"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="icon" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Preview & Upload</h3>
        <p className="text-gray-400">Review your track before publishing</p>
      </div>

      {audioUrl && (
        <AudioPlayer
          src={audioUrl}
          title={title}
          artist="You"
          coverImage={coverUrl}
        />
      )}

      <Card className="bg-dark-300 border-dark-400">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Title:</span>
            <span className="text-white">{title}</span>
          </div>
          {genre && (
            <div className="flex justify-between">
              <span className="text-gray-400">Genre:</span>
              <span className="text-white">{genre}</span>
            </div>
          )}
          {bpm && (
            <div className="flex justify-between">
              <span className="text-gray-400">BPM:</span>
              <span className="text-white">{bpm}</span>
            </div>
          )}
          {key && (
            <div className="flex justify-between">
              <span className="text-gray-400">Key:</span>
              <span className="text-white">{key}</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-dark-100 border-dark-400 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Track</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= stepNum
                    ? "bg-electric-500 text-white"
                    : "bg-dark-400 text-gray-400"
                )}
              >
                {stepNum}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
            disabled={isUploading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !audioFile) ||
                (step === 2 && !title.trim())
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={isUploading || !audioFile || !title.trim()}
              className="bg-electric-500 hover:bg-electric-600"
            >
              {isUploading ? 'Uploading...' : 'Upload Track'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
