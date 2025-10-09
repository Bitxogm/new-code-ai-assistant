import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, Upload, Play, Code2, TestTube, Shield, GitBranch, MessageSquare, Sparkles, Save, History, Layers } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQueries, Query } from '@/hooks/useQueries';
import { useGlobalCode } from '@/hooks/useGlobalCodeContext';
import { SavedQueries } from '@/components/SavedQueries';
import { MultiEditorWorkspace } from '@/components/MultiEditorWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api-client';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
interface CodeEditorAdvancedProps {
  className?: string;
}
const PROGRAMMING_LANGUAGES = [{
  value: 'python',
  label: 'Python',
  icon: '🐍',
  extension: python()
}, {
  value: 'javascript',
  label: 'JavaScript',
  icon: '🟨',
  extension: javascript()
}, {
  value: 'typescript',
  label: 'TypeScript',
  icon: '🔷',
  extension: javascript({
    typescript: true
  })
}, {
  value: 'java',
  label: 'Java',
  icon: '☕',
  extension: java()
}, {
  value: 'react',
  label: 'React/JSX',
  icon: '⚛️',
  extension: javascript({
    jsx: true
  })
}, {
  value: 'csharp',
  label: 'C#',
  icon: '🟣',
  extension: javascript()
}, {
  value: 'go',
  label: 'Go',
  icon: '🔵',
  extension: javascript()
}, {
  value: 'php',
  label: 'PHP',
  icon: '🟪',
  extension: javascript()
}, {
  value: 'ruby',
  label: 'Ruby',
  icon: '💎',
  extension: javascript()
}];
const ANALYSIS_MODES = [{
  id: 'refactor',
  label: 'Refactorizar',
  description: 'Optimiza y mejora tu código',
  icon: Code2,
  color: 'bg-primary/20 text-primary border-primary/30',
  gradient: 'from-purple-500 to-blue-500'
}, {
  id: 'tests',
  label: 'Tests Unitarios',
  description: 'Genera tests automáticamente',
  icon: TestTube,
  color: 'bg-success/20 text-success border-success/30',
  gradient: 'from-green-500 to-emerald-500'
}, {
  id: 'security',
  label: 'Análisis Seguridad',
  description: 'Detecta vulnerabilidades',
  icon: Shield,
  color: 'bg-warning/20 text-warning border-warning/30',
  gradient: 'from-yellow-500 to-orange-500'
}, {
  id: 'performance',
  label: 'Rendimiento',
  description: 'Optimiza el rendimiento',
  icon: GitBranch,
  color: 'bg-info/20 text-info border-info/30',
  gradient: 'from-blue-500 to-cyan-500'
}, {
  id: 'documentation',
  label: 'Documentación',
  description: 'Genera documentación completa',
  icon: MessageSquare,
  color: 'bg-accent/20 text-accent-foreground border-accent/30',
  gradient: 'from-pink-500 to-rose-500'
}, {
  id: 'modularization',
  label: 'Modularización',
  description: 'Sugiere separación por módulos',
  icon: Sparkles,
  color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  gradient: 'from-purple-500 to-indigo-500'
}];
export const CodeEditorAdvanced = ({
  className
}: CodeEditorAdvancedProps) => {
  const {
    user
  } = useAuth();
  const {
    saveQuery
  } = useQueries();
  const { code: globalCode, language: globalLanguage, outputLanguage: globalOutputLanguage, setCode, setLanguage, setOutputLanguage, addAnalysisResult } = useGlobalCode();
  const [inputCode, setInputCode] = useState(globalCode);
  const [outputCode, setOutputCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(globalLanguage);
  const [selectedOutputLanguage, setSelectedOutputLanguage] = useState(globalOutputLanguage);
  const [selectedMode, setSelectedMode] = useState('refactor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [queryTitle, setQueryTitle] = useState('');
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [showMultiEditor, setShowMultiEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Sync with global context
  useEffect(() => {
    setCode(inputCode);
  }, [inputCode, setCode]);

  useEffect(() => {
    setLanguage(selectedLanguage);
  }, [selectedLanguage, setLanguage]);

  useEffect(() => {
    setOutputLanguage(selectedOutputLanguage);
  }, [selectedOutputLanguage, setOutputLanguage]);

  const getCurrentLanguageExtension = () => {
    return PROGRAMMING_LANGUAGES.find(lang => lang.value === selectedLanguage)?.extension || python();
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        setInputCode(content);
        toast({
          title: "✅ Archivo cargado",
          description: `${file.name} ha sido cargado correctamente.`
        });
      };
      reader.readAsText(file);
    }
  };
  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copiado",
        description: "El código ha sido copiado al portapapeles."
      });
    } catch (error) {
      toast({
        title: "❌ Error al copiar",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive"
      });
    }
  };
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };
  const handleSaveQuery = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar consultas.",
        variant: "destructive"
      });
      return;
    }
    const title = queryTitle.trim() || `Consulta ${selectedLanguage} - ${new Date().toLocaleString()}`;
    await saveQuery(title, inputCode, selectedLanguage, outputCode);
    setQueryTitle('');
  };
  const handleLoadQuery = (query: Query) => {
    setInputCode(query.code);
    setSelectedLanguage(query.language);
    setOutputCode(query.ai_response || '');
    setQueryTitle(query.title);
    setShowSavedQueries(false);
    toast({
      title: "Consulta cargada",
      description: `"${query.title}" se cargó correctamente.`
    });
  };
  const handleSaveCompleteExercise = async (exerciseData: any) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar ejercicios completos.",
        variant: "destructive"
      });
      return;
    }
    await saveQuery(exerciseData.title, exerciseData.originalCode, exerciseData.language, JSON.stringify(exerciseData));
    toast({
      title: "💾 Ejercicio guardado",
      description: "El ejercicio completo se guardó exitosamente con todos los análisis y chat."
    });
  };
  const handleAnalyzeCode = async () => {
    if (!inputCode.trim()) {
      toast({
        title: "⚠️ Código requerido",
        description: "Por favor ingresa el código que deseas analizar.",
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    setProcessingStatus('processing');
    setOutputCode('');
    const progressInterval = simulateProgress();
    try {
      console.log('Calling analyze-code edge function...');
      const data = await apiClient.analyzeCode({
        code: inputCode,
        language: selectedLanguage,
        outputLanguage: selectedOutputLanguage,
        mode: selectedMode
      });
      clearInterval(progressInterval);
      setProgress(100);
      // (apiClient ya maneja los errores, así que solo necesitas esto:)
      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data?.result) { throw new Error('No se recibió respuesta del análisis de IA'); }
      setOutputCode(data.result);
      setProcessingStatus('completed');

      // Add to global analysis results
      addAnalysisResult(selectedMode, data.result);

      toast({
        title: "🎉 ¡Análisis completado!",
        description: `El ${ANALYSIS_MODES.find(m => m.id === selectedMode)?.label.toLowerCase()} ha sido generado correctamente con IA.`
      });
    } catch (error: any) {
      console.error('Error analyzing code:', error);
      clearInterval(progressInterval);
      setProcessingStatus('error');

      // Set a more detailed error message in the output
      setOutputCode(`❌ **Error en el análisis con IA**

**Mensaje de error:**
${error.message}

**Posibles causas:**
- Problema de conexión con el servidor
- API de Gemini no disponible temporalmente
- Código demasiado largo para analizar

**Soluciones sugeridas:**
1. Verifica tu conexión a internet
2. Intenta con un código más corto
3. Espera unos segundos e intenta de nuevo

Por favor inténtalo nuevamente en unos momentos.`);
      toast({
        title: "❌ Error en el procesamiento",
        description: error.message || "Ocurrió un error al analizar el código con IA. Inténtalo nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };
  const getStatusBadge = () => {
    const statusConfig = {
      idle: {
        text: '⏳ Listo para analizar',
        className: 'bg-muted text-muted-foreground'
      },
      processing: {
        text: `🤖 Procesando... ${Math.round(progress)}%`,
        className: 'status-processing animate-pulse-glow'
      },
      completed: {
        text: '✅ Análisis completado',
        className: 'status-success'
      },
      error: {
        text: '❌ Error en análisis',
        className: 'status-error'
      }
    };
    const config = statusConfig[processingStatus];
    return <Badge className={cn(config.className, "px-4 py-1.5")}>{config.text}</Badge>;
  };
  return <div className={cn("w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up", className)}>
    {/* Header Controls */}
    <Card className="glass-card hover-lift">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="gradient-text text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Code AI Agent
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Refactorización y análisis inteligente de código con IA • Powered by Gemini
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Input Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              📥 Lenguaje de Entrada
            </label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="bg-card border-border hover:bg-accent/10 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {PROGRAMMING_LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex items-center gap-2">
                    <span>{lang.icon}</span>
                    {lang.label}
                  </span>
                </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Output Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              📤 Lenguaje de Salida
            </label>
            <Select value={selectedOutputLanguage} onValueChange={setSelectedOutputLanguage}>
              <SelectTrigger className="bg-card border-border hover:bg-accent/10 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {PROGRAMMING_LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex items-center gap-2">
                    <span>{lang.icon}</span>
                    {lang.label}
                  </span>
                </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              📁 Cargar Archivo
            </label>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".py,.js,.ts,.java,.cs,.go,.php,.rb,.txt" className="hidden" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full hover-glow">
              <Upload className="w-4 h-4 mr-2" />
              Subir Archivo
            </Button>
          </div>

          {/* Save Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              💾 Guardar Consulta
            </label>
            <div className="flex gap-2">
              <Input placeholder="Título (opcional)" value={queryTitle} onChange={e => setQueryTitle(e.target.value)} disabled={!user} className="flex-1" />
              <Button variant="outline" onClick={handleSaveQuery} disabled={!user || !inputCode.trim()} className="hover-glow whitespace-nowrap">
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>

          {/* Multi-Editor Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              🔄 Modo Avanzado
            </label>
            <Button variant={showMultiEditor ? "default" : "outline"} onClick={() => setShowMultiEditor(!showMultiEditor)} className="w-full hover-glow">
              <Layers className="w-4 h-4 mr-2" />
              {showMultiEditor ? 'Modo Simple' : 'Multi-Editor'}
            </Button>
          </div>

          {/* History Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              📂 Historial
            </label>
            <Button variant="outline" onClick={() => setShowSavedQueries(!showSavedQueries)} disabled={!user} className="w-full hover-glow">
              <History className="w-4 h-4 mr-2" />
              {showSavedQueries ? 'Ocultar' : 'Ver Historial'}
            </Button>
          </div>
        </div>

        {/* Execute Button - Centered */}
        <div className="flex justify-center mt-4">
          <div className="space-y-2">
            <div className="text-center">
              <label className="text-sm font-medium text-foreground">
                🚀 Ejecutar Análisis
              </label>
            </div>
            <Button onClick={handleAnalyzeCode} disabled={isProcessing || showMultiEditor} size="lg" className="hero-button px-8 py-3">
              <Play className="w-4 h-4 mr-2" />
              {isProcessing ? 'Procesando...' : (selectedLanguage !== selectedOutputLanguage ? 'Traducir Código' : 'Ejecutar Análisis')}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Analizando con IA...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-gradient-primary h-2 rounded-full transition-all duration-300 animate-glow" style={{
              width: `${progress}%`
            }} />
          </div>
        </div>}
      </CardContent>
    </Card>

    {/* Analysis Mode Selector */}
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">🎯 Modo de Análisis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona el tipo de análisis que deseas realizar con IA
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ANALYSIS_MODES.map(mode => {
            const Icon = mode.icon;
            return <button key={mode.id} onClick={() => setSelectedMode(mode.id)} className={cn("p-4 rounded-lg border-2 transition-all duration-300 text-left hover:scale-105 group relative overflow-hidden", selectedMode === mode.id ? mode.color + " scale-105 shadow-glow" : "border-border hover:border-primary/30 bg-card/50 hover:bg-card")}>
              {selectedMode === mode.id && <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", mode.gradient)} />}
              <div className="relative z-10">
                <Icon className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-sm mb-1">{mode.label}</h3>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </div>
            </button>;
          })}
        </div>
      </CardContent>
    </Card>

    {/* Saved Queries Panel */}
    {showSavedQueries && user && <SavedQueries onLoadQuery={handleLoadQuery} className="animate-fade-in-up" />}

    {/* Multi-Editor Workspace */}
    {showMultiEditor ? (
      <MultiEditorWorkspace
        inputCode={inputCode}
        language={selectedLanguage}
        onSaveExercise={handleSaveCompleteExercise}
      />
    ) : (
      /* Code Editors */
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Editor */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                📝 Código de Entrada
                <Badge variant="outline" className="text-xs">
                  {PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.label}
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(inputCode)} disabled={!inputCode} className="hover-glow">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="code-editor">
              <CodeMirror value={inputCode} height="500px" theme={oneDark} extensions={[getCurrentLanguageExtension()]} onChange={value => setInputCode(value)} basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false
              }} className="text-sm font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Output Editor */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                🤖 {selectedLanguage !== selectedOutputLanguage ? `Código Traducido (${PROGRAMMING_LANGUAGES.find(l => l.value === selectedOutputLanguage)?.label})` : 'Resultado del Análisis IA'}
                {selectedMode && <Badge className={ANALYSIS_MODES.find(m => m.id === selectedMode)?.color}>
                  {selectedLanguage !== selectedOutputLanguage ? 'Traducción' : ANALYSIS_MODES.find(m => m.id === selectedMode)?.label}
                </Badge>}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(outputCode)} disabled={!outputCode} className="hover-glow">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="code-editor">
              {isProcessing ? <div className="flex items-center justify-center h-[500px] bg-editor-bg rounded-lg">
                <div className="text-center space-y-4">
                  <div className="animate-glow w-16 h-16 mx-auto rounded-full bg-primary/30 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium mb-2">
                      🤖 IA analizando tu código...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gemini está {selectedMode === 'refactor' ? 'refactorizando' : selectedMode === 'test' ? 'generando tests' : selectedMode === 'security' ? 'analizando seguridad' : selectedMode === 'flowchart' ? 'creando diagrama' : 'añadiendo comentarios'}
                    </p>
                  </div>
                </div>
              </div> : <CodeMirror value={outputCode} height="500px" theme={oneDark} extensions={[getCurrentLanguageExtension()]} editable={false} placeholder="El resultado del análisis IA aparecerá aquí..." basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false
              }} className="text-sm font-mono" />}
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </div>;
};