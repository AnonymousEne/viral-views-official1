import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Trophy, 
  Users, 
  Clock, 
  DollarSign, 
  CalendarIcon, 
  Plus, 
  X, 
  Zap,
  Music,
  Mic,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const BATTLE_TYPES = [
  { value: 'freestyle', label: 'Freestyle Battle', icon: Mic, description: 'Live rap battles' },
  { value: 'beat_battle', label: 'Beat Battle', icon: Music, description: 'Producer showdowns' },
  { value: 'remix', label: 'Remix Challenge', icon: Headphones, description: 'Remix competitions' },
  { value: 'cypher', label: 'Cypher', icon: Users, description: 'Group collaborations' }
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-500' },
  { value: 'pro', label: 'Professional', color: 'bg-purple-500' }
];

interface CreateBattleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBattle: (battleData: any) => void;
}

export default function CreateBattleDialog({
  isOpen,
  onClose,
  onCreateBattle
}: CreateBattleDialogProps) {
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Rules & Settings, 3: Review
  const [isCreating, setIsCreating] = useState(false);

  // Battle basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [battleType, setBattleType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // Battle settings
  const [maxParticipants, setMaxParticipants] = useState<number>(8);
  const [entryFee, setEntryFee] = useState<number>(0);
  const [prizePool, setPrizePool] = useState<number>(0);
  const [deadline, setDeadline] = useState<Date>();
  const [battleDuration, setBattleDuration] = useState<number>(5); // days
  
  // Rules and requirements
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [enableVoting, setEnableVoting] = useState(true);

  // Validation
  const isStep1Valid = title.trim() && battleType && difficulty;
  const isStep2Valid = maxParticipants > 0 && battleDuration > 0;

  const addRule = () => {
    if (newRule.trim() && !rules.includes(newRule.trim())) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (ruleToRemove: string) => {
    setRules(rules.filter(rule => rule !== ruleToRemove));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (!isStep1Valid || !isStep2Valid) return;

    setIsCreating(true);
    
    try {
      const battleData = {
        title,
        description,
        type: battleType,
        difficulty,
        maxParticipants,
        entryFee,
        prizePool,
        deadline: deadline?.toISOString(),
        duration: battleDuration,
        rules,
        requirements,
        isPublic,
        allowSpectators,
        enableVoting,
        status: 'upcoming'
      };

      await onCreateBattle(battleData);
      handleClose();
    } catch (error) {
      console.error('Failed to create battle:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setBattleType('');
    setDifficulty('');
    setMaxParticipants(8);
    setEntryFee(0);
    setPrizePool(0);
    setDeadline(undefined);
    setBattleDuration(5);
    setRules([]);
    setNewRule('');
    setRequirements('');
    setIsPublic(true);
    setAllowSpectators(true);
    setEnableVoting(true);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="w-12 h-12 mx-auto text-electric-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Create a Battle</h3>
        <p className="text-gray-400">Set up your competition and watch the creativity flow</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Battle Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter an exciting battle title"
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this battle is about..."
            rows={3}
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div>
          <Label>Battle Type *</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {BATTLE_TYPES.map((type) => (
              <Card
                key={type.value}
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2",
                  battleType === type.value
                    ? "border-electric-500 bg-electric-500/10"
                    : "border-dark-400 hover:border-dark-300"
                )}
                onClick={() => setBattleType(type.value)}
              >
                <CardContent className="p-4 text-center">
                  <type.icon className="w-8 h-8 mx-auto mb-2 text-electric-500" />
                  <h4 className="font-medium text-white text-sm">{type.label}</h4>
                  <p className="text-xs text-gray-400 mt-1">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label>Difficulty Level *</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <div
                key={level.value}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  difficulty === level.value
                    ? "border-electric-500 bg-electric-500/10"
                    : "border-dark-400 hover:border-dark-300"
                )}
                onClick={() => setDifficulty(level.value)}
              >
                <div className={cn("w-3 h-3 rounded-full", level.color)} />
                <span className="text-white font-medium">{level.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="w-12 h-12 mx-auto text-electric-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Battle Settings</h3>
        <p className="text-gray-400">Configure the rules and parameters</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxParticipants">Max Participants</Label>
          <Input
            id="maxParticipants"
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            min="2"
            max="100"
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div>
          <Label htmlFor="battleDuration">Duration (days)</Label>
          <Input
            id="battleDuration"
            type="number"
            value={battleDuration}
            onChange={(e) => setBattleDuration(Number(e.target.value))}
            min="1"
            max="30"
            className="bg-dark-300 border-dark-400"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entryFee">Entry Fee ($)</Label>
          <Input
            id="entryFee"
            type="number"
            value={entryFee}
            onChange={(e) => setEntryFee(Number(e.target.value))}
            min="0"
            step="0.01"
            className="bg-dark-300 border-dark-400"
          />
        </div>

        <div>
          <Label htmlFor="prizePool">Prize Pool ($)</Label>
          <Input
            id="prizePool"
            type="number"
            value={prizePool}
            onChange={(e) => setPrizePool(Number(e.target.value))}
            min="0"
            step="0.01"
            className="bg-dark-300 border-dark-400"
          />
        </div>
      </div>

      <div>
        <Label>Registration Deadline</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-dark-300 border-dark-400",
                !deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-dark-200 border-dark-400">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Battle Rules</Label>
        <div className="flex space-x-2 mt-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Add a rule..."
            className="bg-dark-300 border-dark-400"
            onKeyPress={(e) => e.key === 'Enter' && addRule()}
          />
          <Button onClick={addRule} size="icon" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {rules.map((rule, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center space-x-1 bg-dark-300"
            >
              <span>{rule}</span>
              <button
                onClick={() => removeRule(rule)}
                className="ml-1 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="requirements">Requirements</Label>
        <Textarea
          id="requirements"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Any specific requirements for participants..."
          rows={2}
          className="bg-dark-300 border-dark-400"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isPublic">Public Battle</Label>
            <p className="text-sm text-gray-400">Anyone can see and join this battle</p>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allowSpectators">Allow Spectators</Label>
            <p className="text-sm text-gray-400">Let others watch the battle</p>
          </div>
          <Switch
            id="allowSpectators"
            checked={allowSpectators}
            onCheckedChange={setAllowSpectators}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enableVoting">Enable Voting</Label>
            <p className="text-sm text-gray-400">Let community vote on winners</p>
          </div>
          <Switch
            id="enableVoting"
            checked={enableVoting}
            onCheckedChange={setEnableVoting}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedBattleType = BATTLE_TYPES.find(t => t.value === battleType);
    const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.value === difficulty);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto text-electric-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Review & Create</h3>
          <p className="text-gray-400">Check everything looks good before launching</p>
        </div>

        <Card className="bg-dark-300 border-dark-400">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              {selectedBattleType && <selectedBattleType.icon className="w-5 h-5" />}
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <div className={cn("w-2 h-2 rounded-full", selectedDifficulty?.color)} />
                <span>{selectedDifficulty?.label}</span>
              </Badge>
              <span className="text-gray-400 text-sm">
                <Users className="w-4 h-4 inline mr-1" />
                {maxParticipants} max participants
              </span>
              <span className="text-gray-400 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                {battleDuration} days
              </span>
            </div>

            {description && (
              <p className="text-gray-300">{description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              {entryFee > 0 && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Entry Fee: ${entryFee}</span>
                </div>
              )}
              {prizePool > 0 && (
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-gold-500" />
                  <span className="text-sm">Prize Pool: ${prizePool}</span>
                </div>
              )}
            </div>

            {deadline && (
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Deadline: {format(deadline, "PPP")}</span>
              </div>
            )}

            {rules.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">Rules:</h4>
                <div className="flex flex-wrap gap-1">
                  {rules.map((rule, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {rule}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-dark-100 border-dark-400 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Battle</DialogTitle>
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
            disabled={isCreating}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid)
              }
              className="bg-electric-500 hover:bg-electric-600"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !isStep1Valid || !isStep2Valid}
              className="bg-electric-500 hover:bg-electric-600"
            >
              {isCreating ? 'Creating...' : 'Create Battle'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
