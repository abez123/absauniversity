import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AIPromptEditorProps {
  courseId: number;
  onSave?: () => void;
}

export function AIPromptEditor({ courseId, onSave }: AIPromptEditorProps) {
  // Local state
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(2000);

  // tRPC queries and mutations
  const promptQuery = trpc.aiPrompts.get.useQuery({ courseId });

  const createMutation = trpc.aiPrompts.create.useMutation({
    onSuccess: () => {
      toast.success("Prompt guardado exitosamente");
      promptQuery.refetch();
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar el prompt");
    },
  });

  // Initialize from query data
  useEffect(() => {
    if (promptQuery.data) {
      setSystemPrompt(promptQuery.data.systemPrompt || "");
      setTemperature(parseFloat(promptQuery.data.temperature || "0.7"));
      setMaxTokens(promptQuery.data.maxTokens || 2000);
    }
  }, [promptQuery.data]);

  const handleSave = async () => {
    if (!systemPrompt.trim()) {
      toast.error("El prompt del sistema no puede estar vacío");
      return;
    }

    createMutation.mutate({
      courseId,
      systemPrompt,
      temperature,
      maxTokens,
    });
  };

  const isLoading = promptQuery.isLoading;
  const isSaving = createMutation.isPending;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configurar Agente de IA</CardTitle>
        <CardDescription>
          Personaliza el comportamiento del asistente de IA para este curso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="system-prompt">Instrucción del Sistema</Label>
          <Textarea
            id="system-prompt"
            placeholder="Eres un asistente educativo experto en [tema del curso]. Ayuda a los estudiantes a comprender los conceptos..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="min-h-40"
          />
          <p className="text-xs text-muted-foreground">
            Define cómo debe comportarse el asistente de IA. Sé específico sobre el rol, tono y restricciones.
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <Label htmlFor="temperature">
            Temperatura: <span className="font-mono">{temperature.toFixed(2)}</span>
          </Label>
          <Slider
            id="temperature"
            min={0}
            max={2}
            step={0.1}
            value={[temperature]}
            onValueChange={(value) => setTemperature(value[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Valores bajos (0.0-0.5) = respuestas más determinísticas. Valores altos (1.5-2.0) = respuestas más creativas.
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label htmlFor="max-tokens">Máximo de Tokens: {maxTokens}</Label>
          <Input
            id="max-tokens"
            type="number"
            min={100}
            max={4000}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Limita la longitud de las respuestas del IA. 1 token ≈ 4 caracteres.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>

        {/* Example Prompts */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">Ejemplos de Prompts:</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• "Eres un tutor de matemáticas paciente. Explica conceptos paso a paso."</li>
            <li>• "Eres un experto en programación. Ayuda con código y debugging."</li>
            <li>• "Eres un profesor de idiomas. Corrige errores y explica gramática."</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
