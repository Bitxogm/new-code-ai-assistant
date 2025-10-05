import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Bot, User, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface InteractiveChatbotProps {
  code: string;
  language: string;
  analysisResults?: Record<string, string>;
  onSaveChat?: (messages: Message[]) => void;
}

export const InteractiveChatbot = ({
  code,
  language,
  analysisResults = {},
  onSaveChat
}: InteractiveChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const buildContext = () => {
    if (!analysisResults || Object.keys(analysisResults).length === 0) {
      return '';
    }

    return Object.entries(analysisResults)
      .map(([type, result]) => `### ${type.charAt(0).toUpperCase() + type.slice(1)}:\n${result}`)
      .join('\n\n');
  };

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const context = buildContext();
      // DESPUÉS:
      const data = await apiClient.chat({
        messages: [...messages, userMessage],
        code: code,
        language: language,
        context: context
      });

      if (data?.error) throw new Error(data.error);
      if (!data?.result) throw new Error('No se recibió respuesta del chatbot');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.result,
        timestamp: new Date()
      };

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // Auto-save chat if callback provided
        if (onSaveChat) {
          onSaveChat(newMessages);
        }
        return newMessages;
      });

    } catch (error: any) {
      console.error('Error in chat:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error:** ${error.message || 'No se pudo procesar tu consulta. Por favor intenta nuevamente.'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error en el chat",
        description: "Hubo un problema al procesar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copiado",
        description: "Mensaje copiado al portapapeles."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el mensaje.",
        variant: "destructive"
      });
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat limpiado",
      description: "Se ha limpiado el historial del chat."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getWelcomeMessage = () => {
    const codeInfo = code ? `código en ${language}` : 'tu código';
    const analysisInfo = Object.keys(analysisResults).length > 0
      ? ` y los análisis realizados (${Object.keys(analysisResults).join(', ')})`
      : '';

    return `¡Hola! 👋 Soy tu asistente inteligente de programación. He revisado tu ${codeInfo}${analysisInfo} y estoy listo para ayudarte.

Puedes preguntarme sobre:
• 📝 Explicaciones del código
• 🔧 Sugerencias de mejora
• 🐛 Detección de problemas
• 📚 Mejores prácticas
• ❓ Cualquier duda técnica

¿En qué puedo ayudarte?`;
  };

  return (
    <Card className={`glass-card transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Chatbot Interactivo
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Gemini
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? '📉' : '📈'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages Area */}
        <ScrollArea className={`bg-card/30 rounded-lg p-4 backdrop-blur border ${isExpanded ? 'h-[calc(100vh-240px)]' : 'h-96'}`}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-primary opacity-50" />
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {getWelcomeMessage()}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`group max-w-[85%] p-3 rounded-lg relative ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted/50 mr-4'
                      }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted/50 p-3 rounded-lg mr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input Area */}
        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregúntame sobre el código, análisis, mejoras o cualquier duda técnica..."
            className="min-h-[60px] max-h-[120px] resize-none bg-card border-border focus:ring-primary/50"
            disabled={isProcessing}
          />

          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {code ? (
                <span>✅ Código cargado ({language}) • {Object.keys(analysisResults).length} análisis disponibles</span>
              ) : (
                <span>⚠️ No hay código cargado</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isProcessing}
                size="sm"
                className="hover-glow"
              >
                <Send className="w-4 h-4 mr-2" />
                {isProcessing ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            💡 Tip: Usa Shift+Enter para salto de línea, Enter para enviar
          </div>
        </div>
      </CardContent>
    </Card>
  );
};