import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code2, TestTube, Shield, FileText, MessageSquare, Layers, Play, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { InteractiveChatbot } from '@/components/InteractiveChatbot';
import { useGlobalCode } from '@/hooks/useGlobalCodeContext';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';

interface MultiEditorWorkspaceProps {
  inputCode: string;
  language: string;
  onSaveExercise: (exerciseData: any) => void;
}

const EDITOR_CONFIGS = [
  {
    id: 'refactor',
    title: 'Refactorización',
    icon: Code2,
    color: 'bg-primary/20 text-primary border-primary/30',
    mode: 'refactor'
  },
  {
    id: 'tests',
    title: 'Tests Unitarios',
    icon: TestTube,
    color: 'bg-success/20 text-success border-success/30',
    mode: 'tests'
  },
  {
    id: 'security',
    title: 'Análisis Seguridad',
    icon: Shield,
    color: 'bg-warning/20 text-warning border-warning/30',
    mode: 'security'
  },
  {
    id: 'documentation',
    title: 'Documentación',
    icon: FileText,
    color: 'bg-info/20 text-info border-info/30',
    mode: 'documentation'
  },
  {
    id: 'modularization',
    title: 'Modularización',
    icon: Layers,
    color: 'bg-accent/20 text-accent-foreground border-accent/30',
    mode: 'modularization'
  }
];

const LANGUAGE_EXTENSIONS: Record<string, any> = {
  python: python(),
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  java: java(),
};

export const MultiEditorWorkspace = ({ inputCode, language, onSaveExercise }: MultiEditorWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState('refactor');
  const [editorContents, setEditorContents] = useState<Record<string, string>>({});
  const [processingStates, setProcessingStates] = useState<Record<string, boolean>>({});
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const { addAnalysisResult } = useGlobalCode();

  const getCurrentLanguageExtension = () => {
    return LANGUAGE_EXTENSIONS[language] || python();
  };

  const handleAnalyzeCode = async (mode: string) => {
    if (!inputCode.trim()) {
      toast({
        title: "⚠️ Código requerido",
        description: "Por favor ingresa el código que deseas analizar.",
        variant: "destructive"
      });
      return;
    }

    setProcessingStates(prev => ({ ...prev, [mode]: true }));

    try {

      const data = await apiClient.analyzeCode({
        code: inputCode,
        language: language,
        mode: mode
      });

      if (data?.error) throw new Error(data.error);
      setEditorContents(prev => ({ ...prev, [mode]: data.result }));

      // Add to global context for chat
      addAnalysisResult(mode, data.result);

      toast({
        title: "🎉 ¡Análisis completado!",
        description: `${EDITOR_CONFIGS.find(e => e.id === mode)?.title} generado correctamente.`
      });

    } catch (error: any) {
      console.error('Error analyzing code:', error);
      toast({
        title: "❌ Error en el análisis",
        description: error.message || "Ocurrió un error al analizar el código.",
        variant: "destructive"
      });
    } finally {
      setProcessingStates(prev => ({ ...prev, [mode]: false }));
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copiado",
        description: "El contenido ha sido copiado al portapapeles."
      });
    } catch (error) {
      toast({
        title: "❌ Error al copiar",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive"
      });
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatProcessing(true);

    try {
      // Create context from all editors
      const context = Object.entries(editorContents)
        .filter(([_, content]) => content)
        .map(([mode, content]) => `### ${EDITOR_CONFIGS.find(e => e.id === mode)?.title}:\n${content}`)
        .join('\n\n');

      const prompt = `Eres un asistente experto en programación que ayuda con análisis de código. 

**Código original:**
\`\`\`${language}
${inputCode}
\`\`\`

**Análisis realizados:**
${context}

**Pregunta del usuario:** ${userMessage}

Por favor responde de manera clara y específica basándote en el código y análisis proporcionados.`;

      const data = await apiClient.analyzeCode({
        code: prompt,
        language: 'markdown',
        mode: 'debug'
      });

      if (data?.error) throw new Error(data.error);

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }]);

    } catch (error: any) {
      console.error('Error in chat:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.message || 'No se pudo procesar tu consulta. Inténtalo nuevamente.'}`
      }]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleSaveCompleteExercise = () => {
    const exerciseData = {
      originalCode: inputCode,
      language: language,
      analyses: editorContents,
      chatHistory: chatMessages,
      timestamp: new Date().toISOString(),
      title: `Ejercicio completo - ${language} - ${new Date().toLocaleString()}`
    };

    onSaveExercise(exerciseData);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {EDITOR_CONFIGS.map((config) => {
              const Icon = config.icon;
              const isProcessing = processingStates[config.id];
              const hasContent = editorContents[config.id];

              return (
                <Button
                  key={config.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyzeCode(config.mode)}
                  disabled={isProcessing}
                  className={`relative ${hasContent ? config.color : ''} hover-glow`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Procesando...' : config.title}
                  {hasContent && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-success text-white rounded-full">
                      ✓
                    </Badge>
                  )}
                </Button>
              );
            })}
            <Button
              onClick={handleSaveCompleteExercise}
              className="ml-auto bg-gradient-primary hover:scale-105 transition-transform"
            >
              💾 Guardar Ejercicio Completo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-card/50 backdrop-blur">
          {EDITOR_CONFIGS.map((config) => (
            <TabsTrigger
              key={config.id}
              value={config.id}
              className="relative data-[state=active]:bg-primary/20"
            >
              <config.icon className="w-4 h-4 mr-2" />
              {config.title}
              {editorContents[config.id] && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full" />
              )}
            </TabsTrigger>
          ))}
          <TabsTrigger value="chat" className="data-[state=active]:bg-primary/20">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
        </TabsList>

        {EDITOR_CONFIGS.map((config) => (
          <TabsContent key={config.id} value={config.id}>
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <config.icon className="w-5 h-5" />
                    {config.title}
                    {editorContents[config.id] && (
                      <Badge variant="outline" className="text-xs bg-success/20 text-success">
                        ✓ Completado
                      </Badge>
                    )}
                  </CardTitle>
                  {editorContents[config.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(editorContents[config.id])}
                      className="hover-glow"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="code-editor">
                  <CodeMirror
                    value={editorContents[config.id] || `# ${config.title} - Ejecuta el análisis para ver los resultados aquí\n\n# El análisis se mostrará cuando hagas clic en el botón "${config.title}" arriba`}
                    height="500px"
                    extensions={[getCurrentLanguageExtension()]}
                    theme={oneDark}
                    editable={false}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      dropCursor: false,
                      allowMultipleSelections: false,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="chat">
          <InteractiveChatbot
            code={inputCode}
            language={language}
            analysisResults={editorContents}
            onSaveChat={(messages) => setChatMessages(messages.map(m => ({ role: m.role, content: m.content })))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};