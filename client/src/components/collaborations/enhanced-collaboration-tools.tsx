import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  MessageCircle, 
  Music, 
  Mic, 
  Headphones, 
  Guitar, 
  Piano,
  Clock,
  MapPin,
  Star,
  Send,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLLABORATION_TYPES = [
  { value: 'vocal_feature', label: 'Vocal Feature', icon: Mic, description: 'Looking for a vocalist' },
  { value: 'beat_collab', label: 'Beat Collaboration', icon: Music, description: 'Collaborate on production' },
  { value: 'remix', label: 'Remix Project', icon: Headphones, description: 'Remix existing track' },
  { value: 'songwriting', label: 'Songwriting', icon: Piano, description: 'Write songs together' },
  { value: 'band_member', label: 'Band Member', icon: Guitar, description: 'Join or form a band' },
  { value: 'live_performance', label: 'Live Performance', icon: Users, description: 'Perform together live' }
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-orange-500' },
  { value: 'professional', label: 'Professional', color: 'bg-red-500' }
];

const GENRES = [
  'Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Country', 
  'Reggae', 'Trap', 'Drill', 'Lo-fi', 'House', 'Techno', 'Indie'
];

interface Collaboration {
  id: string;
  title: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    completedProjects: number;
  };
  type: string;
  genres: string[];
  skillLevel: string;
  location: string;
  remote: boolean;
  budget?: number;
  deadline?: string;
  requirements: string[];
  applicants: number;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  featured?: boolean;
}

// Mock collaboration data
const mockCollaborations: Collaboration[] = [
  {
    id: 'collab-1',
    title: 'Seeking Rapper for Dark Trap Beat',
    description: 'I have a sick dark trap beat ready and looking for a skilled rapper to lay down some fire bars. The beat has a haunting melody with heavy 808s.',
    creator: {
      id: 'user-2',
      name: 'BeatMaker Pro',
      avatar: 'https://picsum.photos/100/100?random=1',
      rating: 4.8,
      completedProjects: 23
    },
    type: 'vocal_feature',
    genres: ['Trap', 'Hip Hop'],
    skillLevel: 'intermediate',
    location: 'New York, NY',
    remote: true,
    budget: 500,
    deadline: '2025-09-15',
    requirements: ['Professional mic setup', 'Experience with trap music', 'Quick turnaround'],
    applicants: 12,
    status: 'open',
    createdAt: '2025-08-28T10:00:00Z',
    featured: true
  },
  {
    id: 'collab-2',
    title: 'R&B Singer Wanted for Smooth Track',
    description: 'Looking for a soulful R&B singer to collaborate on a smooth, jazzy track. Think D\'Angelo meets Frank Ocean vibes.',
    creator: {
      id: 'user-3',
      name: 'SoulBeats',
      avatar: 'https://picsum.photos/100/100?random=2',
      rating: 4.9,
      completedProjects: 31
    },
    type: 'vocal_feature',
    genres: ['R&B', 'Jazz'],
    skillLevel: 'advanced',
    location: 'Los Angeles, CA',
    remote: true,
    budget: 800,
    deadline: '2025-09-20',
    requirements: ['Professional studio access', 'Jazz/R&B experience', 'Creative input welcome'],
    applicants: 8,
    status: 'open',
    createdAt: '2025-08-27T15:30:00Z'
  },
  {
    id: 'collab-3',
    title: 'Producer Needed for Indie Rock Project',
    description: 'Indie rock band looking for a producer to help us refine our sound and work on our debut EP.',
    creator: {
      id: 'user-4',
      name: 'The Echoes',
      avatar: 'https://picsum.photos/100/100?random=3',
      rating: 4.6,
      completedProjects: 5
    },
    type: 'beat_collab',
    genres: ['Rock', 'Indie'],
    skillLevel: 'intermediate',
    location: 'Austin, TX',
    remote: false,
    budget: 1200,
    deadline: '2025-10-01',
    requirements: ['Studio experience', 'Rock production background', 'Available for in-person sessions'],
    applicants: 6,
    status: 'open',
    createdAt: '2025-08-26T09:15:00Z'
  }
];

interface CollaborationCardProps {
  collaboration: Collaboration;
  onApply: (id: string) => void;
  onMessage: (id: string) => void;
}

function CollaborationCard({ collaboration, onApply, onMessage }: CollaborationCardProps) {
  const collaborationType = COLLABORATION_TYPES.find(t => t.value === collaboration.type);
  const skillLevel = SKILL_LEVELS.find(s => s.value === collaboration.skillLevel);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 bg-dark-200 border-dark-400",
      collaboration.featured && "ring-2 ring-electric-500/50"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {collaborationType && <collaborationType.icon className="w-5 h-5 text-electric-500" />}
              <CardTitle className="text-lg text-white">{collaboration.title}</CardTitle>
              {collaboration.featured && (
                <Badge className="bg-electric-500">Featured</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(collaboration.status))} />
                <span className="capitalize">{collaboration.status.replace('_', ' ')}</span>
              </div>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(collaboration.createdAt)}
              </span>
            </div>
          </div>

          <div className="text-right">
            {collaboration.budget && (
              <div className="text-green-500 font-semibold">
                ${collaboration.budget}
              </div>
            )}
            <div className="text-xs text-gray-400">
              {collaboration.applicants} applicants
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed">
          {collaboration.description}
        </p>

        {/* Creator Info */}
        <div className="flex items-center space-x-3 p-3 bg-dark-300 rounded-lg">
          {collaboration.creator.avatar ? (
            <img
              src={collaboration.creator.avatar}
              alt={collaboration.creator.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-electric-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-white">{collaboration.creator.name}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                <span>{collaboration.creator.rating}</span>
              </div>
              <span>•</span>
              <span>{collaboration.creator.completedProjects} projects</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Genres:</span>
            <div className="flex flex-wrap gap-1">
              {collaboration.genres.map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Skill Level:</span>
            <div className="flex items-center space-x-2">
              <div className={cn("w-2 h-2 rounded-full", skillLevel?.color)} />
              <span className="text-white">{skillLevel?.label}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Location:</span>
            <div className="flex items-center space-x-1 text-white">
              <MapPin className="w-3 h-3" />
              <span>{collaboration.location}</span>
              {collaboration.remote && (
                <Badge variant="outline" className="ml-2 text-xs">Remote OK</Badge>
              )}
            </div>
          </div>

          {collaboration.deadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Deadline:</span>
              <span className="text-white">{formatDate(collaboration.deadline)}</span>
            </div>
          )}
        </div>

        {/* Requirements */}
        {collaboration.requirements.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Requirements:</p>
            <div className="space-y-1">
              {collaboration.requirements.map((req, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-gray-300">
                  <div className="w-1 h-1 bg-electric-500 rounded-full" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            className="flex-1 bg-electric-500 hover:bg-electric-600"
            onClick={() => onApply(collaboration.id)}
          >
            Apply Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMessage(collaboration.id)}
            className="flex items-center space-x-1"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Message</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateCollaborationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

function CreateCollaborationDialog({ isOpen, onClose, onCreate }: CreateCollaborationDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(true);
  const [budget, setBudget] = useState<number | undefined>();
  const [deadline, setDeadline] = useState('');
  const [requirements, setRequirements] = useState('');

  const handleCreate = () => {
    const collaborationData = {
      title,
      description,
      type,
      genres,
      skillLevel,
      location,
      remote,
      budget,
      deadline: deadline || undefined,
      requirements: requirements.split('\n').filter(req => req.trim())
    };

    onCreate(collaborationData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setType('');
    setGenres([]);
    setSkillLevel('');
    setLocation('');
    setRemote(true);
    setBudget(undefined);
    setDeadline('');
    setRequirements('');
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-dark-100 border-dark-400 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Collaboration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you looking for?"
              className="bg-dark-300 border-dark-400"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project in detail..."
              rows={4}
              className="bg-dark-300 border-dark-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Collaboration Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-dark-300 border-dark-400">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {COLLABORATION_TYPES.map((collaborationType) => (
                    <SelectItem key={collaborationType.value} value={collaborationType.value}>
                      <div className="flex items-center space-x-2">
                        <collaborationType.icon className="w-4 h-4" />
                        <span>{collaborationType.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Skill Level *</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger className="bg-dark-300 border-dark-400">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-2 h-2 rounded-full", level.color)} />
                        <span>{level.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State/Country"
                className="bg-dark-300 border-dark-400"
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={budget || ''}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
                className="bg-dark-300 border-dark-400"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-dark-300 border-dark-400"
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="List requirements (one per line)"
              rows={3}
              className="bg-dark-300 border-dark-400"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!title || !description || !type || !skillLevel}
              className="bg-electric-500 hover:bg-electric-600"
            >
              Create Collaboration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EnhancedCollaborationTools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredCollaborations = mockCollaborations.filter((collab) => {
    const matchesSearch = 
      collab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collab.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = selectedGenre === 'All' || collab.genres.includes(selectedGenre);
    const matchesType = selectedType === 'All' || collab.type === selectedType;
    
    return matchesSearch && matchesGenre && matchesType;
  });

  const handleApply = (collaborationId: string) => {
    console.log('Applying to collaboration:', collaborationId);
    // Implement application logic
  };

  const handleMessage = (collaborationId: string) => {
    console.log('Messaging about collaboration:', collaborationId);
    // Implement messaging logic
  };

  const handleCreateCollaboration = (data: any) => {
    console.log('Creating collaboration:', data);
    // Implement creation logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Collaboration Hub</h1>
        <p className="text-gray-400 text-lg">Connect with artists and create amazing music together</p>
      </div>

      {/* Filters and Create Button */}
      <Card className="bg-dark-200 border-dark-400">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search collaborations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-dark-300 border-dark-400"
                />
              </div>

              {/* Genre Filter */}
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-dark-300 border-dark-400">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Genres</SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-dark-300 border-dark-400">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {COLLABORATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-electric-500 hover:bg-electric-600 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Collaboration</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Found {filteredCollaborations.length} collaboration{filteredCollaborations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Collaborations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCollaborations.map((collaboration) => (
          <CollaborationCard
            key={collaboration.id}
            collaboration={collaboration}
            onApply={handleApply}
            onMessage={handleMessage}
          />
        ))}
      </div>

      {filteredCollaborations.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No collaborations found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-electric-500 hover:bg-electric-600"
          >
            Create the First Collaboration
          </Button>
        </div>
      )}

      {/* Create Collaboration Dialog */}
      <CreateCollaborationDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateCollaboration}
      />
    </div>
  );
}
