import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { ThemePreferences, DEFAULT_THEME_PREFERENCES, getThemeColors, getHeaderBackground, getBorderRadius, getFontSizeMultiplier, PAGEHERO_DESIGNS } from '@/config/themes';

const THEME_STORAGE_KEY = 'ecoloop_theme_preferences';

export function useTheme() {
  const { user, profile } = useAuth();
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_THEME_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load theme preferences from localStorage first (for instant application)
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized) {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences(parsed);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error loading theme from localStorage:', error);
      }
      setLoading(false);
    }
  }, [initialized]);

  // Load theme preferences from profile and sync with localStorage
  useEffect(() => {
    if (profile?.theme_preferences) {
      const profilePreferences = profile.theme_preferences as ThemePreferences;
      // Only update if different from current preferences to prevent resets
      if (JSON.stringify(profilePreferences) !== JSON.stringify(preferences)) {
        setPreferences(profilePreferences);
        // Sync to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(profilePreferences));
        }
      }
    }
    setLoading(false);
  }, [profile]);

  // Apply theme to document
  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;
    const colors = getThemeColors(preferences.color_theme, preferences.dark_mode);

    // Apply font
    root.style.setProperty('--font-sans', preferences.font);
    root.style.setProperty('--font-display', preferences.font);

    // Apply colors
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);

    // Apply dark mode
    if (preferences.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply border radius
    const borderRadius = getBorderRadius(preferences.border_radius);
    root.style.setProperty('--radius', borderRadius);

    // Apply font size multiplier
    const fontSizeMultiplier = getFontSizeMultiplier(preferences.font_size);
    root.style.setProperty('--font-size-multiplier', fontSizeMultiplier.toString());

    // Apply header background class
    const header = document.querySelector('header');
    if (header) {
      header.setAttribute('data-header-bg', preferences.header_background);
    }

    // Apply PageHero design and custom background image
    const pageHero = document.querySelector('section');
    if (pageHero) {
      pageHero.setAttribute('data-pagehero-design', preferences.pagehero_design);
      if (preferences.pagehero_background_url) {
        pageHero.style.backgroundImage = `url(${preferences.pagehero_background_url})`;
        pageHero.style.backgroundSize = 'cover';
        pageHero.style.backgroundPosition = 'center';
        pageHero.style.backgroundRepeat = 'no-repeat';
      } else {
        pageHero.style.backgroundImage = '';
      }
    }
  }, [preferences, loading]);

  const updatePreferences = async (newPreferences: Partial<ThemePreferences>) => {
    if (!user) return;

    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    // Update localStorage immediately for instant feedback
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preferences: updated as any })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating theme preferences:', error);
      // Revert on error
      setPreferences(preferences);
      // Revert localStorage on error
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
      }
    }
  };

  const resetToDefault = async () => {
    if (!user) return;

    setPreferences(DEFAULT_THEME_PREFERENCES);

    // Update localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(DEFAULT_THEME_PREFERENCES));
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preferences: DEFAULT_THEME_PREFERENCES as any })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting theme preferences:', error);
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    resetToDefault,
  };
}
