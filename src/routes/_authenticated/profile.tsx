import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, MessageCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import farmerBg from "@/assets/farmers-ecobg.jpg";
import restaurantBg from "@/assets/restaurant-food.jpg";
import localBg from "@/assets/siargao-locals.jpg";
import lguBg from "@/assets/LGU BG.jpg";
import { ChatMessenger } from "@/components/ChatMessenger";
import type { Database } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile — EcoLoop Siargao" }] }),
  component: ProfilePage,
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
  }),
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  barangay: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200),
});

function ProfilePage() {
  const { user, profile, refresh, roles, isLguAdmin } = useAuth();
  const { userId: otherUserId } = Route.useSearch();
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({ full_name: "", phone: "", barangay: "", address: "" });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        phone: profile.phone,
        barangay: profile.barangay,
        address: profile.address,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (otherUserProfile) {
      setPreviewUrl(otherUserProfile.profile_picture_url ?? null);
    } else if (profile) {
      setPreviewUrl(profile.profile_picture_url ?? null);
    }
  }, [otherUserProfile, profile]);

  useEffect(() => {
    if (!otherUserId || otherUserId === user?.id) {
      setOtherUserProfile(null);
      return;
    }

    const loadOtherUserProfile = async () => {
      setLoadingOtherProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherUserId)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
      } else {
        setOtherUserProfile(data);
      }
      setLoadingOtherProfile(false);
    };

    loadOtherUserProfile();
  }, [otherUserId, user?.id]);

  useEffect(() => {
    if (!profilePicture) {
      setPreviewUrl(profile?.profile_picture_url ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(profilePicture);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profilePicture, profile?.profile_picture_url]);

  const handleProfilePictureUpload = async () => {
    if (!profilePicture || !user) return;
    
    setUploading(true);
    try {
      const filePath = `profile-pictures/${user.id}/${Date.now()}-${profilePicture.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, profilePicture);

      if (uploadError) throw uploadError;

      const { data: publicData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path ?? filePath);

      const pictureUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: pictureUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfilePicture(null);
      toast.success(t("profile.profilePictureUpdated") || "Profile picture updated");
      await refresh();
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("Bucket not found") || msg.includes("no such bucket")) {
        toast.error(`Storage bucket "${STORAGE_BUCKET}" not found.`);
      } else if (msg.includes("row-level security")) {
        toast.error("Upload blocked by security policy.");
      } else {
        toast.error(`Could not upload picture: ${msg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(t("profile.fillAllPasswordFields") || "Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t("profile.passwordsDoNotMatch") || "New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t("profile.passwordMinLength") || "New password must be at least 6 characters");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success(t("profile.passwordUpdated") || "Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error((err?.message ?? t("profile.passwordUpdateFailed")) || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const bgImage = otherUserProfile?.primary_role === "farmer"
    ? farmerBg
    : otherUserProfile?.primary_role === "restaurant"
    ? restaurantBg
    : otherUserProfile?.primary_role === "lgu_admin"
    ? lguBg
    : localBg;

  const displayProfile = otherUserProfile || profile;
  const isOwnProfile = !otherUserId || otherUserId === user?.id;

  return (
    <>
      <PageHero
        eyebrow={isOwnProfile ? t("profile.myAccount") : t("profile.userProfile")}
        title={isOwnProfile ? t("profile.yourProfile") : `${displayProfile?.full_name}'s profile`}
        bgImage={bgImage}
      />
      <Container className="py-10">
        {!isOwnProfile && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.navigate({ to: "/profile", search: { userId: undefined } })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("profile.backToMyProfile")}
            </Button>
          </div>
        )}
        <Card className="mx-auto max-w-2xl p-6 border-2 border-primary/25 bg-gradient-to-br from-white to-secondary/10">
          <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="text-muted-foreground text-sm">{isOwnProfile ? user?.email : displayProfile?.id}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">{displayProfile?.primary_role}</Badge>
                {displayProfile?.primary_role === "lgu_admin" && (
                  <Badge variant="secondary" className="bg-secondary/20 text-primary border-primary/30">
                    LGU Admin
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-primary/40 bg-primary/10 flex items-center justify-center shadow-md">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-semibold text-primary">
                      {displayProfile?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-md group-hover:scale-110 duration-200">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePicture(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {!isOwnProfile && user && otherUserProfile && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                  onClick={() => setShowChat(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("profile.message")}
                </Button>
              )}
              {isOwnProfile && profilePicture && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                  onClick={handleProfilePictureUpload}
                  disabled={uploading}
                >
                  {uploading ? t("profile.uploading") : t("profile.savePhoto")}
                </Button>
              )}
            </div>
          </div>

          {isOwnProfile ? (
            <>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const parsed = schema.safeParse(form);
                  if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
                    return;
                  }
                  if (!user) return;
                  setBusy(true);
                  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
                  setBusy(false);
                  if (error) toast.error(error.message);
                  else {
                    toast.success("Profile updated");
                    await refresh();
                  }
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fn">{t("profile.fullName")}</Label>
                    <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph">{t("profile.phone")}</Label>
                    <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brgy">{t("profile.barangay")}</Label>
                  <Input id="brgy" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad">{t("profile.address")}</Label>
                  <Input id="ad" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
                </div>
                <Button type="submit" disabled={busy} className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">{busy ? t("profile.saving") : t("profile.saveChanges")}</Button>
              </form>

              <div className="border-t border-primary/20 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">{t("profile.changePassword")}</h3>
                <form
                  className="space-y-3"
                  onSubmit={handlePasswordChange}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">{t("profile.currentPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="border-primary/30 focus:border-primary focus:ring-primary/50 pr-10"
                        placeholder={t("profile.enterCurrentPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">{t("profile.newPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="border-primary/30 focus:border-primary focus:ring-primary/50 pr-10"
                          placeholder={t("profile.enterNewPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password">{t("profile.confirmPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="border-primary/30 focus:border-primary focus:ring-primary/50 pr-10"
                          placeholder={t("profile.confirmNewPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={updatingPassword}
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {updatingPassword ? t("profile.updating") : t("profile.updatePassword")}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("profile.fullName")}</Label>
                  <div className="text-sm font-medium">{displayProfile?.full_name}</div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.phone")}</Label>
                  <div className="text-sm font-medium">{displayProfile?.phone}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("profile.barangay")}</Label>
                <div className="text-sm font-medium">{displayProfile?.barangay}</div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("profile.address")}</Label>
                <div className="text-sm font-medium">{displayProfile?.address}</div>
              </div>
            </div>
          )}
        </Card>
      </Container>

      <ChatMessenger
        open={showChat}
        onOpenChange={setShowChat}
        otherUserId={otherUserProfile?.id}
        otherUserName={otherUserProfile?.full_name}
      />
    </>
  );
}
