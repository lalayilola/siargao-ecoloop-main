import { useEffect, useState, useRef } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, MoreVertical, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ConversationWithLastMessage extends Conversation {
  last_message?: Message;
  other_user?: Profile;
  unread_count: number;
}

export function MessagesView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithLastMessage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setLoading(true);
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          messages (
            id,
            content,
            created_at,
            sender_id,
            read_at
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (convError) {
        console.error("Error loading conversations:", convError);
        setLoading(false);
        return;
      }

      // Get other user profiles for each conversation
      const conversationsWithProfiles = await Promise.all(
        (convData || []).map(async (conv: any) => {
          const otherUserId = conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id;
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", otherUserId)
            .single();

          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const unreadCount = conv.messages?.filter((m: Message) => m.sender_id !== user.id && !m.read_at).length || 0;

          return {
            ...conv,
            last_message: lastMessage,
            other_user: profileData,
            unread_count: unreadCount,
          } as ConversationWithLastMessage;
        })
      );

      setConversations(conversationsWithProfiles);
      setLoading(false);
    };

    loadConversations();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      setMessages(data ?? []);
      scrollToBottom();
      
      // Mark messages as read
      const unreadMessages = data?.filter(m => m.sender_id !== user?.id && !m.read_at) || [];
      for (const msg of unreadMessages) {
        await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", msg.id);
      }
    };

    loadMessages();

    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
          if (payload.new.sender_id !== user?.id) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user?.id]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const userName = conv.other_user?.full_name?.toLowerCase() || "";
    const lastMessage = conv.last_message?.content?.toLowerCase() || "";
    return userName.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
  });

  const handleConversationClick = (conv: ConversationWithLastMessage) => {
    setSelectedConversation(conv);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !user || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <PageHero
        eyebrow="Messages"
        title="Your conversations"
        sub="Chat with other EcoLoop members about trades, purchases, and more."
      />
      <Container className="py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations List */}
          <Card className="lg:col-span-1 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <div className="p-4 border-b border-primary/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 border-primary/30 focus:border-primary focus:ring-primary/50"
                />
              </div>
            </div>
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  {searchQuery ? "No conversations found" : "No conversations yet. Start chatting!"}
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 cursor-pointer hover:bg-primary/5 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-primary/10" : ""
                      }`}
                      onClick={() => handleConversationClick(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          {conv.other_user?.profile_picture_url ? (
                            <AvatarImage src={conv.other_user.profile_picture_url} alt={conv.other_user.full_name} />
                          ) : (
                            <AvatarFallback>{conv.other_user?.full_name?.[0] || "?"}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm text-slate-900 truncate">{conv.other_user?.full_name}</p>
                            {conv.last_message && (
                              <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600 truncate">
                              {conv.last_message?.content || "No messages yet"}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge className="ml-2 bg-primary text-white">{conv.unread_count}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            {selectedConversation ? (
              <div className="h-[600px] flex flex-col">
                <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {selectedConversation.other_user?.profile_picture_url ? (
                        <AvatarImage src={selectedConversation.other_user.profile_picture_url} alt={selectedConversation.other_user.full_name} />
                      ) : (
                        <AvatarFallback>{selectedConversation.other_user?.full_name?.[0] || "?"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{selectedConversation.other_user?.full_name}</p>
                      <p className="text-xs text-slate-500">{selectedConversation.other_user?.primary_role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 ${
                              message.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-sand text-slate-900"
                            }`}
                          >
                            {message.content && <p className="text-sm">{message.content}</p>}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">{formatTime(message.created_at)}</span>
                              {message.sender_id !== user?.id && message.read_at && (
                                <span className="text-xs opacity-70">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border-primary/30 focus:border-primary focus:ring-primary/50"
                      disabled={sending}
                    />
                    <Button type="submit" size="sm" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 mb-2">Select a conversation</p>
                  <p className="text-sm text-slate-600">Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Container>
    </>
  );
}
