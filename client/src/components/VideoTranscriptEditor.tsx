import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface VideoTranscriptEditorProps {
  videoUrl: string;
  initialTranscript?: string;
  onSave: (transcript: string) => Promise<void>;
}

export function VideoTranscriptEditor({
  videoUrl,
  initialTranscript = "",
  onSave,
}: VideoTranscriptEditorProps) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [audioUrl, setAudioUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateTranscript = async () => {
    if (!audioUrl && !videoUrl) {
      toast.error("Por favor proporciona una URL de audio o video");
      return;
    }

    setIsGenerating(true);
    try {
      // Call API to generate transcript using Whisper
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: audioUrl || videoUrl,
        }),
      });

      if (!response.ok) throw new Error("Error al generar transcripción");

      const data = await response.json();
      setTranscript(data.transcript);
      toast.success("Transcripción generada exitosamente");
    } catch (error) {
      toast.error("Error al generar transcripción");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      toast.error("La transcripción no puede estar vacía");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(transcript);
      toast.success("Transcripción guardada exitosamente");
    } catch (error) {
      toast.error("Error al guardar la transcripción");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transcripción del Video</CardTitle>
        <CardDescription>
          Genera automáticamente o pega manualmente la transcripción del video
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Pegar Transcripción</TabsTrigger>
            <TabsTrigger value="generate">Generar con IA</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div>
              <label className="text-sm font-medium">Transcripción</label>
              <Textarea
                placeholder="Pega la transcripción del video aquí..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-64 mt-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL de Audio/Video</label>
              <Input
                type="url"
                placeholder="https://ejemplo.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Proporciona una URL de audio (MP3, WAV, OGG) o video (MP4, WebM)
              </p>
            </div>

            <Button
              onClick={handleGenerateTranscript}
              disabled={isGenerating || (!audioUrl && !videoUrl)}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando transcripción...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generar Transcripción con IA
                </>
              )}
            </Button>

            {transcript && (
              <div>
                <label className="text-sm font-medium">Transcripción Generada</label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-64 mt-2"
                  placeholder="La transcripción aparecerá aquí..."
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving || !transcript.trim()}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar Transcripción"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
