import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Plus, Edit, Trash2, Eye, Calendar, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard-announcements")({
  head: () => ({ meta: [{ title: "Announcements — LGU Dashboard" }] }),
  component: AnnouncementsManagement,
});

type Announcement = {
  id: string;
  lgu_admin_id: string;
  title: string;
  content: string;
  category: string;
  importance: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function AnnouncementsManagement() {
  const { user, isLguAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    importance: "normal",
  });

  useEffect(() => {
    if (!user || !isLguAdmin) return;
    loadAnnouncements();
  }, [user, isLguAdmin]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const { data: allAnnouncements, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const myPosts = allAnnouncements?.filter(a => a.lgu_admin_id === user?.id) || [];
      setAnnouncements(allAnnouncements || []);
      setMyAnnouncements(myPosts);
    } catch (error: any) {
      toast.error(`Failed to load announcements: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            importance: formData.importance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAnnouncement.id);

        if (error) throw error;
        toast.success("Announcement updated successfully");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({
            lgu_admin_id: user.id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            importance: formData.importance,
            status: "draft",
          });

        if (error) throw error;
        toast.success("Announcement created successfully");
      }

      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", category: "general", importance: "normal" });
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to save announcement: ${error.message}`);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Announcement published successfully");
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to publish announcement: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Announcement deleted successfully");
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to delete announcement: ${error.message}`);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      importance: announcement.importance,
    });
    setIsDialogOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-700 border-blue-200",
      emergency: "bg-red-100 text-red-700 border-red-200",
      event: "bg-purple-100 text-purple-700 border-purple-200",
      policy: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[category] || colors.general;
  };

  const getImportanceColor = (importance: string) => {
    const colors: Record<string, string> = {
      normal: "bg-gray-100 text-gray-700 border-gray-200",
      important: "bg-yellow-100 text-yellow-700 border-yellow-200",
      urgent: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[importance] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      published: "bg-green-100 text-green-700 border-green-200",
      archived: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colors[status] || colors.draft;
  };

  if (!isLguAdmin) {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-display text-2xl font-semibold">LGU access only</h2>
          <p className="mt-2 text-sm text-muted-foreground">This dashboard is reserved for verified Local Government Unit accounts.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Announcements Management</h1>
          <p className="mt-2 text-muted-foreground">Create, edit, publish, and manage announcements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAnnouncement(null); setFormData({ title: "", content: "", category: "general", importance: "normal" }); }}>
              <Plus className="mr-2 h-4 w-4" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Announcement content"
                  rows={6}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                  <Select value={formData.importance} onValueChange={(value) => setFormData({ ...formData, importance: value })}>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingAnnouncement ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Announcements Section */}
      <Card className="p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> My Announcements
        </h2>
        {myAnnouncements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No announcements created yet</p>
        ) : (
          <div className="space-y-4">
            {myAnnouncements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <Badge className={getCategoryColor(announcement.category)}>{announcement.category}</Badge>
                      <Badge className={getImportanceColor(announcement.importance)}>{announcement.importance}</Badge>
                      <Badge className={getStatusColor(announcement.status)}>{announcement.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(announcement.created_at).toLocaleDateString()}</span>
                      {announcement.published_at && (
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Published: {new Date(announcement.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.status === "draft" && (
                      <Button size="sm" onClick={() => handlePublish(announcement.id)}>Publish</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All Announcements Section */}
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold mb-4">All Announcements</h2>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No announcements found</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{announcement.title}</h3>
                      <Badge className={getCategoryColor(announcement.category)}>{announcement.category}</Badge>
                      <Badge className={getImportanceColor(announcement.importance)}>{announcement.importance}</Badge>
                      <Badge className={getStatusColor(announcement.status)}>{announcement.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(announcement.created_at).toLocaleDateString()}</span>
                      {announcement.published_at && (
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Published: {new Date(announcement.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {announcement.lgu_admin_id === user?.id && (
                    <div className="flex items-center gap-2">
                      {announcement.status === "draft" && (
                        <Button size="sm" onClick={() => handlePublish(announcement.id)}>Publish</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
