import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Container, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Search, AlertCircle, X, FileText, Calendar, MapPin, Phone, Shield, ShieldCheck, TrendingUp, Users, Leaf, Store, Mail, MoreVertical, MessageSquare, Download, ExternalLink, User, Clock, CheckCircle2, XCircle } from "lucide-react";
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

// Counter animation hook
function useCounter(value: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    countRef.current = 0;
    const increment = value / (duration / 16);
    
    const animate = () => {
      countRef.current += increment;
      if (countRef.current < value) {
        setCount(Math.floor(countRef.current));
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return count;
}

function Stat({ icon: Icon, label, value, sub, trend }: { icon: typeof UserCheck; label: string; value: string | number; sub?: string; trend?: string }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0;
  const animatedValue = useCounter(numericValue, 1500);
  const displayValue = animatedValue.toLocaleString();
  
  return (
    <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
          <Icon className="h-7 w-7" />
        </span>
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="h-3.5 w-3.5" /> {trend}
          </span>
        )}
      </div>
      <div className="font-display text-3xl font-bold text-slate-900 mb-1">{displayValue}</div>
      <div className="text-sm text-slate-600 font-medium">{label}</div>
      {sub && (
        <div className="text-xs text-slate-500 mt-1">{sub}</div>
      )}
    </Card>
  );
}

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
    <>
      <PremiumHero
        title="Members Dashboard"
        sub="View and manage farmers, restaurant owners, and buyers registered in your municipality."
      />
      <Container className="py-12 relative">
        <style>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-gradient-shift {
            background-size: 200% 200%;
            animation: gradient-shift 50s ease infinite;
          }
          .animate-float-slow {
            animation: float-slow 8s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-mint-50/50 animate-gradient-shift" style={{ animationDuration: '50s' }} />
          <div className="absolute top-20 left-20 text-6xl opacity-[0.05] animate-float-slow">🍃</div>
          <div className="absolute top-40 right-32 text-5xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '2s' }}>🍃</div>
          <div className="absolute bottom-32 left-40 text-4xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '4s' }}>♻</div>
          <div className="absolute bottom-20 right-20 text-5xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '6s' }}>🍃</div>
          <div className="absolute top-1/2 left-1/3 text-4xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '8s' }}>💧</div>
        </div>

      <Card className="p-6 mb-8 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all shadow-sm"
              />
            </div>
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500">
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
            <SelectTrigger className="w-[180px] h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500">
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
        <Stat icon={Users} label="Total Members" value={users.length} trend="+2 this week" sub="Updated 3m ago" />
        <Stat icon={Leaf} label="Farmers" value={farmers} trend="+1 this week" sub="Active producers" />
        <Stat icon={Store} label="Restaurant Owners" value={restaurants} trend="+0 this week" sub="Food waste partners" />
        <Stat icon={UserCheck} label="Buyers" value={buyers} trend="+1 this week" sub="Local residents" />
      </div>

      <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No members found for this municipality.</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                {/* Avatar */}
                <div className="h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0 shadow-md">
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt={user.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-semibold text-white text-lg">
                      {user.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-slate-900">{user.full_name}</h3>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.primary_role === 'farmer' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      user.primary_role === 'restaurant' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      user.primary_role === 'resident' || user.primary_role === 'local_user' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      user.primary_role === 'lgu_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {getRoleLabel(user.primary_role)}
                    </Badge>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.lgu_approved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}>
                      {user.lgu_approved ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.barangay || 'No barangay'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-emerald-100 text-slate-600 hover:text-emerald-700">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-emerald-100 text-slate-600 hover:text-emerald-700">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-[1000px] max-h-[85vh] overflow-hidden p-0 rounded-2xl bg-white shadow-2xl">
          {selectedUser && (
            <div className="flex flex-col h-full">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-7 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-5">
                    {/* Profile Picture */}
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0 shadow-lg shadow-emerald-500/30">
                      {selectedUser.profile_picture_url ? (
                        <img src={selectedUser.profile_picture_url} alt={selectedUser.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-semibold text-white text-2xl">
                          {selectedUser.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-slate-900">{selectedUser.full_name}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                          onClick={() => setSelectedUser(null)}
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedUser.primary_role === 'farmer' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          selectedUser.primary_role === 'restaurant' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          selectedUser.primary_role === 'resident' || selectedUser.primary_role === 'local_user' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          selectedUser.primary_role === 'lgu_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {getRoleLabel(selectedUser.primary_role)}
                        </Badge>
                        <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedUser.lgu_approved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          {selectedUser.lgu_approved ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pending Verification</>
                          )}
                        </Badge>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Registered: {new Date(selectedUser.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-7 py-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Personal Information Card */}
                    <Card className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        Personal Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Full Name</p>
                            <p className="text-sm font-medium text-slate-900">{selectedUser.full_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                            <p className="text-sm font-medium text-slate-900">{selectedUser.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Municipality</p>
                            <p className="text-sm font-medium text-slate-900">{selectedUser.municipality || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Barangay / Purok</p>
                            <p className="text-sm font-medium text-slate-900">{selectedUser.barangay || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Registration Date</p>
                            <p className="text-sm font-medium text-slate-900">{new Date(selectedUser.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Account Information Card */}
                    <Card className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        Account Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <UserCheck className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">User Role</p>
                            <Badge className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              selectedUser.primary_role === 'farmer' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              selectedUser.primary_role === 'restaurant' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              selectedUser.primary_role === 'resident' || selectedUser.primary_role === 'local_user' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              selectedUser.primary_role === 'lgu_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {getRoleLabel(selectedUser.primary_role)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Verification Status</p>
                            <Badge className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              selectedUser.lgu_approved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                              {selectedUser.lgu_approved ? 'Verified' : 'Pending Verification'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">Account Status</p>
                            <Badge className="px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Right Column - Verification Documents */}
                  <div className="space-y-6">
                    <Card className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Verification Documents
                      </h4>
                      {selectedUser.government_id_url ? (
                        <div className="space-y-4">
                          <div className="relative group">
                            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
                              <img 
                                src={selectedUser.government_id_url} 
                                alt="Government ID" 
                                className="w-full h-auto max-h-64 object-contain cursor-pointer" 
                                onClick={() => window.open(selectedUser.government_id_url, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-9 rounded-lg border-slate-200 hover:bg-slate-50"
                                onClick={() => window.open(selectedUser.government_id_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in New Tab
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-9 rounded-lg border-slate-200 hover:bg-slate-50"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = selectedUser.government_id_url;
                                  link.download = `government-id-${selectedUser.full_name}.jpg`;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm text-slate-500">No government ID uploaded</p>
                        </div>
                      )}
                    </Card>

                    {/* Internal Notes */}
                    <Card className="p-6 rounded-xl border border-slate-200 bg-slate-50">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Internal Notes
                      </h4>
                      <Textarea 
                        placeholder="Add internal notes for LGU administrators..."
                        className="min-h-[100px] rounded-lg border-slate-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </Card>
                  </div>
                </div>
              </div>

              {/* Sticky Action Panel */}
              <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200 px-7 py-5">
                <div className="flex items-center gap-3">
                  {selectedUser.lgu_approved ? (
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-lg border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          console.log("Attempting to unverify user:", selectedUser.id);
                          const { error } = await (supabase.from("profiles") as any)
                            .update({ lgu_approved: false })
                            .eq("id", selectedUser.id);
                          
                          if (error) {
                            console.error("Database error:", error);
                            throw error;
                          }
                          
                          console.log("Unverify successful");
                          toast.success("User verification revoked");
                          await loadUsers();
                          setSelectedUser(null);
                        } catch (error: any) {
                          console.error("Unverification failed:", error);
                          toast.error(`Failed to revoke verification: ${error.message || 'Unknown error'}`);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Revoke Verification
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          console.log("Attempting to verify user:", selectedUser.id);
                          const { error } = await (supabase.from("profiles") as any)
                            .update({ lgu_approved: true })
                            .eq("id", selectedUser.id);
                          
                          if (error) {
                            console.error("Database error:", error);
                            throw error;
                          }
                          
                          console.log("Update successful");
                          toast.success("User verified successfully");
                          await loadUsers();
                          setSelectedUser(null);
                        } catch (error: any) {
                          console.error("Verification failed:", error);
                          toast.error(`Failed to verify: ${error.message || 'Unknown error'}`);
                        }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Verification
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="h-11 rounded-lg border-slate-200 hover:bg-slate-50"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Container>
    </>
  );
}
