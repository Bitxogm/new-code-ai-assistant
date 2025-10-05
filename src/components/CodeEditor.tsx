import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Upload, Play, Code2, TestTube, Shield, GitBranch, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  className?: string;
}

const PROGRAMMING_LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'csharp', label: 'C#', icon: '🟣' },
  { value: 'go', label: 'Go', icon: '🔵' },
  { value: 'php', label: 'PHP', icon: '🟪' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
];

const ANALYSIS_MODES = [
  {
    id: 'refactor',
    label: 'Refactorizar',
    description: 'Optimiza y mejora tu código',
    icon: Code2,
    color: 'bg-primary/20 text-primary border-primary/30'
  },
  {
    id: 'test',
    label: 'Tests Unitarios',
    description: 'Genera tests automáticamente',
    icon: TestTube,
    color: 'bg-success/20 text-success border-success/30'
  },
  {
    id: 'security',
    label: 'Análisis Seguridad',
    description: 'Detecta vulnerabilidades',
    icon: Shield,
    color: 'bg-warning/20 text-warning border-warning/30'
  },
  {
    id: 'flowchart',
    label: 'Diagrama de Flujo',
    description: 'Describe el flujo lógico',
    icon: GitBranch,
    color: 'bg-info/20 text-info border-info/30'
  },
  {
    id: 'comments',
    label: 'Comentarios Inline',
    description: 'Añade comentarios explicativos',
    icon: MessageSquare,
    color: 'bg-accent/20 text-accent-foreground border-accent/30'
  }
];

export const CodeEditor = ({ className }: CodeEditorProps) => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedMode, setSelectedMode] = useState('refactor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputCode(content);
        toast({
          title: "Archivo cargado",
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
        title: "Copiado al portapapeles",
        description: "El código ha sido copiado correctamente."
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive"
      });
    }
  };

  const handleExecuteAgent = async () => {
    if (!inputCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Por favor ingresa el código que deseas analizar.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('processing');
    setOutputCode('');

    try {
      // Simulate AI processing - In real implementation, this would connect to Firebase/Gemini
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response based on selected mode
      const mockResponses = {
        refactor: `# Código refactorizado\n\n${inputCode}\n\n# Mejoras aplicadas:\n# - Optimización de variables\n# - Mejor legibilidad\n# - Eliminación de código duplicado`,
        test: `# Tests unitarios generados\n\nimport unittest\n\nclass TestCodigo(unittest.TestCase):\n    def test_funcion_principal(self):\n        # Test case generado automáticamente\n        pass\n\nif __name__ == '__main__':\n    unittest.main()`,
        security: `# Análisis de seguridad\n\n## Vulnerabilidades encontradas:\n- Ninguna vulnerabilidad crítica detectada\n- Recomendación: Validar entrada de usuario\n\n## Score de seguridad: 8/10`,
        flowchart: `# Descripción del flujo lógico\n\n1. Inicialización de variables\n2. Procesamiento principal\n3. Validación de resultados\n4. Retorno de valores\n\nEl código sigue un patrón lineal con validaciones apropiadas.`,
        comments: `${inputCode.split('\n').map(line => line ? `${line}  # Comentario explicativo` : line).join('\n')}`
      };

      setOutputCode(mockResponses[selectedMode as keyof typeof mockResponses] || mockResponses.refactor);
      setProcessingStatus('completed');
      
      toast({
        title: "¡Análisis completado!",
        description: `El ${ANALYSIS_MODES.find(m => m.id === selectedMode)?.label.toLowerCase()} ha sido generado correctamente.`
      });
    } catch (error) {
      setProcessingStatus('error');
      toast({
        title: "Error en el procesamiento",
        description: "Ocurrió un error al analizar el código. Inténtalo nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      idle: { text: 'Listo', className: 'bg-muted text-muted-foreground' },
      processing: { text: 'Procesando...', className: 'status-processing animate-pulse-glow' },
      completed: { text: 'Completado', className: 'status-success' },
      error: { text: 'Error', className: 'status-error' }
    };

    const config = statusConfig[processingStatus];
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  return (
    <div className={cn("w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up", className)}>
      {/* Header Controls */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="gradient-text text-2xl font-bold">
                Code AI Agent
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Refactorización y análisis inteligente de código con IA
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lenguaje de Programación</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="bg-card border-border hover:bg-accent/10 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.icon}</span>
                        {lang.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargar Archivo</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".py,.js,.ts,.java,.cs,.go,.php,.rb,.txt"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full hover-glow"
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir Archivo
              </Button>
            </div>

            {/* Execute Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ejecutar Análisis</label>
              <Button 
                onClick={handleExecuteAgent}
                disabled={isProcessing}
                className="hero-button w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                {isProcessing ? 'Procesando...' : 'Ejecutar Agent'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Mode Selector */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Modo de Análisis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona el tipo de análisis que deseas realizar
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {ANALYSIS_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300 text-left hover:scale-105",
                    selectedMode === mode.id 
                      ? mode.color + " scale-105" 
                      : "border-border hover:border-primary/30 bg-card/50"
                  )}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <h3 className="font-medium text-sm mb-1">{mode.label}</h3>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Code Editors */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Editor */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Código de Entrada</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyToClipboard(inputCode)}
                disabled={!inputCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="code-editor">
              <Textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder={`Pega aquí tu código ${PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.label || ''} o usa el botón "Subir Archivo"...`}
                className="min-h-[400px] font-mono text-sm bg-editor-bg border-editor-border resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Output Editor */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Resultado del Análisis</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyToClipboard(outputCode)}
                disabled={!outputCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="code-editor">
              {isProcessing ? (
                <div className="flex items-center justify-center h-[400px] bg-editor-bg rounded-lg">
                  <div className="text-center space-y-4">
                    <div className="animate-glow w-12 h-12 mx-auto rounded-full bg-primary/30 flex items-center justify-center">
                      <Code2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                    <p className="text-muted-foreground">Analizando código con IA...</p>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={outputCode}
                  readOnly
                  placeholder="El resultado del análisis aparecerá aquí..."
                  className="min-h-[400px] font-mono text-sm bg-editor-bg border-editor-border resize-none"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};