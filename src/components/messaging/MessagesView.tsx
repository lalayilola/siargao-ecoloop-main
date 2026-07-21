import { useEffect, useState, useRef, useCallback } from "react";

import { Container, PageHero, PremiumHero } from "@/components/layout/Section";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

import { Textarea } from "@/components/ui/textarea";

import { Search, Send, MoreVertical, MessageCircle, X, Edit3, Trash2, Check, CheckCheck, Image as ImageIcon, Paperclip } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/use-auth";

import type { Database } from "@/integrations/supabase/types";

import { formatDistanceToNow } from "date-fns";

import { toast } from "sonner";



type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

type Message = Database["public"]["Tables"]["messages"]["Row"];

type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

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

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [uploadingImage, setUploadingImage] = useState(false);

  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";



  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  };



  const loadConversations = useCallback(async () => {

    if (!user) return;

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

          read_at,

          image_urls

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

  }, [user]);



  useEffect(() => {

    if (!user) return;



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



      // Mark messages as read and update conversation state locally

      const unreadMessages = (data as Message[])?.filter(m => m.sender_id !== user?.id && !m.read_at) || [];

      if (unreadMessages.length > 0) {

        await Promise.all(

          unreadMessages.map(msg =>

            // @ts-ignore - Supabase TypeScript strictness issue

            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", msg.id)

          )

        );



        // Update conversation state locally to clear unread count

        setConversations(prev =>

          prev.map(conv =>

            conv.id === selectedConversation.id

              ? { ...conv, unread_count: 0 }

              : conv

          )

        );

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

          const newMsg = payload.new as Message;

          setMessages((prev) => [...prev, newMsg]);

          scrollToBottom();



          // Update conversation list with new message

          setConversations(prev =>

            prev.map(conv =>

              conv.id === selectedConversation.id

                ? {

                    ...conv,

                    last_message: newMsg,

                    unread_count: newMsg.sender_id !== user?.id && !newMsg.read_at

                      ? (conv.unread_count || 0) + 1

                      : conv.unread_count,

                  }

                : conv

            )

          );



          // Update selected conversation

          setSelectedConversation(prev =>

            prev && prev.id === selectedConversation.id

              ? {

                  ...prev,

                  last_message: newMsg,

                }

              : prev

          );



          // Mark as read if from other user

          if (newMsg.sender_id !== user?.id) {

            // @ts-ignore - Supabase TypeScript strictness issue

            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", newMsg.id);

          }

        }

      )

      .on(

        "postgres_changes",

        {

          event: "UPDATE",

          schema: "public",

          table: "messages",

          filter: `conversation_id=eq.${selectedConversation.id}`,

        },

        (payload) => {

          const updatedMsg = payload.new as Message;
          console.log('Message updated via subscription:', updatedMsg.id, updatedMsg);

          // Update local messages state with all fields
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
            )
          );



          // If message was marked as read, update conversation unread count

          if (updatedMsg.read_at && updatedMsg.sender_id !== user?.id) {

            setConversations(prev =>

              prev.map(conv =>

                conv.id === selectedConversation.id

                  ? { ...conv, unread_count: Math.max(0, (conv.unread_count || 0) - 1) }

                  : conv

              )

            );

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

    if (!selectedConversation || !user || (!newMessage.trim() && selectedImages.length === 0)) return;



    setSending(true);

    try {
      // Send message immediately with text content
      const { data, error } = await supabase

        .from("messages")

        .insert({

          conversation_id: selectedConversation.id,

          sender_id: user.id,

          content: newMessage.trim() || "",

          image_urls: null, // Will be updated after upload

        } as any)

        .select()

        .single();



      if (error) throw error;

      if (!data) throw new Error("Failed to create message");



      const newMessageData = data as Message;



      // Immediately add the new message to the messages state

      setMessages((prev) => [...prev, newMessageData]);

      scrollToBottom();



      setNewMessage("");

      const imagesToUpload = [...selectedImages];
      clearImages();
      setSending(false);



      // Update conversations list to show new message immediately

      setConversations(prev =>

        prev.map(conv =>

          conv.id === selectedConversation.id

            ? {

                ...conv,

                last_message: newMessageData,

                updated_at: newMessageData.created_at,

                unread_count: conv.unread_count || 0,

              }

            : conv

        )

      );



      // Upload images in background and update message
      if (imagesToUpload.length > 0) {
        setUploadingImage(true);

        try {
          const uploadPromises = imagesToUpload.map(async (file) => {
            // Validate file size (max 5MB)
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
            if (file.size > MAX_FILE_SIZE) {
              throw new Error(`Image ${file.name} is too large. Maximum size is 5MB.`);
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
              throw new Error(`Invalid file type for ${file.name}. Please upload JPEG, PNG, GIF, or WebP images.`);
            }

            // Sanitize filename
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `messages/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

            if (uploadError) throw uploadError;

            const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);
            return publicData.publicUrl;
          });

          const imageUrls = await Promise.all(uploadPromises);

          // Update message with image URLs
          console.log('Updating message with image URLs:', newMessageData.id, imageUrls);
          const { error: updateError } = await supabase
            .from("messages")
            .update({ image_urls: imageUrls })
            .eq("id", newMessageData.id);

          if (updateError) {
            console.error('Failed to update message with image URLs:', updateError);
            throw updateError;
          }

          console.log('Message updated successfully, updating local state');

          // Update local state with image URLs
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newMessageData.id
                ? { ...msg, image_urls: imageUrls } as any
                : msg
            )
          );

          toast.success("Images uploaded successfully");

        } catch (err: any) {
          const msg = err?.message ?? String(err);
          console.error('Image upload error:', err);

          if (msg.includes("Bucket not found") || msg.includes("bucket not found") || msg.includes("no such bucket")) {
            toast.error(`Storage bucket "${STORAGE_BUCKET}" not found. Please create it in Supabase Storage.`);
          } else if (msg.includes("row-level security") || msg.includes("violates row-level") || msg.includes("RLS")) {
            toast.error("Storage upload blocked by row-level security. Check bucket policies.");
          } else if (msg.includes("Invalid") || msg.includes("invalid")) {
            toast.error(`Invalid upload: ${msg}`);
          } else if (msg.includes("duplicate") || msg.includes("already exists")) {
            toast.error("File already exists. Please try again with a different file.");
          } else if (msg.includes("quota") || msg.includes("limit") || msg.includes("exceeded")) {
            toast.error("Storage quota exceeded. Please contact administrator.");
          } else {
            toast.error(`Could not upload image: ${msg}`);
          }
        } finally {
          setUploadingImage(false);
        }

      }



      // Update selected conversation

      setSelectedConversation(prev =>

        prev

          ? {

              ...prev,

              last_message: newMessageData,

              updated_at: newMessageData.created_at,

            }

          : null

      );

    } catch (error: any) {

      toast.error(`Failed to send message: ${error.message}`);

    } finally {

      setSending(false);

    }

  };



  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`Image ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image.`);
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...previews]);
      toast.success(`Added ${validFiles.length} image(s)`);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const clearImages = () => {
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setSelectedImages([]);
    setImagePreviews([]);
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

    if (!editingMessageId || !editContent.trim()) return;



    try {

      const { error } = await (supabase.from("messages") as any)

        .update({ content: editContent.trim() })

        .eq("id", editingMessageId);



      if (error) throw error;



      setMessages(prev =>

        prev.map(msg =>

          msg.id === editingMessageId

            ? { ...msg, content: editContent.trim() }

            : msg

        )

      );



      setIsEditModalOpen(false);

      setEditingMessageId(null);

      setEditContent("");

      toast.success("Message updated");

    } catch (error: any) {

      toast.error(`Failed to edit message: ${error.message}`);

    }

  };



  const handleDeleteMessage = async (messageId: string) => {

    setIsDeletingId(messageId);

    try {

      const { error } = await supabase.from("messages").delete().eq("id", messageId);



      if (error) throw error;



      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      toast.success("Message deleted");

    } catch (error: any) {

      toast.error(`Failed to delete message: ${error.message}`);

    } finally {

      setIsDeletingId(null);

    }

  };



  return (

    <>

      <PremiumHero

        title="Messages"

        sub="Chat with other EcoLoop members about trades, purchases, and more."

      />

      <Container className="py-10">

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Conversations List */}
          <Card className="lg:col-span-1 border-2 border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:border-emerald-300 transition-colors">

            <div className="p-5 border-b border-slate-200">

              <div className="relative">

                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <Input

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  placeholder="Search conversations..."

                  className="h-14 pl-12 pr-4 text-base rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all shadow-sm"

                />

              </div>

            </div>

            <ScrollArea className="h-[600px]">

              {loading ? (

                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="h-14 w-14 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>

              ) : filteredConversations.length === 0 ? (

                <div className="p-8 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">
                    {searchQuery ? "No conversations found" : "No conversations yet. Start chatting!"}
                  </p>
                </div>

              ) : (

                <div className="divide-y divide-slate-100">

                  {filteredConversations.map((conv) => (

                    <div

                      key={conv.id}

                      className={`p-4 cursor-pointer transition-all duration-200 relative ${

                        selectedConversation?.id === conv.id 
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-l-emerald-500" 
                          : "hover:bg-slate-50 border-l-4 border-l-transparent"

                      }`}

                      onClick={() => handleConversationClick(conv)}

                    >

                      <div className="flex items-start gap-4">

                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">

                            {conv.other_user?.profile_picture_url ? (

                              <AvatarImage src={conv.other_user.profile_picture_url} alt={conv.other_user.full_name} />

                            ) : (

                              <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 font-semibold text-lg">
                                {conv.other_user?.full_name?.[0] || "?"}
                              </AvatarFallback>

                            )}

                          </Avatar>
                          {/* Online Status Indicator */}
                          <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                            (conv.other_user as any)?.is_online ? 'bg-green-500' : 'bg-slate-400'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center justify-between mb-2">

                            <p className="font-semibold text-base text-slate-900 truncate">{conv.other_user?.full_name}</p>

                            {conv.last_message && (

                              <span className="text-xs text-slate-500 font-medium">

                                {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}

                              </span>

                            )}

                          </div>

                          <div className="flex items-center justify-between">

                            <p className="text-sm text-slate-600 truncate">

                              {conv.last_message

                                ? (conv.last_message as any)?.image_urls && (conv.last_message as any)?.image_urls.length > 0

                                  ? (conv.last_message as any)?.content

                                    ? `${(conv.last_message as any).content} 📷`

                                    : "📷 Photos"

                                  : conv.last_message.content

                                    ? conv.last_message.content

                                    : "No messages yet"

                                : "No messages yet"}

                            </p>

                            {conv.unread_count > 0 && (

                              <Badge className="ml-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                {conv.unread_count}
                              </Badge>

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

          <Card className="lg:col-span-2 border-2 border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden hover:border-emerald-300 transition-colors">

            {selectedConversation ? (

              <div className="h-[600px] flex flex-col">

                {/* Modern Chat Header */}
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">

                  <div className="flex items-center gap-4">

                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">

                        {selectedConversation.other_user?.profile_picture_url ? (

                          <AvatarImage src={selectedConversation.other_user.profile_picture_url} alt={selectedConversation.other_user.full_name} />

                        ) : (

                          <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 font-semibold text-lg">
                            {selectedConversation.other_user?.full_name?.[0] || "?"}
                          </AvatarFallback>

                        )}

                      </Avatar>
                      <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        (selectedConversation.other_user as any)?.is_online ? 'bg-green-500' : 'bg-slate-400'
                      }`} />
                    </div>

                    <div>

                      <p className="font-semibold text-base text-slate-900">{selectedConversation.other_user?.full_name}</p>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {(selectedConversation.other_user as any)?.is_online ? (
                          <><span className="w-2 h-2 rounded-full bg-green-500" /> Online</>
                        ) : (
                          <>Last seen {(selectedConversation.other_user as any)?.last_seen ? formatDistanceToNow(new Date((selectedConversation.other_user as any).last_seen), { addSuffix: true }) : 'recently'}</>
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-100" title="More options">
                      <MoreVertical className="h-5 w-5 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)} className="rounded-full hover:bg-red-50 hover:text-red-600">

                      <X className="h-5 w-5" />

                    </Button>
                  </div>

                </div>

                <ScrollArea className="flex-1 relative">
                  {/* Eco-inspired background pattern */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                    <div className="absolute top-10 left-10 text-6xl">🍃</div>
                    <div className="absolute top-32 right-20 text-5xl">🍃</div>
                    <div className="absolute bottom-40 left-20 text-4xl">🍃</div>
                    <div className="absolute bottom-20 right-10 text-5xl">🍃</div>
                    <div className="absolute top-1/2 left-1/3 text-3xl">🍃</div>
                    <div className="absolute top-20 left-1/2 text-4xl">♻</div>
                    <div className="absolute bottom-32 right-1/3 text-3xl">♻</div>
                  </div>

                  <div className="p-6 space-y-4 relative z-10">

                    {messages.length === 0 ? (

                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-6 shadow-lg">
                          <MessageCircle className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Start the conversation</h3>
                        <p className="text-slate-500 text-center max-w-sm">Send a message to {selectedConversation.other_user?.full_name} to begin chatting about trades, purchases, and more.</p>
                      </div>

                    ) : (

                      messages.map((message) => (

                        <div

                          key={message.id}

                          className={`group flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"} gap-3 items-end animate-in fade-in slide-in-from-bottom-2 duration-300`}

                        >

                          {message.sender_id !== user?.id && (
                            <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                              {selectedConversation.other_user?.profile_picture_url ? (
                                <AvatarImage src={selectedConversation.other_user.profile_picture_url} alt={selectedConversation.other_user.full_name} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 font-semibold text-xs">
                                  {selectedConversation.other_user?.full_name?.[0] || "?"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          )}

                          <div

                            className={`max-w-[65%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${

                              message.sender_id === user?.id

                                ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-br-lg"

                                : "bg-slate-100 text-slate-900 rounded-bl-lg hover:bg-slate-200"

                            }`}

                          >

                            {console.log('Rendering message:', message.id, (message as any).image_urls)}
                            {(message as any).image_urls && (message as any).image_urls.length > 0 && (
                              <div className="mb-2 rounded-lg overflow-hidden">
                                <div className="grid grid-cols-2 gap-2">
                                  {(message as any).image_urls.map((url: string, idx: number) => (
                                    <img
                                      key={idx}
                                      src={url}
                                      alt={`Message image ${idx + 1}`}
                                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(url, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}

                            <div className="flex items-center justify-end gap-2 mt-2">

                              <span className="text-xs opacity-80">{formatTime(message.created_at)}</span>

                              {message.sender_id === user?.id && (
                                <div className="flex items-center gap-0.5">
                                  {message.read_at ? (
                                    <CheckCheck className="h-3.5 w-3.5 opacity-80" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 opacity-80" />
                                  )}
                                </div>
                              )}

                            </div>

                          </div>

                          {message.sender_id === user?.id && (

                            <div className="flex flex-col gap-0.5 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">

                              <Button

                                size="sm"

                                variant="ghost"

                                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 rounded-full"

                                onClick={() => handleEditMessage(message.id, message.content || "")}

                                title="Edit"

                              >

                                <Edit3 className="h-3.5 w-3.5" />

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

                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>

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

                <div className="p-5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">

                  {imagePreviews.length > 0 && (

                    <div className="mb-4 flex flex-wrap gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative inline-block">
                          <img src={preview} alt={`Preview ${index + 1}`} className="h-20 w-20 object-cover rounded-xl border-2 border-emerald-200 shadow-md" />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full shadow-lg"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-3 items-center">

                    <div className="relative">

                      <input

                        type="file"

                        accept="image/*"

                        multiple

                        onChange={handleImageSelect}

                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"

                        disabled={sending || uploadingImage}

                      />

                      <Button type="button" size="sm" variant="outline" disabled={sending || uploadingImage} className="h-12 w-12 rounded-full border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all">

                        <Paperclip className="h-5 w-5 text-slate-600" />

                      </Button>

                    </div>

                    <div className="flex-1 relative">
                      <Input

                        value={newMessage}

                        onChange={(e) => setNewMessage(e.target.value)}

                        placeholder="Type a message..."

                        className="h-12 rounded-full border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all shadow-sm"

                        disabled={sending || uploadingImage}

                      />
                    </div>

                    <Button type="submit" size="sm" disabled={sending || uploadingImage || (!newMessage.trim() && selectedImages.length === 0)} className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-500/30 transition-all">

                      {uploadingImage ? (

                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      ) : (

                        <Send className="h-5 w-5" />

                      )}

                    </Button>

                  </form>

                </div>

              </div>

            ) : (

              <div className="h-[600px] flex items-center justify-center relative">
                {/* Eco-inspired background pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                  <div className="absolute top-20 left-20 text-7xl">🍃</div>
                  <div className="absolute top-40 right-32 text-6xl">🍃</div>
                  <div className="absolute bottom-32 left-32 text-5xl">🍃</div>
                  <div className="absolute bottom-20 right-20 text-6xl">🍃</div>
                  <div className="absolute top-1/2 left-1/4 text-4xl">♻</div>
                  <div className="absolute top-1/3 right-1/4 text-5xl">♻</div>
                </div>

                <div className="text-center relative z-10">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-6 shadow-lg mx-auto">
                    <MessageCircle className="h-16 w-16 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">Select a conversation</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">Choose a conversation from the list to start chatting about trades, purchases, and more with EcoLoop members.</p>
                </div>

              </div>

            )}

          </Card>

        </div>

      </Container>



      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Edit Message</DialogTitle>

          </DialogHeader>

          <Textarea

            value={editContent}

            onChange={(e) => setEditContent(e.target.value)}

            placeholder="Edit your message..."

            className="border-primary/30 focus:border-primary focus:ring-primary/50"

          />

          <DialogFooter>

            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>

              Cancel

            </Button>

            <Button onClick={handleSaveEdit}>Save Changes</Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </>

  );

}

