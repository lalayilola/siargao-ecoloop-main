import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, Paperclip, Image as ImageIcon, Edit3, Trash2, Check, CheckCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [otherUserPictureUrl, setOtherUserPictureUrl] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

  useEffect(() => {
    if (!otherUserId) return;

    const loadOtherUserProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("profile_picture_url")
        .eq("id", otherUserId)
        .single();

      if (!error && data) {
        setOtherUserPictureUrl((data as { profile_picture_url: string | null }).profile_picture_url);
      }
    };

    loadOtherUserProfile();
  }, [otherUserId]);

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data ?? []);
    scrollToBottom();
    markMessagesAsRead(data ?? []);
  };

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
          .single<Conversation>();

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
          } as any)
          .select()
          .single() as { data: Conversation | null; error: any };

        if (convError || !newConv) {
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

    loadMessages(conversationId);
    loadConversation();

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
    const { error } = await (supabase.from("messages") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) {
      console.error("Error marking message as read:", error);
    }
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

      const { data: insertedMessage, error } = await (supabase.from("messages") as any).insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim() || "",
        image_url: imageUrl,
      }).select().single() as { data: Message | null; error: any };

      if (error) throw error;

      // Immediately add the new message to the messages state
      if (insertedMessage) {
        setMessages((prev) => [...prev, insertedMessage]);
        scrollToBottom();
      }

      const recipientId = otherUserId ??
        (conversation?.participant_1_id === user.id ? conversation.participant_2_id : conversation?.participant_1_id);

      if (recipientId && recipientId !== user.id) {
        const title = `${profile?.full_name ?? "Someone"} sent you a message`;
        const messagePreview = newMessage.trim().slice(0, 120) || "You have a new message.";
        await (supabase.from("notifications") as any).insert({
          user_id: recipientId,
          type: "message",
          title,
          message: messagePreview,
          link: `/messages`,
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

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    const { error } = await (supabase.from("messages") as any)
      .update({ content: editContent.trim() })
      .eq("id", editingMessageId);

    if (error) {
      toast.error(`Could not update message: ${error.message}`);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === editingMessageId ? { ...msg, content: editContent.trim() } : msg
      )
    );
    setIsEditModalOpen(false);
    setEditingMessageId(null);
    setEditContent("");
    toast.success("Message updated");
  };

  const handleDeleteMessage = async (messageId: string) => {
    setIsDeletingId(messageId);
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    setIsDeletingId(null);

    if (error) {
      toast.error(`Could not delete message: ${error.message}`);
      return;
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    toast.success("Message deleted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {otherUserPictureUrl ? (
                  <AvatarImage src={otherUserPictureUrl} alt={otherUserName} />
                ) : (
                  <AvatarFallback>{otherUserName?.[0] || "?"}</AvatarFallback>
                )}
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
                  className={`group flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"} gap-2 items-end`}
                >
                  <div
                    className={`max-w-[60%] rounded-lg px-3 py-2 ${
                      message.sender_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-sand text-slate-900"
                    }`}
                  >
                    {message.image_url && (
                      <img src={message.image_url} alt="Attachment" className="rounded mb-2 max-w-full h-auto" />
                    )}
                    {message.content && <p className="text-sm">{message.content}</p>}
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-xs opacity-70">{formatTime(message.created_at)}</span>
                      <div className="flex items-center gap-1">
                        {message.sender_id === user?.id && message.read_at && (
                          <CheckCheck className="h-3.5 w-3.5 opacity-70" />
                        )}
                        {message.sender_id === user?.id && !message.read_at && (
                          <Check className="h-3.5 w-3.5 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                  {message.sender_id === user?.id && (
                    <div className="flex flex-col gap-0.5 pb-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditMessage(message.id, message.content || "")}
                        title="Edit"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete message?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMessage(message.id)}>
                              {isDeletingId === message.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
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

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Message content"
                className="border-primary/30 focus:border-primary focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
