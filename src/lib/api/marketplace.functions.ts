import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Trade Requests
export async function createTradeRequest(data: {
  listing_id: string;
  requester_user_id: string;
  requester_name: string;
  requester_role: Database["public"]["Enums"]["app_role"];
  offered_item_id?: string | null;
  offered_item_title?: string | null;
  message: string;
}) {
  const { data: result, error } = await supabase
    .from("trade_requests")
    .insert({
      ...data,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateTradeRequestStatus(
  requestId: string,
  status: Database["public"]["Enums"]["trade_status"]
) {
  const { data, error } = await supabase
    .from("trade_requests")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTradeRequestsForUser(userId: string) {
  const { data, error } = await supabase
    .from("trade_requests")
    .select("*")
    .eq("requester_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTradeRequestsForListings(listingIds: string[]) {
  const { data, error } = await supabase
    .from("trade_requests")
    .select("*")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Purchase Requests
export async function createPurchaseRequest(data: {
  listing_id: string;
  buyer_user_id: string;
  buyer_name: string;
  buyer_role: Database["public"]["Enums"]["app_role"];
  message?: string | null;
}) {
  const { data: result, error } = await supabase
    .from("purchase_requests")
    .insert({
      ...data,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updatePurchaseRequestStatus(
  requestId: string,
  status: Database["public"]["Enums"]["trade_status"]
) {
  const { data, error } = await supabase
    .from("purchase_requests")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPurchaseRequestsForUser(userId: string) {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("buyer_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPurchaseRequestsForListings(listingIds: string[]) {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Conversations
export async function getOrCreateConversation(data: {
  trade_request_id?: string | null;
  purchase_request_id?: string | null;
  listing_id?: string | null;
  participant_1_id: string;
  participant_2_id: string;
}) {
  // Try to find existing conversation
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("*")
    .or(`and(participant_1_id.eq.${data.participant_1_id},participant_2_id.eq.${data.participant_2_id}),and(participant_1_id.eq.${data.participant_2_id},participant_2_id.eq.${data.participant_1_id})`)
    .single();

  if (existingConv) return existingConv;

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return newConv;
}

export async function getConversationsForUser(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Messages
export async function sendMessage(data: {
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
}) {
  const { data: result, error } = await supabase
    .from("messages")
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  // Update conversation's updated_at timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", data.conversation_id);

  return result;
}

export async function getMessagesForConversation(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function markMessageAsRead(messageId: string) {
  const { data, error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAllMessagesAsRead(conversationId: string, userId: string) {
  const { data, error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null)
    .select();

  if (error) throw error;
  return data;
}

// Notifications
export async function createNotification(data: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  const { data: result, error } = await supabase
    .from("notifications")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getNotificationsForUser(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}

export async function getUnreadNotificationCount(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return data?.length || 0;
}

// Marketplace Listings
export async function createListing(data: {
  user_id: string;
  title: string;
  kind: Database["public"]["Enums"]["listing_kind"];
  seller: string;
  role: Database["public"]["Enums"]["app_role"];
  barangay: string;
  kg: number;
  price?: string | null;
  available_at?: string;
  image?: string | null;
  transaction_type: Database["public"]["Enums"]["transaction_type"];
  acceptable_exchanges?: string[];
  category?: string;
}) {
  const { data: result, error } = await supabase
    .from("marketplace_listings")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateListing(
  listingId: string,
  data: Partial<Database["public"]["Tables"]["marketplace_listings"]["Update"]>
) {
  const { data: result, error } = await supabase
    .from("marketplace_listings")
    .update(data)
    .eq("id", listingId)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteListing(listingId: string) {
  const { error } = await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", listingId);

  if (error) throw error;
}

export async function getListings(filters?: {
  kind?: Database["public"]["Enums"]["listing_kind"];
  transaction_type?: Database["public"]["Enums"]["transaction_type"];
  role?: Database["public"]["Enums"]["app_role"];
  category?: string;
  search?: string;
}) {
  let query = supabase
    .from("marketplace_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.kind) {
    query = query.eq("kind", filters.kind);
  }
  if (filters?.transaction_type) {
    query = query.eq("transaction_type", filters.transaction_type);
  }
  if (filters?.role) {
    query = query.eq("role", filters.role);
  }
  if (filters?.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,seller.ilike.%${filters.search}%,barangay.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getListingsForUser(userId: string) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
