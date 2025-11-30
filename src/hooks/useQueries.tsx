import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Query {
  id: string;
  title: string;
  code: string;
  language: string;
  ai_response?: string;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}


export const useQueries = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Load user queries
  const loadQueries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/queries', {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to fetch queries');

      const data = await res.json();
      setQueries(data || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar consultas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save a new query
  const saveQuery = async (title: string, code: string, language: string, aiResponse?: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar consultas.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const res = await fetch('http://localhost:3001/api/queries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          code,
          language,
          ai_response: aiResponse
        })
      });

      if (!res.ok) throw new Error('Failed to save query');

      const data = await res.json();
      setQueries(prev => [data, ...prev]);

      toast({
        title: "Consulta guardada",
        description: `"${title}" se guardó correctamente.`
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Update an existing query
  const updateQuery = async (id: string, updates: Partial<Query>) => {
    if (!user) return null;

    try {
      const res = await fetch(`http://localhost:3001/api/queries/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update query');

      const data = await res.json();
      setQueries(prev => prev.map(q => q.id === id ? data : q));

      toast({
        title: "Consulta actualizada",
        description: "La consulta se actualizó correctamente."
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete a query
  const deleteQuery = async (id: string) => {
    if (!user) return false;

    try {
      const res = await fetch(`http://localhost:3001/api/queries/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to delete query');

      setQueries(prev => prev.filter(q => q.id !== id));

      toast({
        title: "Consulta eliminada",
        description: "La consulta se eliminó correctamente."
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const query = queries.find(q => q.id === id);
    if (!query) return;

    return await updateQuery(id, { is_favorite: !query.is_favorite });
  };

  // Load queries when user changes
  useEffect(() => {
    if (user) {
      loadQueries();
    } else {
      setQueries([]);
    }
  }, [user]);

  return {
    queries,
    loading,
    saveQuery,
    updateQuery,
    deleteQuery,
    toggleFavorite,
    loadQueries
  };
};