import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Container, PageHero, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, MessageCircle, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Palette } from "lucide-react";
import { ChatMessenger } from "@/components/messaging/ChatMessenger";
import { ThemeCustomizer } from "@/components/common/ThemeCustomizer";
import { ListingCard } from "@/components/marketplace/ListingCard";
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
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [validId, setValidId] = useState<File | null>(null);
  const [validIdPreview, setValidIdPreview] = useState<string | null>(null);
  const [uploadingValidId, setUploadingValidId] = useState(false);
  const [validIdSaved, setValidIdSaved] = useState(false);
  const [userListings, setUserListings] = useState<Database["public"]["Tables"]["marketplace_listings"]["Row"][]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        phone: profile.phone,
        barangay: profile.barangay,
        address: profile.address,
      });
      setValidIdPreview(profile.government_id_url ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (otherUserProfile) {
      setPreviewUrl(otherUserProfile.profile_picture_url ?? null);
      setCoverPreviewUrl(otherUserProfile.cover_photo_url ?? null);
    } else if (profile) {
      setPreviewUrl(profile.profile_picture_url ?? null);
      setCoverPreviewUrl(profile.cover_photo_url ?? null);
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

  useEffect(() => {
    if (!coverPhoto) {
      setCoverPreviewUrl(profile?.cover_photo_url ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(coverPhoto);
    setCoverPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverPhoto, profile?.cover_photo_url]);

  useEffect(() => {
    if (!validId) {
      setValidIdPreview(profile?.government_id_url ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(validId);
    setValidIdPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [validId, profile?.government_id_url]);

  useEffect(() => {
    const targetUserId = otherUserId || user?.id;
    if (!targetUserId) {
      setUserListings([]);
      return;
    }

    const loadUserListings = async () => {
      setLoadingListings(true);
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading user listings:", error);
      } else {
        setUserListings(data ?? []);
      }
      setLoadingListings(false);
    };

    loadUserListings();
  }, [otherUserId, user?.id]);

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
      toast.success("Profile picture updated successfully!");
      await refresh();
    } catch (error: any) {
      toast.error(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCoverPhotoUpload = async () => {
    if (!coverPhoto || !user) return;

    setUploadingCover(true);
    try {
      const filePath = `cover-photos/${user.id}/${Date.now()}-${coverPhoto.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, coverPhoto);

      if (uploadError) throw uploadError;

      const { data: publicData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path ?? filePath);

      const coverUrl = publicData.publicUrl;

      const { error: updateError } = await (supabase
        .from("profiles") as any)
        .update({ cover_photo_url: coverUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setCoverPhoto(null);
      toast.success("Cover photo updated successfully!");
      await refresh();
    } catch (error: any) {
      toast.error(`Failed to upload cover photo: ${error.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleValidIdUpload = async () => {
    if (!validId || !user) return;

    setUploadingValidId(true);
    try {
      const filePath = `valid-ids/${user.id}/${Date.now()}-${validId.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, validId);

      if (uploadError) throw uploadError;

      const { data: publicData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path ?? filePath);

      const idUrl = publicData.publicUrl;

      const { error: updateError } = await (supabase
        .from("profiles") as any)
        .update({ government_id_url: idUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setValidId(null);
      setValidIdSaved(true);
      toast.success("Valid ID uploaded successfully");
      await refresh();
      setTimeout(() => setValidIdSaved(false), 3000);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("Bucket not found") || msg.includes("no such bucket")) {
        toast.error(`Storage bucket "${STORAGE_BUCKET}" not found.`);
      } else if (msg.includes("row-level security")) {
        toast.error("Upload blocked by security policy.");
      } else {
        toast.error(`Could not upload ID: ${msg}`);
      }
    } finally {
      setUploadingValidId(false);
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

  const displayProfile = otherUserProfile || profile;
  const isOwnProfile = !otherUserId || otherUserId === user?.id;

  return (
    <>
      <PremiumHero
        title={isOwnProfile ? t("profile.yourProfile") : `${displayProfile?.full_name}'s profile`}
      />
      <Container className="py-8">
        {!isOwnProfile && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.navigate({ to: "/profile", search: { userId: undefined } })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("profile.backToMyProfile")}
            </Button>
          </div>
        )}

        {/* Profile Header Card */}
        <Card className="mx-auto max-w-4xl border-2 border-primary/25 bg-gradient-to-br from-white to-secondary/10 overflow-hidden">
          {/* Cover Image Banner - 3/4 height */}
          <div className="h-48 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 relative">
            {coverPreviewUrl ? (
              <img src={coverPreviewUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-black/10"></div>
              </>
            )}
            {isOwnProfile && (
              <label className="absolute top-4 right-4 bg-white/90 text-primary rounded-xl p-2.5 cursor-pointer hover:bg-white transition-colors shadow-lg hover:scale-110 duration-200">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverPhoto(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-2xl overflow-hidden border-4 border-white bg-primary/10 flex items-center justify-center shadow-xl">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl font-bold text-primary">
                        {displayProfile?.full_name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  {isOwnProfile && (
                    <label className="absolute bottom-2 right-2 bg-primary text-white rounded-xl p-2.5 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg group-hover:scale-110 duration-200">
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
              </div>

              {/* Profile Info */}
              <div className="flex-1 pt-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayProfile?.full_name}</h1>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {displayProfile?.primary_role === "lgu_admin" ? (
                        <Badge variant="secondary" className="bg-secondary/20 text-primary border-primary/30 px-3 py-1 text-sm font-medium">
                          LGU Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 px-3 py-1 text-sm font-medium">
                          {displayProfile?.primary_role}
                        </Badge>
                      )}
                      {displayProfile?.primary_role !== "lgu_admin" && displayProfile?.lgu_approved ? (
                        <Badge className="bg-green-500 text-white border-green-600 px-3 py-1 text-sm font-medium">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : displayProfile?.primary_role !== "lgu_admin" && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 px-3 py-1 text-sm font-medium">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      {isOwnProfile ? user?.email : displayProfile?.id}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!isOwnProfile && user && otherUserProfile && (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30"
                        onClick={() => setShowChat(true)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t("profile.message")}
                      </Button>
                    )}
                    {isOwnProfile && profilePicture && (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30"
                        onClick={handleProfilePictureUpload}
                        disabled={uploading}
                      >
                        {uploading ? t("profile.uploading") : t("profile.savePhoto")}
                      </Button>
                    )}
                    {isOwnProfile && coverPhoto && (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30"
                        onClick={handleCoverPhotoUpload}
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? "Uploading..." : "Save Cover Photo"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{userListings.length}</div>
                    <div className="text-sm text-gray-500">Listings</div>
                  </div>
                  {displayProfile?.primary_role !== "lgu_admin" && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {displayProfile?.lgu_approved ? "✓" : "—"}
                      </div>
                      <div className="text-sm text-gray-500">Verified</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {displayProfile?.municipality?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "—"}
                    </div>
                    <div className="text-sm text-gray-500">Municipality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {displayProfile?.barangay || "—"}
                    </div>
                    <div className="text-sm text-gray-500">Location</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information Card */}
        <Card className="mx-auto max-w-4xl mt-6 border-2 border-primary/25 bg-gradient-to-br from-white to-secondary/10">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Contact Information
            </h2>
            {isOwnProfile ? (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const parsed = schema.safeParse(form);
                  if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
                    return;
                  }
                  if (!user) return;
                  setBusy(true);
                  const { error } = await (supabase.from("profiles") as any).update(parsed.data).eq("id", user.id);
                  setBusy(false);
                  if (error) toast.error(error.message);
                  else {
                    toast.success("Profile updated");
                    await refresh();
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fn" className="text-sm font-medium text-gray-700">{t("profile.fullName")}</Label>
                    <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ph" className="text-sm font-medium text-gray-700">{t("profile.phone")}</Label>
                    <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50 h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brgy" className="text-sm font-medium text-gray-700">{t("profile.barangay")}</Label>
                  <Input id="brgy" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad" className="text-sm font-medium text-gray-700">{t("profile.address")}</Label>
                  <Input id="ad" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50 h-11" />
                </div>
                <Button type="submit" disabled={busy} className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 h-11 px-8 shadow-lg shadow-primary/30">{busy ? t("profile.saving") : t("profile.saveChanges")}</Button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">{t("profile.fullName")}</Label>
                  <div className="text-base font-semibold text-gray-900">{displayProfile?.full_name}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">{t("profile.phone")}</Label>
                  <div className="text-base font-semibold text-gray-900">{displayProfile?.phone}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">{t("profile.barangay")}</Label>
                  <div className="text-base font-semibold text-gray-900">{displayProfile?.barangay}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">{t("profile.address")}</Label>
                  <div className="text-base font-semibold text-gray-900">{displayProfile?.address}</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Account Settings Card (only for own profile) */}
        {isOwnProfile && (
          <>
            <Card className="mx-auto max-w-4xl mt-6 border-2 border-primary/25 bg-gradient-to-br from-white to-secondary/10">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🪪</span>
                  Valid ID
                </h2>
                <div className="space-y-4">
                  {validIdPreview ? (
                    <div className="relative">
                      <img
                        src={validIdPreview}
                        alt="Valid ID"
                        className="w-full max-w-md rounded-lg border-2 border-primary/30"
                      />
                      {validIdSaved && (
                        <div className="mt-2 text-sm text-green-600 font-medium">Saved</div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <label className="cursor-pointer">
                          <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Replace ID
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setValidId(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                        </label>
                        {validId && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                            onClick={handleValidIdUpload}
                            disabled={uploadingValidId}
                          >
                            {uploadingValidId ? "Uploading..." : "Save Changes"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                      <p className="text-sm text-muted-foreground mb-3">No valid ID uploaded yet</p>
                      <label className="cursor-pointer">
                        <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Valid ID
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setValidId(e.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                      </label>
                      {validId && (
                        <div className="mt-4">
                          <Button
                            className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                            onClick={handleValidIdUpload}
                            disabled={uploadingValidId}
                          >
                            {uploadingValidId ? "Uploading..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="mx-auto max-w-4xl mt-6 border-2 border-primary/25 bg-gradient-to-br from-white to-secondary/10">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎨</span>
                  Theme Customization
                </h2>
                <ThemeCustomizer trigger={
                  <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    <Palette className="h-4 w-4 mr-2" />
                    Customize Theme
                  </Button>
                } />
              </div>
            </Card>

            <Card className="mx-auto max-w-4xl mt-6 border-2 border-primary/25 bg-gradient-to-br from-white to-secondary/10">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  {t("profile.changePassword")}
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={handlePasswordChange}
                >
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t("profile.currentPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="border-primary/30 focus:border-primary focus:ring-primary/50 pr-10 h-11"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t("profile.newPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="border-primary/30 focus:border-primary focus:ring-primary/50 pr-10 h-11"
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
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t("profile.confirmPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="border-primary/30 focus:border-primary focus:ring-primary/50 pr-10 h-11"
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
                    className="border-primary/30 text-primary hover:bg-primary/10 h-11 px-8"
                  >
                    {updatingPassword ? t("profile.updating") : t("profile.updatePassword")}
                  </Button>
                </form>
              </div>
            </Card>
          </>
        )}

        {/* Listings Section */}
        <Container className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">🛍️</span>
              {isOwnProfile ? "My Listings" : `${displayProfile?.full_name}'s Listings`}
            </h2>
            {isOwnProfile && (
              <Link to="/marketplace">
                <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30">
                  <span className="text-xl mr-2">+</span>
                  Create New Listing
                </Button>
              </Link>
            )}
          </div>

          {loadingListings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading listings...</p>
              </div>
            </div>
          ) : userListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  item={{
                    ...listing,
                    seller: displayProfile?.full_name || "Unknown",
                    role: (displayProfile?.primary_role === "hotel_restaurant" ? "restaurant" : displayProfile?.primary_role) || "resident",
                  }}
                  onViewDetails={() => {}}
                  onMessage={() => {
                    if (!isOwnProfile && user && otherUserProfile) {
                      setShowChat(true);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isOwnProfile ? "No Listings Yet" : "No Listings Available"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isOwnProfile 
                    ? "Start by creating your first listing to showcase your products." 
                    : `${displayProfile?.full_name} hasn't posted any listings yet.`}
                </p>
                {isOwnProfile && (
                  <Link to="/marketplace">
                    <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30">
                      <span className="text-xl mr-2">+</span>
                      Create Your First Listing
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </Container>
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
