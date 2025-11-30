import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, UserCheck, LogIn, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AuthSectionProps {
  className?: string;
}

export const AuthSection = ({ className }: AuthSectionProps) => {
  const { user, loading, signOut } = useAuth();


  if (loading) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user) {
    const displayName = user.display_name ||
      user.email?.split('@')[0] ||
      'Usuario';

    return (
      <Card className={cn("glass-card hover-lift", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{displayName}</h3>
                {user.email && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default">
                <UserCheck className="w-3 h-3 mr-1" />
                Conectado
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hover-glow"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="w-3 h-3" />
            <span>Tus consultas se guardan automáticamente</span>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className={cn("glass-card hover-lift", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5" />
          Iniciar Sesión
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Inicia sesión para guardar tu historial y configuraciones
        </p>
      </CardHeader>
      <CardContent>
        <Link to="/auth">
          <Button className="w-full hero-button">
            <LogIn className="w-4 h-4 mr-2" />
            Acceder a tu cuenta
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};