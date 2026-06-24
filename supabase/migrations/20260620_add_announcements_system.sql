-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lgu_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- general, emergency, event, policy, etc.
  importance TEXT NOT NULL DEFAULT 'normal', -- normal, important, urgent
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcement reactions table
CREATE TABLE IF NOT EXISTS public.announcement_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- like, love, helpful, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id, reaction_type)
);

-- Create announcement comments table
CREATE TABLE IF NOT EXISTS public.announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_lgu_admin_id ON public.announcements(lgu_admin_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement_id ON public.announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_user_id ON public.announcement_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_announcement_id ON public.announcement_comments(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_user_id ON public.announcement_comments(user_id);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
-- LGU Admins can create announcements
CREATE POLICY "LGU admins can create announcements" 
ON public.announcements FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.primary_role = 'lgu_admin'
    AND profiles.lgu_approved = true
  )
);

-- LGU Admins can update their own announcements
CREATE POLICY "LGU admins can update own announcements" 
ON public.announcements FOR UPDATE 
TO authenticated 
USING (
  lgu_admin_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.primary_role = 'lgu_admin'
    AND profiles.lgu_approved = true
  )
);

-- LGU Admins can delete their own announcements
CREATE POLICY "LGU admins can delete own announcements" 
ON public.announcements FOR DELETE 
TO authenticated 
USING (
  lgu_admin_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.primary_role = 'lgu_admin'
    AND profiles.lgu_approved = true
  )
);

-- All authenticated users can view published announcements
CREATE POLICY "Authenticated users can view published announcements" 
ON public.announcements FOR SELECT 
TO authenticated 
USING (status = 'published');

-- LGU Admins can view all announcements including drafts
CREATE POLICY "LGU admins can view all announcements" 
ON public.announcements FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.primary_role = 'lgu_admin'
    AND profiles.lgu_approved = true
  )
);

-- RLS Policies for announcement reactions
-- Authenticated users can create reactions
CREATE POLICY "Authenticated users can create reactions" 
ON public.announcement_reactions FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions" 
ON public.announcement_reactions FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" 
ON public.announcement_reactions FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- All authenticated users can view reactions
CREATE POLICY "Authenticated users can view reactions" 
ON public.announcement_reactions FOR SELECT 
TO authenticated 
USING (true);

-- RLS Policies for announcement comments
-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" 
ON public.announcement_comments FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments" 
ON public.announcement_comments FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
ON public.announcement_comments FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- All authenticated users can view comments
CREATE POLICY "Authenticated users can view comments" 
ON public.announcement_comments FOR SELECT 
TO authenticated 
USING (true);

-- Create updated_at trigger for announcements
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_announcements
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_announcement_comments
BEFORE UPDATE ON public.announcement_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
