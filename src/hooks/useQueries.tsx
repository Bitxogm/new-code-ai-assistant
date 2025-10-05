import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Query {
  id: string;
  title: string;
  code: string;
  language: string;
  ai_response?: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const useQueries = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user queries
  const loadQueries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('queries')
        .insert({
          user_id: user.id,
          title,
          code,
          language,
          ai_response: aiResponse
        })
        .select()
        .single();

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('queries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('queries')
        .delete()
        .eq('id', id);

      if (error) throw error;

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