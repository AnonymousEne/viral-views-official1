import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Upload,
  Sparkles,
  Copy,
  Download,
  RotateCcw,
  Music,
  ChevronDown,
  ChevronUp,
  FileAudio,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "paused" | "stopped";
type GenerationState = "idle" | "generating" | "done" | "error";

interface LyricSection {
  label: string;
  content: string;
}

interface ParsedLyrics {
  title: string;
  concept: string;
  sections: LyricSection[];
  deliveryNotes: string;
  rhymeMap: string;
  raw: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  "any", "Hip-Hop", "Trap", "R&B", "Pop", "Soul", "Rock", "Alt-R&B",
  "Afrobeats", "Dancehall", "Country", "Folk", "Jazz", "Lo-Fi", "Gospel",
  "Electronic", "Indie", "Neo-Soul", "Drill", "Reggaeton",
];

const MOODS = [
  "auto-detect", "Euphoric", "Melancholic", "Angry", "Romantic", "Reflective",
  "Hype", "Chill", "Dark", "Triumphant", "Vulnerable", "Nostalgic",
  "Rebellious", "Spiritual", "Playful", "Mysterious",
];

const STYLES = [
  "modern", "Old School", "Storytelling", "Conscious", "Trap", "Melodic",
  "Spoken Word", "Cinematic", "Minimalist", "Experimental", "Classic",
];

const RHYME_SCHEMES = ["AABB", "ABAB", "ABCB", "AABA", "Free Verse", "Mixed"];

const SECTION_MARKERS = [
  "---SONG TITLE---",
  "---CONCEPT---",
  "---VERSE 1---",
  "---PRE-CHORUS---",
  "---CHORUS---",
  "---VERSE 2---",
  "---BRIDGE---",
  "---OUTRO---",
  "---DELIVERY NOTES---",
  "---RHYME MAP---",
];

const SECTION_COLORS: Record<string, string> = {
  "VERSE 1":       "text-purple-400",
  "PRE-CHORUS":    "text-blue-400",
  "CHORUS":        "text-electric-400 font-semibold",
  "VERSE 2":       "text-purple-400",
  "BRIDGE":        "text-amber-400",
  "OUTRO":         "text-rose-400",
  "DELIVERY NOTES":"text-emerald-400",
  "RHYME MAP":     "text-cyan-400",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseLyrics(raw: string): ParsedLyrics {
  const result: ParsedLyrics = { title: "", concept: "", sections: [], deliveryNotes: "", rhymeMap: "", raw };

  const lines = raw.split("\n");
  let currentSection = "";
  let buffer: string[] = [];

  const flush = () => {
    if (!currentSection) return;
    const content = buffer.join("\n").trim();
    if (currentSection === "SONG TITLE") { result.title = content; }
    else if (currentSection === "CONCEPT") { result.concept = content; }
    else if (currentSection === "DELIVERY NOTES") { result.deliveryNotes = content; }
    else if (currentSection === "RHYME MAP") { result.rhymeMap = content; }
    else { result.sections.push({ label: currentSection, content }); }
    buffer = [];
  };

  for (const line of lines) {
    const marker = SECTION_MARKERS.find((m) => line.trim() === m);
    if (marker) {
      flush();
      currentSection = marker.replace(/---/g, "").trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return result;
}

// ── Waveform Visualizer ───────────────────────────────────────────────────────

function MicWaveform({ isActive }: { isActive: boolean }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all",
            isActive
              ? "bg-gradient-to-t from-purple-600 to-electric-400 animate-pulse"
              : "bg-dark-400",
          )}
          style={{
            height: isActive
              ? `${20 + Math.abs(Math.sin((i / bars) * Math.PI * 3)) * 30}px`
              : "4px",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ label, content }: LyricSection) {
  const [collapsed, setCollapsed] = useState(false);
  const color = SECTION_COLORS[label] ?? "text-white";
  const isChorus = label === "CHORUS";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isChorus
          ? "border-electric-500/40 bg-gradient-to-br from-electric-500/10 to-purple-500/10"
          : "border-dark-400 bg-dark-200",
      )}
    >
      <button
        className="flex w-full items-center justify-between"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className={cn("text-xs font-bold tracking-widest uppercase", color)}>
          {label}
          {isChorus && <span className="ml-2 text-electric-400">★ Hook</span>}
        </span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronUp className="h-4 w-4 text-gray-500" />}
      </button>
      {!collapsed && (
        <pre className="mt-3 whitespace-pre-wrap font-mono text-sm leading-7 text-gray-200">
          {content}
        </pre>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LyricGenerator() {
  const { toast } = useToast();

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Form state
  const [genre, setGenre] = useState("any");
  const [mood, setMood] = useState("auto-detect");
  const [style, setStyle] = useState("modern");
  const [theme, setTheme] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [bpm, setBpm] = useState("");
  const [rhymeScheme, setRhymeScheme] = useState("AABB");

  // Generation state
  const [genState, setGenState] = useState<GenerationState>("idle");
  const [rawStream, setRawStream] = useState("");
  const [lyrics, setLyrics] = useState<ParsedLyrics | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // ── Speech Recognition setup ────────────────────────────────────────────

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        toast({ title: "Mic error", description: e.error, variant: "destructive" });
      }
    };

    recognition.onend = () => {
      setInterimTranscript("");
      if (recordingState === "recording") {
        setRecordingState("stopped");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording controls ───────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setInterimTranscript("");
    setAudioFileName(null);
    recognitionRef.current.start();
    setRecordingState("recording");
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecordingState("stopped");
  }, []);

  // ── File upload ──────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFileName(file.name);
    setTranscript("");
    setInterimTranscript("");
    toast({
      title: "Audio file loaded",
      description: `${file.name} — fill in the details below and generate lyrics.`,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Audio files only", variant: "destructive" });
      return;
    }
    setAudioFileName(file.name);
    setTranscript("");
  };

  // ── Lyric generation ─────────────────────────────────────────────────────

  const generateLyrics = async () => {
    setGenState("generating");
    setRawStream("");
    setLyrics(null);

    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 200);

    try {
      const res = await fetch("/api/lyric-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ transcript, genre, mood, style, theme, extraContext, bpm, rhymeScheme }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setGenState("done");
            setLyrics(parseLyrics(accumulated));
            return;
          }
          try {
            const { text, error } = JSON.parse(payload);
            if (error) throw new Error(error);
            if (text) {
              accumulated += text;
              setRawStream(accumulated);
            }
          } catch {
            // ignore partial JSON
          }
        }
      }
      setGenState("done");
      setLyrics(parseLyrics(accumulated));
    } catch (err: any) {
      setGenState("error");
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
  };

  const reset = () => {
    setGenState("idle");
    setRawStream("");
    setLyrics(null);
    setTranscript("");
    setInterimTranscript("");
    setAudioFileName(null);
    setRecordingState("idle");
  };

  const copyLyrics = () => {
    const text = lyrics?.raw ?? rawStream;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const downloadLyrics = () => {
    const text = lyrics?.raw ?? rawStream;
    const title = lyrics?.title ?? "lyrics";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasInput = transcript.trim() || audioFileName || theme.trim() || extraContext.trim();
  const isRecording = recordingState === "recording";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-electric-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-electric-400 to-rose-400 bg-clip-text text-transparent">
              Lyric Generator
            </h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Record your voice, freestyle, hum a melody — then let AI craft powerful, creative lyrics built around your sound.
          </p>
        </div>

        {/* Input panel */}
        <Card className="bg-dark-200 border-dark-400">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-400" /> Audio Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Record / Upload tabs */}
            <div className="grid grid-cols-2 gap-3">
              {/* Microphone */}
              <div className="space-y-3">
                <div
                  className={cn(
                    "rounded-xl border-2 border-dashed p-6 text-center transition-all",
                    isRecording
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-dark-400 hover:border-purple-500/50",
                  )}
                >
                  {!speechSupported ? (
                    <div className="text-gray-500 text-sm flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                      Speech recognition not supported in this browser. Use Chrome or Edge.
                    </div>
                  ) : (
                    <>
                      <MicWaveform isActive={isRecording} />
                      <p className="text-xs text-gray-400 mt-2 mb-4">
                        {isRecording ? "Listening… speak or freestyle" : "Tap to record your voice"}
                      </p>
                      <Button
                        size="sm"
                        variant={isRecording ? "destructive" : "default"}
                        className={cn(
                          "w-full",
                          !isRecording && "bg-gradient-to-r from-purple-600 to-electric-600 hover:from-purple-500 hover:to-electric-500",
                        )}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? (
                          <><MicOff className="h-4 w-4 mr-2" /> Stop</>
                        ) : (
                          <><Mic className="h-4 w-4 mr-2" /> Record</>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* File upload */}
              <div
                className={cn(
                  "rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
                  audioFileName
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-dark-400 hover:border-electric-500/50",
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-2">
                  {audioFileName ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                      <p className="text-xs text-emerald-300 font-medium truncate max-w-full px-2">
                        {audioFileName}
                      </p>
                      <p className="text-xs text-gray-500">Click to change</p>
                    </>
                  ) : (
                    <>
                      <FileAudio className="h-8 w-8 text-gray-500" />
                      <p className="text-xs text-gray-400">Drop audio file or click to browse</p>
                      <p className="text-xs text-gray-600">MP3, WAV, M4A, OGG…</p>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full border-dark-400 text-gray-300 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Audio
                </Button>
              </div>
            </div>

            {/* Live transcript area */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">
                Transcript / Freestyle Words
                {isRecording && (
                  <Badge className="ml-2 text-xs bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse">
                    LIVE
                  </Badge>
                )}
              </Label>
              <Textarea
                className="bg-dark-300 border-dark-400 text-white placeholder-gray-600 min-h-[100px] font-mono text-sm resize-none"
                placeholder="Your spoken words / freestyle will appear here automatically when recording. You can also type or paste lyrics, a poem, a story — anything you want the AI to build from…"
                value={transcript + interimTranscript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Style controls */}
        <Card className="bg-dark-200 border-dark-400">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="h-5 w-5 text-electric-400" /> Song Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wider">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-dark-300 border-dark-400 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-300 border-dark-400">
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g} className="text-white focus:bg-dark-400">
                        {g === "any" ? "Any Genre" : g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wider">Mood / Vibe</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-dark-300 border-dark-400 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-300 border-dark-400">
                    {MOODS.map((m) => (
                      <SelectItem key={m} value={m} className="text-white focus:bg-dark-400">
                        {m === "auto-detect" ? "Auto-detect" : m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wider">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-dark-300 border-dark-400 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-300 border-dark-400">
                    {STYLES.map((s) => (
                      <SelectItem key={s} value={s} className="text-white focus:bg-dark-400">
                        {s === "modern" ? "Modern" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wider">Rhyme Scheme</Label>
                <Select value={rhymeScheme} onValueChange={setRhymeScheme}>
                  <SelectTrigger className="bg-dark-300 border-dark-400 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-300 border-dark-400">
                    {RHYME_SCHEMES.map((r) => (
                      <SelectItem key={r} value={r} className="text-white focus:bg-dark-400">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wider">BPM / Tempo</Label>
                <Input
                  className="bg-dark-300 border-dark-400 text-white placeholder-gray-600"
                  placeholder="e.g. 140 BPM, slow, fast…"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase tracking-wider">Core Theme</Label>
                <Input
                  className="bg-dark-300 border-dark-400 text-white placeholder-gray-600"
                  placeholder="e.g. heartbreak, grind, love…"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Extra Context</Label>
              <Textarea
                className="bg-dark-300 border-dark-400 text-white placeholder-gray-600 resize-none"
                rows={2}
                placeholder="Describe the beat, the story, the feeling, what you want listeners to feel…"
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                size="lg"
                disabled={genState === "generating"}
                className="flex-1 bg-gradient-to-r from-purple-600 via-electric-600 to-rose-600 hover:from-purple-500 hover:via-electric-500 hover:to-rose-500 text-white font-bold text-base shadow-lg shadow-purple-500/20 transition-all"
                onClick={generateLyrics}
              >
                {genState === "generating" ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Crafting Lyrics…</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" /> Generate Lyrics</>
                )}
              </Button>
              {genState !== "idle" && (
                <Button size="lg" variant="outline" className="border-dark-400 text-gray-300" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        {(genState !== "idle") && (
          <div ref={outputRef} className="space-y-6">

            {/* Action bar */}
            {genState !== "generating" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {genState === "done" && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" /> Generated
                    </Badge>
                  )}
                  {genState === "error" && (
                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">
                      <AlertCircle className="h-3 w-3 mr-1" /> Error
                    </Badge>
                  )}
                </div>
                {(rawStream || lyrics) && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-dark-400 text-gray-300 hover:text-white" onClick={copyLyrics}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button size="sm" variant="outline" className="border-dark-400 text-gray-300 hover:text-white" onClick={downloadLyrics}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Generating stream preview */}
            {genState === "generating" && rawStream && (
              <Card className="bg-dark-200 border-purple-500/30">
                <CardContent className="pt-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-7 max-h-80 overflow-y-auto">
                    {rawStream}
                    <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse" />
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Structured lyrics display */}
            {lyrics && genState === "done" && (
              <div className="space-y-4">
                {/* Title & concept */}
                <div className="text-center space-y-2 py-6 border-b border-dark-400">
                  <h2 className="text-3xl md:text-4xl font-black text-white">
                    {lyrics.title || "Untitled"}
                  </h2>
                  {lyrics.concept && (
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed italic">
                      {lyrics.concept}
                    </p>
                  )}
                </div>

                {/* Song sections */}
                <div className="space-y-3">
                  {lyrics.sections.map((section, i) => (
                    <SectionCard key={i} {...section} />
                  ))}
                </div>

                {/* Delivery notes & rhyme map */}
                {(lyrics.deliveryNotes || lyrics.rhymeMap) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {lyrics.deliveryNotes && (
                      <Card className="bg-dark-200 border-dark-400">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold tracking-widest uppercase text-emerald-400">
                            Delivery Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-6">
                            {lyrics.deliveryNotes}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                    {lyrics.rhymeMap && (
                      <Card className="bg-dark-200 border-dark-400">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold tracking-widest uppercase text-cyan-400">
                            Rhyme Map
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-6">
                            {lyrics.rhymeMap}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Generate again */}
                <div className="pt-4 flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-electric-600 hover:from-purple-500 hover:to-electric-500 font-bold"
                    onClick={generateLyrics}
                  >
                    <Sparkles className="h-5 w-5 mr-2" /> Generate Another Version
                  </Button>
                  <Button size="lg" variant="outline" className="border-dark-400 text-gray-300" onClick={reset}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Start Over
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
