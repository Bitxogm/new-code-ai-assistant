import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Trash2, 
  Calendar,
  Code2,
  Search,
  FileText,
  Star
} from 'lucide-react';
import { useQueries, Query } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SavedQueriesProps {
  onLoadQuery: (query: Query) => void;
  className?: string;
}

export const SavedQueries = ({ onLoadQuery, className }: SavedQueriesProps) => {
  const { user } = useAuth();
  const { queries, loading, deleteQuery, toggleFavorite } = useQueries();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  if (!user) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Consultas guardadas</p>
              <p className="text-sm text-muted-foreground">
                Inicia sesión para ver tus consultas guardadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorites = !filterFavorites || query.is_favorite;
    return matchesSearch && matchesFavorites;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      python: '🐍',
      javascript: '🟨',
      typescript: '🔷',
      java: '☕',
      csharp: '🟣',
      go: '🔵',
      php: '🟪',
      ruby: '💎'
    };
    return icons[language] || '📄';
  };

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Consultas Guardadas
            <Badge variant="secondary">{queries.length}</Badge>
          </CardTitle>
          
          <Button
            variant={filterFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterFavorites(!filterFavorites)}
            className="hover-glow"
          >
            <Star className={cn("w-4 h-4", filterFavorites && "fill-current")} />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar consultas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Code2 className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {searchTerm ? 'No se encontraron consultas' : 'Sin consultas guardadas'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Prueba con otros términos de búsqueda' : 'Guarda tu primera consulta usando el botón "Guardar"'}
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredQueries.map((query) => (
                <Card key={query.id} className="bg-card/50 hover:bg-card transition-colors border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {query.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getLanguageIcon(query.language)} {query.language}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(query.updated_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(query.id)}
                            className="h-7 w-7 p-0 hover-glow"
                          >
                            <Heart className={cn(
                              "w-3 h-3", 
                              query.is_favorite && "fill-current text-red-500"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuery(query.id)}
                            className="h-7 w-7 p-0 hover-glow text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Code Preview */}
                      <div className="relative">
                        <pre className="text-xs text-muted-foreground bg-muted/30 rounded p-2 overflow-hidden">
                          <code className="line-clamp-3">
                            {query.code.slice(0, 150)}
                            {query.code.length > 150 && '...'}
                          </code>
                        </pre>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {query.tags.length > 0 && (
                            <div className="flex gap-1">
                              {query.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {query.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  +{query.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLoadQuery(query)}
                          className="hover-glow text-xs"
                        >
                          Cargar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};