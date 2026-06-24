import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, Paperclip, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

interface ChatMessengerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string;
  tradeRequestId?: string;
  purchaseRequestId?: string;
  listingId?: string;
  otherUserId?: string;
  otherUserName?: string;
}

export function ChatMessenger({
  open,
  onOpenChange,
  conversationId: propConversationId,
  tradeRequestId,
  purchaseRequestId,
  listingId,
  otherUserId,
  otherUserName,
}: ChatMessengerProps) {
  const [conversationId, setConversationId] = useState<string | undefined>(propConversationId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { user, profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

  useEffect(() => {
    if (!open || !user) return;

    const loadOrCreateConversation = async () => {
      if (conversationId) {
        loadMessages(conversationId);
        return;
      }

      if (otherUserId) {
        // Try to find existing conversation
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("*")
          .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`)
          .single();

        if (existingConv) {
          setConversationId(existingConv.id);
          loadMessages(existingConv.id);
          return;
        }

        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            trade_request_id: tradeRequestId || null,
            purchase_request_id: purchaseRequestId || null,
            listing_id: listingId || null,
            participant_1_id: user.id,
            participant_2_id: otherUserId,
          })
          .select()
          .single();

        if (convError) {
          toast.error("Failed to create conversation");
          return;
        }

        setConversationId(newConv.id);
        loadMessages(newConv.id);
      }
    };

    loadOrCreateConversation();
  }, [open, conversationId, user, otherUserId, tradeRequestId, purchaseRequestId, listingId]);

  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      setMessages(data ?? []);
      scrollToBottom();
      markMessagesAsRead(data ?? []);
    };

    const loadConversation = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (!error && data) {
        setConversation(data);
      }
    };

    loadMessages();
    loadConversation();

    loadMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
          if (payload.new.sender_id !== user?.id) {
            markMessageAsRead(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markMessagesAsRead = async (msgs: Message[]) => {
    const unreadMessages = msgs.filter(m => m.sender_id !== user?.id && !m.read_at);
    for (const msg of unreadMessages) {
      await markMessageAsRead(msg.id);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !user || (!newMessage.trim() && !file)) return;

    setIsSending(true);

    try {
      let imageUrl: string | null = null;
      if (file) {
        const filePath = `chat/${conversationId}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);
        imageUrl = publicData.publicUrl;
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim() || "",
        image_url: imageUrl,
      });

      if (error) throw error;

      const recipientId = otherUserId ??
        (conversation?.participant_1_id === user.id ? conversation.participant_2_id : conversation?.participant_1_id);

      if (recipientId && recipientId !== user.id) {
        const title = `${profile?.full_name ?? "Someone"} sent you a message`;
        const messagePreview = newMessage.trim().slice(0, 120) || "You have a new message.";
        await supabase.from("notifications").insert({
          user_id: recipientId,
          type: "message",
          title,
          message: messagePreview,
          link: `/profile?userId=${user.id}`,
        });
      }

      setNewMessage("");
      setFile(null);
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{otherUserName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-sm font-medium">{otherUserName || "Conversation"}</DialogTitle>
                <DialogDescription className="text-xs">
                  {tradeRequestId ? "Trade Request" : purchaseRequestId ? "Purchase Request" : listingId ? "Marketplace Listing" : "Direct Message"}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
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
                    {message.image_url && (
                      <img src={message.image_url} alt="Attachment" className="rounded mb-2 max-w-full h-auto" />
                    )}
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
          {file && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-sand rounded-lg">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700 truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto"
                onClick={() => setFile(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-20"
                disabled={isSending}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Paperclip className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                </label>
              </div>
            </div>
            <Button type="submit" size="sm" disabled={isSending || (!newMessage.trim() && !file)}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
