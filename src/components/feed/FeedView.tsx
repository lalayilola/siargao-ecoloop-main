import { useEffect, useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Container, PageHero } from "@/components/layout/Section";

import { PostCard } from "@/components/feed/PostCard";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Search, Image as ImageIcon, MapPin, Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import type { Database } from "@/integrations/supabase/types";

import heroImage from "@/assets/siargao-spot.jpg";

import { roleMeta } from "@/data/mock";

import { useAuth, type AppRole } from "@/hooks/use-auth";

import { toast } from "sonner";

import { LocationPicker } from "@/components/auth/LocationPicker";

import { useLanguage } from "@/hooks/use-language";



const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";



// This bucket must exist in Supabase Storage and allow authenticated uploads for signed-in users.

// If your project uses a custom bucket name, set VITE_SUPABASE_STORAGE_BUCKET in .env.



type FeedPost = Database["public"]["Tables"]["feed_posts"]["Row"];



const filters: { key: FeedPost["role"] | "all"; label: string }[] = [

  { key: "all", label: "All" },

  { key: "farmer", label: "Farmers" },

  { key: "hotel_restaurant", label: "Restaurants" },

  { key: "resident", label: "Residents" },

  { key: "lgu_admin", label: "LGU" },

];



const mapAppRoleToFeedRole = (role: AppRole | undefined): FeedPost["role"] =>

  role ?? "resident";



export function FeedView() {

  const [active, setActive] = useState<FeedPost["role"] | "all">("all");

  const [q, setQ] = useState("");

  const [posts, setPosts] = useState<FeedPost[]>([]);

  const [draft, setDraft] = useState("");

  const [photoAttached, setPhotoAttached] = useState(false);

  const [files, setFiles] = useState<File[]>([]);

  const [uploading, setUploading] = useState(false);

  const [locationAdded, setLocationAdded] = useState(false);

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; locationName: string; locationAddress: string } | null>(null);

  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuth();



  useEffect(() => {

    const loadFeed = async () => {

      setLoading(true);

      try {

        const { data: postsData, error: postsError } = await supabase

          .from("feed_posts")

          .select("*")

          .order("created_at", { ascending: false });



        if (postsError) throw postsError;



        // Fetch profile data for all users

        const userIds = [...new Set(postsData?.map((p: any) => p.user_id) || [])];

        const { data: profilesData } = await supabase

          .from("profiles")

          .select("id, full_name, profile_picture_url")

          .in("id", userIds);



        console.log("Profile data from database:", profilesData);



        const profileMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);



        console.log("Profile map:", profileMap);



        // Combine posts with profile data

        const postsWithProfiles = (postsData || []).map((post: any) => ({

          ...post,

          profiles: profileMap.get(post.user_id),

        }));



        console.log("Posts with profiles:", postsWithProfiles);

        setPosts(postsWithProfiles);

      } catch (error: any) {

        toast.error(`Unable to load EcoFeed: ${error.message}`);

        setPosts([]);

      } finally {

        setLoading(false);

      }

    };

    void loadFeed();

  }, []);



  const handlePost = async () => {

    const body = draft.trim();

    if (!body || !user || !profile) return;



    // Ensure the supabase client has an active session identical to `user`.

    try {

      const { data: sessionData } = await supabase.auth.getSession();

      const sessionUserId = sessionData?.session?.user?.id;

      if (!sessionUserId || sessionUserId !== user.id) {

        toast.error("Your session is not available or doesn't match. Please sign out and sign in again.");

        return;

      }

    } catch (err) {

      // ignore - we'll surface insert errors below

    }



    let imageUrls: string[] = [];

    if (files.length > 0) {

      setUploading(true);

      try {

        const uploadPromises = files.map(async (file) => {

          const filePath = `feed/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

          const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);

          return publicData.publicUrl;

        });

        imageUrls = await Promise.all(uploadPromises);

      } catch (err: any) {

        const msg = err?.message ?? String(err);

        if (msg.includes("Bucket not found") || msg.includes("bucket not found") || msg.includes("no such bucket")) {

          toast.error(`Storage bucket "${STORAGE_BUCKET}" not found. Create it in Supabase Storage or set VITE_SUPABASE_STORAGE_BUCKET.`);

        } else if (msg.includes("row-level security") || msg.includes("violates row-level")) {

          toast.error(

            "Could not upload images: storage upload blocked by row-level security. " +

            "Ensure the signed-in user is authenticated and the Supabase storage bucket policy allows uploads."

          );

        } else {

          toast.error(`Could not upload images: ${msg}`);

        }

        setUploading(false);

        return;

      } finally {

        setUploading(false);

      }

    }



    const newPost = {

      user_id: user.id,

      role: mapAppRoleToFeedRole(profile.primary_role),

      author: profile.full_name,

      barangay: profile.barangay,

      body,

      image: imageUrls.length > 0 ? imageUrls[0] : (photoAttached ? "produce" : null),

      images: imageUrls,

      kg: null,

      price: null,

      date: locationAdded ? "Posted now" : "Now",

      latitude: selectedLocation?.latitude || null,

      longitude: selectedLocation?.longitude || null,

      location_name: selectedLocation?.locationName || null,

      location_address: selectedLocation?.locationAddress || null,

      post_type: "farmer_produce" as const,

    } as any;



    const { data, error } = await supabase

      .from("feed_posts")

      .insert(newPost)

      .select()

      .single();



    if (error) {

      const msg = error.message ?? String(error);

      if (msg.includes("row-level security") || msg.includes("violates row-level")) {

        toast.error("Publish blocked by row-level security. Ensure you're signed in and the database RLS policies allow inserts for your user.");

      } else {

        toast.error(`Could not publish post: ${msg}`);

      }

      return;

    }



    // Add profile data to the new post

    const postWithProfile: any = {};

    if (data) {

      Object.assign(postWithProfile, data);

    }

    postWithProfile.profiles = {

      profile_picture_url: profile?.profile_picture_url,

      full_name: profile?.full_name,

    };



    console.log("New post with profile:", postWithProfile);

    setPosts((current) => [postWithProfile, ...current]);

    setDraft("");

    setPhotoAttached(false);

    setFiles([]);

    setLocationAdded(false);

    setShowLocationPicker(false);

    setSelectedLocation(null);

    setActive("all");

    toast.success("Post published to EcoFeed");

  };



  const visiblePosts = posts

    .filter((p) => (active === "all" ? true : p.role === active))

    .filter((p) =>

      q ? `${p.author} ${p.body} ${p.barangay}`.toLowerCase().includes(q.toLowerCase()) : true,

    );



  return (

    <>

      <PageHero

        eyebrow="EcoFeed"

        title="What's moving across the loop today."

        sub="Browse the latest posts from farmers, restaurants and residents in your barangay."

        bgImage={heroImage}

      />

      <Container className="py-12">

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          <div>

            {/* Announcements Section */}

            {announcements.length > 0 && (

              <div className="mb-6 space-y-4">

                <div className="flex items-center justify-between mb-4">

                  <h2 className="font-display text-xl font-semibold flex items-center gap-2">

                    <Megaphone className="h-5 w-5 text-primary" /> LGU Announcements

                  </h2>

                  {isLguAdmin && (

                    <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>

                      <DialogTrigger asChild>

                        <Button size="sm">

                          <Plus className="mr-2 h-4 w-4" /> New Announcement

                        </Button>

                      </DialogTrigger>

                      <DialogContent className="max-w-2xl">

                        <DialogHeader>

                          <DialogTitle>Create New Announcement</DialogTitle>

                        </DialogHeader>

                        <form onSubmit={handleAnnouncementSubmit} className="space-y-4">

                          <div>

                            <label className="text-sm font-medium">Title</label>

                            <Input

                              value={announcementFormData.title}

                              onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}

                              placeholder="Announcement title"

                              required

                            />

                          </div>

                          <div>

                            <label className="text-sm font-medium">Content</label>

                            <Textarea

                              value={announcementFormData.content}

                              onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}

                              placeholder="Announcement content"

                              rows={6}

                              required

                            />

                          </div>

                          <div className="grid grid-cols-2 gap-4">

                            <div>

                              <label className="text-sm font-medium">Category</label>

                              <Select value={announcementFormData.category} onValueChange={(value) => setAnnouncementFormData({ ...announcementFormData, category: value })}>

                                <SelectTrigger>

                                  <SelectValue />

                                </SelectTrigger>

                                <SelectContent>

                                  <SelectItem value="general">General</SelectItem>

                                  <SelectItem value="emergency">Emergency</SelectItem>

                                  <SelectItem value="event">Event</SelectItem>

                                  <SelectItem value="policy">Policy</SelectItem>

                                </SelectContent>

                              </Select>

                            </div>

                            <div>

                              <label className="text-sm font-medium">Importance</label>

                              <Select value={announcementFormData.importance} onValueChange={(value) => setAnnouncementFormData({ ...announcementFormData, importance: value })}>

                                <SelectTrigger>

                                  <SelectValue />

                                </SelectTrigger>

                                <SelectContent>

                                  <SelectItem value="normal">Normal</SelectItem>

                                  <SelectItem value="important">Important</SelectItem>

                                  <SelectItem value="urgent">Urgent</SelectItem>

                                </SelectContent>

                              </Select>

                            </div>

                          </div>

                          <div className="flex justify-end gap-2">

                            <Button type="button" variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>Cancel</Button>

                            <Button type="submit">Publish</Button>

                          </div>

                        </form>

                      </DialogContent>

                    </Dialog>

                  )}

                </div>

                {announcements.map((announcement) => (

                  <Card key={announcement.id} className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white">

                    <div className="flex items-start justify-between gap-4 mb-3">

                      <div className="flex items-center gap-2 flex-wrap">

                        <Badge className={getCategoryColor(announcement.category)}>{announcement.category}</Badge>

                        <Badge className={getImportanceColor(announcement.importance)}>{announcement.importance}</Badge>

                      </div>

                      <div className="text-xs text-muted-foreground">

                        {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}

                      </div>

                    </div>

                    <h3 className="font-display text-xl font-semibold mb-2">{announcement.title}</h3>

                    <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>

                  </Card>

                ))}

              </div>

            )}



            {user ? (

              <Card className="mb-6 p-4 border-2 border-earth-green/40 bg-gradient-to-br from-white via-warm-cream to-earth-green-light/10">

                <div className="flex items-center gap-3">

                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-earth-green to-warm-sage text-white font-semibold shadow-md border-2 border-earth-green/40 flex-shrink-0">

                    {profile?.profile_picture_url ? (

                      <img src={profile.profile_picture_url} alt={profile.full_name} className="h-full w-full object-cover" />

                    ) : (

                      <div className="h-full w-full flex items-center justify-center">

                        {(profile?.full_name?.[0] ?? "Y").toUpperCase()}

                      </div>

                    )}

                  </div>

                  <Input

                    value={draft}

                    onChange={(e) => setDraft(e.target.value)}

                    placeholder="Share crops, waste or a need…"

                    className="border-earth-green/30 focus:border-earth-green focus:ring-earth-green/50"

                  />

                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

                  <div className="flex gap-2">

                    <Button

                      variant={photoAttached ? "secondary" : "ghost"}

                      size="sm"

                      className={photoAttached ? "bg-earth-green/30 text-earth-green hover:bg-earth-green/40" : "text-earth-green hover:bg-earth-green/10"}

                      onClick={() => setPhotoAttached((value) => !value)}

                    >

                      <ImageIcon className="mr-1 h-4 w-4" />Photo

                    </Button>

                    <Button

                      variant={locationAdded ? "secondary" : "ghost"}

                      size="sm"

                      className={locationAdded ? "bg-earth-green/30 text-earth-green hover:bg-earth-green/40" : "text-earth-green hover:bg-earth-green/10"}

                      onClick={() => setShowLocationPicker(true)}

                    >

                      <MapPin className="mr-1 h-4 w-4" />Location

                    </Button>

                  </div>

                  <Button size="sm" className="rounded-full bg-earth-green hover:bg-earth-green/90 text-white" onClick={handlePost} disabled={uploading || !draft.trim()}>

                    Post

                  </Button>

                </div>

                {(photoAttached || locationAdded) && (

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">

                    {photoAttached && <span className="rounded-full bg-earth-green/20 text-earth-green px-2 py-1 font-medium">✓ Photo attached</span>}

                    {locationAdded && <span className="rounded-full bg-earth-green/20 text-earth-green px-2 py-1 font-medium">✓ Location added</span>}

                  </div>

                )}

                {showLocationPicker && (

                  <div className="mt-3">

                    <LocationPicker 

                      onLocationSelect={(location) => {

                        setSelectedLocation(location);

                        setLocationAdded(true);

                        setShowLocationPicker(false);

                      }}

                      initialLocation={selectedLocation ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude } : undefined}

                    />

                  </div>

                )}

                {photoAttached && (

                  <div className="mt-3">

                    <input

                      type="file"

                      accept="image/*"

                      multiple

                      onChange={(e) => setFiles(Array.from(e.target.files || []))}

                      className="text-sm"

                    />

                    {files.length > 0 && (

                      <div className="mt-3 grid grid-cols-3 gap-2">

                        {files.map((file, index) => (

                          <img

                            key={index}

                            src={URL.createObjectURL(file)}

                            alt={`preview ${index + 1}`}

                            className="h-24 w-full object-cover rounded-md"

                          />

                        ))}

                      </div>

                    )}

                  </div>

                )}

              </Card>

            ) : (

              <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 border-2 border-earth-green/40 bg-gradient-to-r from-earth-green/10 to-earth-green-light/10">

                <div className="flex items-center gap-2 text-sm text-earth-green font-medium">

                  <Lock className="h-4 w-4" /> Sign in to post, react and trade.

                </div>

                <Button asChild size="sm" className="rounded-full bg-earth-green hover:bg-earth-green/90 text-white">

                  <Link to="/auth">Sign in to post</Link>

                </Button>

              </Card>

            )}



            <div className="mb-4 flex flex-wrap items-center gap-2">

              {filters.map((f) => (

                <button

                  key={f.key}

                  onClick={() => setActive(f.key)}

                  className={`rounded-full border px-3 py-1.5 text-sm transition-all font-medium ${

                    active === f.key

                      ? "border-earth-green bg-gradient-to-r from-earth-green to-warm-sage text-white shadow-md"

                      : "border-earth-green/30 bg-white text-earth-brown hover:bg-earth-green/10 hover:border-earth-green/50"

                  }`}

                >

                  {f.label}

                </button>

              ))}

              <div className="ml-auto relative w-full max-w-xs">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-green/60" />

                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the feed" className="pl-9 border-earth-green/30 focus:border-earth-green focus:ring-earth-green/30" />

              </div>

            </div>



            <div className="grid gap-5">

              {loading ? (

                <Card className="p-8 text-center text-sm text-muted-foreground">Loading feed...</Card>

              ) : visiblePosts.length > 0 ? (

                visiblePosts.map((p) => (

                  <PostCard

                    key={p.id}

                    post={p}

                    onDelete={(id) => setPosts((current) => current.filter((post) => post.id !== id))}

                  />

                ))

              ) : (

                <Card className="p-8 text-center text-sm text-muted-foreground">No posts match your filters yet.</Card>

              )}

            </div>

          </div>



          <aside className="space-y-5">

            <Card className="p-5 border-2 border-earth-green/40 bg-gradient-to-br from-white to-earth-green-light/10">

              <h3 className="font-semibold text-earth-green flex items-center gap-2">

                <span className="text-lg">🌱</span> Who's posting

              </h3>

              <ul className="mt-3 space-y-2 text-sm">

                {(Object.keys(roleMeta) as FeedPost["role"][]).map((r) => (

                  <li key={r} className="flex items-center justify-between p-2 rounded-md hover:bg-earth-green/10 transition-colors">

                    <span className="text-muted-foreground">{roleMeta[r].label}s</span>

                    <span className="font-semibold text-earth-green">{posts.filter((p) => p.role === r).length}</span>

                  </li>

                ))}

              </ul>

            </Card>

            <Card className="p-5 border-2 border-earth-green/40 bg-gradient-to-br from-white to-earth-green-light/10">

              <h3 className="font-semibold text-earth-green flex items-center gap-2">

                <span className="text-lg">🔥</span> Trending in Siargao

              </h3>

              <ul className="mt-3 space-y-1.5 text-sm text-earth-green/80">

                <li className="flex items-center gap-2 p-2 rounded-md hover:bg-earth-green/10 transition-colors cursor-pointer"><span className="text-earth-green">→</span> #barter</li>

                <li className="flex items-center gap-2 p-2 rounded-md hover:bg-earth-green/10 transition-colors cursor-pointer"><span className="text-earth-green">→</span> #localharvest</li>

                <li className="flex items-center gap-2 p-2 rounded-md hover:bg-earth-green/10 transition-colors cursor-pointer"><span className="text-earth-green">→</span> #zerowaste</li>

                <li className="flex items-center gap-2 p-2 rounded-md hover:bg-earth-green/10 transition-colors cursor-pointer"><span className="text-earth-green">→</span> #bayanihan</li>

              </ul>

            </Card>

          </aside>

        </div>

      </Container>

    </>

  );

}



