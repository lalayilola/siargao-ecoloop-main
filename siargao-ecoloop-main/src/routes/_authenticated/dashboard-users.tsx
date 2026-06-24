import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Search, Filter, Phone, MapPin, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard-users")({
  head: () => ({ meta: [{ title: "User Management — LGU Dashboard" }] }),
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
  created_at: string;
  profile_picture_url: string | null;
};

function UserManagement() {
  const { isLguAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLguAdmin) return;
    loadUsers();
  }, [isLguAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real statistics
  const farmers = users.filter(u => u.primary_role === "farmer").length;
  const restaurants = users.filter(u => u.primary_role === "restaurant").length;
  const localUsers = users.filter(u => u.primary_role === "local_user").length;
  const lguAdmins = users.filter(u => u.primary_role === "lgu_admin").length;

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      farmer: "bg-green-100 text-green-700 border-green-200",
      restaurant: "bg-orange-100 text-orange-700 border-orange-200",
      local_user: "bg-blue-100 text-blue-700 border-blue-200",
      lgu_admin: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      farmer: "Farmer",
      restaurant: "Restaurant Owner",
      local_user: "Local User",
      lgu_admin: "LGU Admin",
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === "all" || user.primary_role === filterRole;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "approved" && user.lgu_approved) ||
      (filterStatus === "pending" && !user.lgu_approved && user.primary_role === "lgu_admin");
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
        <h1 className="font-display text-3xl font-bold">User Management</h1>
        <p className="mt-2 text-muted-foreground">View and manage user profiles of Farmers, Restaurant Owners, and Local Users</p>
      </div>

      {/* Filters */}
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
              <SelectItem value="local_user">Local Users</SelectItem>
              <SelectItem value="lgu_admin">LGU Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* User Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{users.length}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Total Users</div>
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
            <span className="text-2xl font-bold">{localUsers}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Local Users</div>
        </Card>
      </div>

      {/* Users List */}
      <Card className="p-6">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users found</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
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
                      {user.primary_role === 'lgu_admin' && (
                        <Badge className={user.lgu_approved ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>
                          {user.lgu_approved ? "Approved" : "Pending"}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      )}
                      {user.barangay && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {user.barangay}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
