import { useEffect, useState, useRef, useCallback } from "react";

import { Container, PageHero } from "@/components/layout/Section";

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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

          image_url

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

          // Update local messages state

          setMessages(prev =>

            prev.map(msg =>

              msg.id === updatedMsg.id ? { ...msg, read_at: updatedMsg.read_at } : msg

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

    if (!selectedConversation || !user || (!newMessage.trim() && !selectedImage)) return;



    setSending(true);

    try {

      let imageUrl: string | null = null;



      // Upload image if selected

      if (selectedImage) {

        setUploadingImage(true);

        try {

          const filePath = `messages/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${selectedImage.name}`;

          const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, selectedImage);

          

          if (uploadError) throw uploadError;

          

          const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);

          imageUrl = publicData.publicUrl;

        } catch (err: any) {

          const msg = err?.message ?? String(err);

          if (msg.includes("Bucket not found") || msg.includes("bucket not found")) {

            toast.error(`Storage bucket "${STORAGE_BUCKET}" not found.`);

          } else if (msg.includes("row-level security")) {

            toast.error("Storage upload blocked by row-level security.");

          } else {

            toast.error(`Could not upload image: ${msg}`);

          }

          setUploadingImage(false);

          setSending(false);

          return;

        } finally {

          setUploadingImage(false);

        }

      }



      const { data, error } = await supabase

        .from("messages")

        .insert({

          conversation_id: selectedConversation.id,

          sender_id: user.id,

          content: newMessage.trim() || "",

          image_url: imageUrl,

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

      setSelectedImage(null);

      setImagePreview(null);

      

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

    const file = e.target.files?.[0];

    if (file) {

      if (file.size > 5 * 1024 * 1024) { // 5MB limit

        toast.error("Image size must be less than 5MB");

        return;

      }

      if (!file.type.startsWith("image/")) {

        toast.error("Please select an image file");

        return;

      }

      setSelectedImage(file);

      setImagePreview(URL.createObjectURL(file));

    }

  };



  const clearImage = () => {

    setSelectedImage(null);

    setImagePreview(null);

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

                              {conv.last_message

                                ? (conv.last_message as any)?.image_url

                                  ? (conv.last_message as any)?.content

                                    ? `${(conv.last_message as any).content} 📷`

                                    : "📷 Photo"

                                  : conv.last_message.content

                                    ? conv.last_message.content

                                    : "No messages yet"

                                : "No messages yet"}

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

                          className={`group flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"} gap-2 items-end`}

                        >

                          <div

                            className={`max-w-[60%] rounded-lg px-3 py-2 ${

                              message.sender_id === user?.id

                                ? "bg-primary text-primary-foreground"

                                : "bg-sand text-slate-900"

                            }`}

                          >

                            {(message as any).image_url && (

                              <img

                                src={(message as any).image_url}

                                alt="Message image"

                                className="max-w-full h-auto rounded-lg mb-2"

                              />

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

                <div className="p-4 border-t">

                  {imagePreview && (

                    <div className="mb-3 relative inline-block">

                      <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border border-primary/20" />

                      <Button

                        type="button"

                        size="sm"

                        variant="destructive"

                        className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"

                        onClick={clearImage}

                      >

                        <X className="h-3 w-3" />

                      </Button>

                    </div>

                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2">

                    <div className="relative">

                      <input

                        type="file"

                        accept="image/*"

                        onChange={handleImageSelect}

                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"

                        disabled={sending || uploadingImage}

                      />

                      <Button type="button" size="sm" variant="outline" disabled={sending || uploadingImage}>

                        <ImageIcon className="h-4 w-4" />

                      </Button>

                    </div>

                    <Input

                      value={newMessage}

                      onChange={(e) => setNewMessage(e.target.value)}

                      placeholder="Type a message..."

                      className="flex-1 border-primary/30 focus:border-primary focus:ring-primary/50"

                      disabled={sending || uploadingImage}

                    />

                    <Button type="submit" size="sm" disabled={sending || uploadingImage || (!newMessage.trim() && !selectedImage)}>

                      {uploadingImage ? (

                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />

                      ) : (

                        <Send className="h-4 w-4" />

                      )}

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

