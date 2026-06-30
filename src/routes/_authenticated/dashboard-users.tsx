import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Search, AlertCircle, X, FileText, Calendar, MapPin, Phone, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard-users")({
  head: () => ({ meta: [{ title: "Members Dashboard — LGU Dashboard" }] }),
  component: UserManagement,
});

type UserProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  barangay: string | null;
  address: string | null;
  primary_role: string;
  lgu_approved: boolean | null;
  government_id_url: string | null;
  created_at: string;
  profile_picture_url: string | null;
  municipality: string | null;
  is_super_admin: boolean | null;
};

function UserManagement() {
  const { isLguAdmin, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isLguAdmin || !profile?.municipality) return;
    void loadUsers();
  }, [isLguAdmin, profile?.municipality]);

  const loadUsers = async () => {
    if (!profile?.municipality) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("municipality", profile.municipality)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const farmers = users.filter((user) => user.primary_role === "farmer").length;
  const restaurants = users.filter((user) => user.primary_role === "restaurant").length;
  const buyers = users.filter((user) => user.primary_role === "resident" || user.primary_role === "local_user").length;

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      farmer: "bg-green-100 text-green-700 border-green-200",
      restaurant: "bg-orange-100 text-orange-700 border-orange-200",
      resident: "bg-blue-100 text-blue-700 border-blue-200",
      local_user: "bg-blue-100 text-blue-700 border-blue-200",
      lgu_admin: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      farmer: "Farmer",
      restaurant: "Restaurant Owner",
      resident: "Buyer",
      local_user: "Buyer",
      lgu_admin: "LGU Admin",
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === "all" || user.primary_role === filterRole;
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "verified" && user.lgu_approved) ||
      (filterStatus === "unverified" && !user.lgu_approved);
    const matchesSearch = searchQuery === "" ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.barangay && user.barangay.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesStatus && matchesSearch;
  });

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
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Members Dashboard</h1>
        <p className="mt-2 text-muted-foreground">View and manage farmers, restaurant owners, and buyers registered in your municipality.</p>
      </div>

      <Card className="p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="farmer">Farmers</SelectItem>
              <SelectItem value="restaurant">Restaurant Owners</SelectItem>
              <SelectItem value="resident">Buyers</SelectItem>
              <SelectItem value="lgu_admin">LGU Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{users.length}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Total Members</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{farmers}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Farmers</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{restaurants}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Restaurant Owners</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{buyers}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Buyers</div>
        </Card>
      </div>

      <Card className="p-6">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading members...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No members found for this municipality.</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className="border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/40 flex-shrink-0">
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt={user.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-semibold text-primary">
                        {user.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <Badge className={getRoleColor(user.primary_role)}>{getRoleLabel(user.primary_role)}</Badge>
                      <Badge className={user.lgu_approved ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>
                        {user.lgu_approved ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{user.phone || "No phone number"}</span>
                      <span>{user.barangay || "No barangay"}</span>
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/40 flex-shrink-0">
                  {selectedUser.profile_picture_url ? (
                    <img src={selectedUser.profile_picture_url} alt={selectedUser.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-semibold text-primary text-2xl">
                      {selectedUser.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedUser.full_name}</h3>
                  <Badge className={getRoleColor(selectedUser.primary_role)} mt-2>{getRoleLabel(selectedUser.primary_role)}</Badge>
                  <Badge className={selectedUser.lgu_approved ? "bg-green-100 text-green-700 border-green-200 ml-2" : "bg-yellow-100 text-yellow-700 border-yellow-200 ml-2"}>
                    {selectedUser.lgu_approved ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.phone || "No phone number"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.barangay || "No barangay"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.address || "No address provided"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Registered: {new Date(selectedUser.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Government ID
                </h4>
                {selectedUser.government_id_url ? (
                  <div className="space-y-3">
                    <img 
                      src={selectedUser.government_id_url} 
                      alt="Government ID" 
                      className="w-full max-w-md rounded-lg border" 
                    />
                    <a 
                      href={selectedUser.government_id_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Open ID in new tab
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No government ID uploaded</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {selectedUser.lgu_approved ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const { error } = await (supabase.from("profiles") as any)
                          .update({ lgu_approved: false })
                          .eq("id", selectedUser.id);
                        if (error) throw error;
                        toast.success("User verification revoked");
                        void loadUsers();
                        setSelectedUser({ ...selectedUser, lgu_approved: false });
                      } catch (error: any) {
                        toast.error(`Failed to revoke verification: ${error.message}`);
                      }
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Unverify
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const { error } = await (supabase.from("profiles") as any)
                          .update({ lgu_approved: true })
                          .eq("id", selectedUser.id);
                        if (error) throw error;
                        toast.success("User verified successfully");
                        void loadUsers();
                        setSelectedUser({ ...selectedUser, lgu_approved: true });
                      } catch (error: any) {
                        toast.error(`Failed to verify: ${error.message}`);
                      }
                    }}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
