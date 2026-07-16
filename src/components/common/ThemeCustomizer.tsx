import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/use-theme';
import { FONTS, COLOR_THEMES, HEADER_BACKGROUNDS, getHeaderBackground, getThemeColors, BORDER_RADIUS_OPTIONS, FONT_SIZE_OPTIONS, getFontSizeMultiplier, PAGEHERO_DESIGNS } from '@/config/themes';
import { Palette, Type, Layout, RotateCcw, Moon, Sun, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function ThemeCustomizer({ trigger }: { trigger: React.ReactNode }) {
  const { preferences, loading, updatePreferences, resetToDefault } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pageheroImageFile, setPageheroImageFile] = useState<File | null>(null);
  const [uploadingPagehero, setUploadingPagehero] = useState(false);

  const handleFontChange = (font: string) => {
    updatePreferences({ font });
  };

  const handleColorThemeChange = (color_theme: string) => {
    updatePreferences({ color_theme });
  };

  const handleHeaderBackgroundChange = (header_background: string) => {
    updatePreferences({ header_background });
  };

  const handleDarkModeToggle = () => {
    updatePreferences({ dark_mode: !preferences.dark_mode });
  };

  const handleBorderRadiusChange = (border_radius: string) => {
    updatePreferences({ border_radius });
  };

  const handleFontSizeChange = (font_size: string) => {
    updatePreferences({ font_size });
  };

  const handlePageHeroDesignChange = (pagehero_design: string) => {
    updatePreferences({ pagehero_design });
  };

  const handlePageheroImageUpload = async () => {
    if (!pageheroImageFile || !user) return;

    setUploadingPagehero(true);
    try {
      const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";
      const filePath = `pagehero-backgrounds/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${pageheroImageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, pageheroImageFile);

      if (uploadError) throw uploadError;

      const { data: publicData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path ?? filePath);

      const imageUrl = publicData.publicUrl;
      await updatePreferences({ pagehero_background_url: imageUrl });
      setPageheroImageFile(null);
      toast.success('PageHero background uploaded successfully');
    } catch (error) {
      console.error('Error uploading PageHero image:', error);
      toast.error('Failed to upload PageHero image');
    } finally {
      setUploadingPagehero(false);
    }
  };

  const handleRemovePageheroImage = async () => {
    await updatePreferences({ pagehero_background_url: null });
    toast.success('PageHero background removed');
  };

  const handleReset = async () => {
    await resetToDefault();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Customize Your Theme
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Dark Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {preferences.dark_mode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Dark Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDarkModeToggle}
                variant={preferences.dark_mode ? "default" : "outline"}
                className="w-full"
              >
                {preferences.dark_mode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
              </Button>
            </CardContent>
          </Card>

          {/* Font Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="h-5 w-5" />
                Font
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {FONTS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontChange(font.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      preferences.font === font.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                Color Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleColorThemeChange(theme.value)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      preferences.color_theme === theme.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: preferences.dark_mode ? theme.darkColors?.primary : theme.colors.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: preferences.dark_mode ? theme.darkColors?.secondary : theme.colors.secondary }}
                      />
                    </div>
                    <p className="text-sm font-medium">{theme.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Border Radius Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layout className="h-5 w-5" />
                Border Radius
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {BORDER_RADIUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleBorderRadiusChange(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.border_radius === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ borderRadius: option.cssValue }}
                  >
                    <p className="text-sm font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Size Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="h-5 w-5" />
                Font Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {FONT_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFontSizeChange(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.font_size === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ fontSize: `calc(1rem * ${option.multiplier})` }}
                  >
                    <p className="font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Header Background Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layout className="h-5 w-5" />
                Header Background
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {HEADER_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => handleHeaderBackgroundChange(bg.value)}
                    className={`relative h-20 rounded-lg border-2 transition-all overflow-hidden ${
                      preferences.header_background === bg.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-full ${bg.gradient}`} />
                    <p className="absolute bottom-1 left-1 right-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded px-1 py-0.5 text-center">
                      {bg.label}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PageHero Design Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                PageHero Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {PAGEHERO_DESIGNS.map((design) => (
                  <button
                    key={design.value}
                    onClick={() => handlePageHeroDesignChange(design.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      preferences.pagehero_design === design.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{design.label}</p>
                    <p className="text-xs text-slate-600">{design.description}</p>
                  </button>
                ))}
              </div>

              {/* Custom PageHero Background Image Upload */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Custom PageHero Background Image</p>
                {preferences.pagehero_background_url ? (
                  <div className="relative">
                    <img
                      src={preferences.pagehero_background_url}
                      alt="Custom PageHero background"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={handleRemovePageheroImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPageheroImageFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                      id="pagehero-image-upload"
                    />
                    <label htmlFor="pagehero-image-upload">
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Custom PageHero Image
                        </span>
                      </Button>
                    </label>
                    {pageheroImageFile && (
                      <Button
                        onClick={handlePageheroImageUpload}
                        disabled={uploadingPagehero}
                        className="w-full"
                      >
                        {uploadingPagehero ? 'Uploading...' : 'Save PageHero Image'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Preview Header */}
                <div className={`p-4 rounded-lg border-2 ${getHeaderBackground(preferences.header_background)}`} style={{ borderRadius: 'var(--radius)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: getThemeColors(preferences.color_theme, preferences.dark_mode).primary }}>
                      E
                    </div>
                    <span className="font-semibold" style={{ fontFamily: preferences.font, fontSize: `calc(1rem * ${getFontSizeMultiplier(preferences.font_size)})` }}>
                      EcoLoop Preview
                    </span>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-4 rounded-lg border-2 border-border bg-background" style={{ borderRadius: 'var(--radius)' }}>
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: preferences.font, fontSize: `calc(1.25rem * ${getFontSizeMultiplier(preferences.font_size)})` }}>
                    Sample Heading
                  </h3>
                  <p className="text-sm mb-3" style={{ fontFamily: preferences.font, fontSize: `calc(0.875rem * ${getFontSizeMultiplier(preferences.font_size)})` }}>
                    This is how your content will look with the selected theme. The font, colors, and header background are all customizable.
                  </p>
                  <Button
                    className="w-full"
                    style={{
                      backgroundColor: getThemeColors(preferences.color_theme, preferences.dark_mode).primary,
                      fontFamily: preferences.font,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    Sample Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="md:col-span-2 flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Default
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="flex-1"
              style={{ backgroundColor: getThemeColors(preferences.color_theme, preferences.dark_mode).primary }}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
