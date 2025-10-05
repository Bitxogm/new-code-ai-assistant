import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader
} from '@/components/ui/sidebar';
import { MessageSquare, Send, Bot, User, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  code: string;
  language: string;
  analysisResults?: Record<string, string>;
}

export const ChatSidebar = ({ code, language, analysisResults = {} }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

      setMessages(prev => [...prev, assistantMessage]);

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

    return `¡Hola! 👋 Soy tu asistente de programación. He revisado tu ${codeInfo}${analysisInfo}.

Puedes preguntarme sobre:
• 📝 Explicaciones del código
• 🔧 Sugerencias de mejora  
• 🐛 Detección de problemas
• 📚 Mejores prácticas
• ❓ Cualquier duda técnica

¿En qué puedo ayudarte?`;
  };

  return (
    <Sidebar className="w-80 border-l border-border hidden lg:flex">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-semibold">Chat IA</span>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Gemini
            </Badge>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground p-1 h-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex-1">
          <SidebarGroupContent className="h-full flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-primary opacity-50" />
                    <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {getWelcomeMessage()}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                      )}

                      <div
                        className={`group max-w-[85%] p-2 rounded-lg text-xs leading-relaxed ${message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50'
                          }`}
                      >
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/20">
                          <span className="text-[10px] opacity-60">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0 h-auto"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-accent-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isProcessing && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3 text-primary animate-pulse" />
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame sobre el código..."
                className="min-h-[60px] max-h-[100px] resize-none text-sm bg-card border-border focus:ring-primary/50"
                disabled={isProcessing}
              />

              <div className="flex justify-between items-center">
                <div className="text-[10px] text-muted-foreground">
                  {code ? (
                    <span>✅ {language} • {Object.keys(analysisResults).length} análisis</span>
                  ) : (
                    <span>⚠️ Sin código</span>
                  )}
                </div>

                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isProcessing}
                  size="sm"
                  className="h-7 px-2"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Enviar
                </Button>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};