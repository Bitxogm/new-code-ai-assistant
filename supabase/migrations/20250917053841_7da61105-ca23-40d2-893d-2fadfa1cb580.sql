-- Create queries table to save user code queries
CREATE TABLE public.queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nueva consulta',
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  ai_response TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on queries
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Create policies for queries
CREATE POLICY "Users can view their own queries"
ON public.queries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries"
ON public.queries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queries"
ON public.queries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queries"
ON public.queries
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_queries_updated_at
  BEFORE UPDATE ON public.queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();