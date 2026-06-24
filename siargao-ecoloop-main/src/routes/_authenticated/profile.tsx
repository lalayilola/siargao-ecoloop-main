import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, MessageCircle, ArrowLeft } from "lucide-react";
import farmerBg from "@/assets/farmers-ecobg.jpg";
import restaurantBg from "@/assets/restaurant-food.jpg";
import localBg from "@/assets/siargao-locals.jpg";
import lguBg from "@/assets/compost.jpg";
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
  const [form, setForm] = useState({ full_name: "", phone: "", barangay: "", address: "" });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);

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
      toast.success("Profile picture updated");
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
        eyebrow={isOwnProfile ? "My account" : "User profile"}
        title={isOwnProfile ? "Your EcoLoop profile" : `${displayProfile?.full_name}'s profile`}
        bgImage={bgImage}
      />
      <Container className="py-10">
        {!isOwnProfile && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.navigate({ to: "/profile" })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to my profile
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
                  Message
                </Button>
              )}
              {isOwnProfile && profilePicture && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                  onClick={handleProfilePictureUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "Save photo"}
                </Button>
              )}
            </div>
          </div>

          {isOwnProfile ? (
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
                  <Label htmlFor="fn">Full name</Label>
                  <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ph">Phone</Label>
                  <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brgy">Barangay</Label>
                <Input id="brgy" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad">Address</Label>
                <Input id="ad" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              </div>
              <Button type="submit" disabled={busy} className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">{busy ? "Saving…" : "Save changes"}</Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <div className="text-sm font-medium">{displayProfile?.full_name}</div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <div className="text-sm font-medium">{displayProfile?.phone}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Barangay</Label>
                <div className="text-sm font-medium">{displayProfile?.barangay}</div>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
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
