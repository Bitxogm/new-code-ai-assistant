import { CodeEditorAdvanced } from '@/components/CodeEditorAdvanced';
import { AuthSection } from '@/components/AuthSection';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Code2, Zap, Shield, TestTube } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-6 animate-slide-up">
          <div className="space-y-4">
            <Badge className="px-4 py-2 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Gemini AI
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">Code AI Agent</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Refactoriza, analiza y optimiza tu código con inteligencia artificial avanzada.
              Soporte para múltiples lenguajes y análisis en tiempo real.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Code2, label: 'Refactoring', color: 'text-primary' },
              { icon: TestTube, label: 'Tests', color: 'text-success' },
              { icon: Shield, label: 'Seguridad', color: 'text-warning' },
              { icon: Zap, label: 'Tiempo Real', color: 'text-info' }
            ].map((feature, index) => (
              <Card key={index} className="glass-card hover-lift">
                <CardContent className="p-4 text-center">
                  <feature.icon className={`w-6 h-6 mx-auto mb-2 ${feature.color}`} />
                  <p className="text-sm font-medium">{feature.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Auth Section */}
        <div className="max-w-md mx-auto">
          <AuthSection />
        </div>

        {/* Main Code Editor */}
        <CodeEditorAdvanced />

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border/50">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Desarrollado con ❤️ usando React, SQLite y Google Gemini AI
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-muted/50">React 18</span>
              <span className="px-3 py-1 rounded-full bg-muted/50">SQLite</span>
              <span className="px-3 py-1 rounded-full bg-muted/50">Tailwind CSS</span>
              <span className="px-3 py-1 rounded-full bg-muted/50">TypeScript</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Code AI Agent by Victor Gonzalez. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;