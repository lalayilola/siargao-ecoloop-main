import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";
import aiIcon from "@/assets/ai.png";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

function getFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I’m EcoLoop Assistant. I can help with marketplace questions, waste management, and local tips for Siargao.";
  }

  if (lowerMessage.includes("marketplace") || lowerMessage.includes("buy") || lowerMessage.includes("sell") || lowerMessage.includes("trade")) {
    return "You can browse the EcoLoop marketplace to buy, sell, barter, or trade produce, compost, waste materials, and other sustainable items.";
  }

  if (lowerMessage.includes("waste") || lowerMessage.includes("recycle") || lowerMessage.includes("compost")) {
    return "EcoLoop supports better waste sorting and circular economy practices. You can also use the local waste and collection features for guidance.";
  }

  if (lowerMessage.includes("location") || lowerMessage.includes("siargao") || lowerMessage.includes("where")) {
    return "Siargao has many eco-friendly local services and community listings. You can use EcoLoop to find nearby opportunities and useful local information.";
  }

  return "I’m here to help with EcoLoop marketplace questions, waste management, and local Siargao information. Try asking about buying, selling, recycling, or nearby services.";
}

export function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi! I'm the EcoLoop assistant. I can help you with product recommendations, marketplace questions, waste management info, and location assistance in Siargao. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      let botText = getFallbackResponse(userMessage);

      if (supabaseUrl && supabaseKey && accessToken) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: userMessage,
              userId: user.id,
            }),
          });

          const responseText = await response.text();
          if (response.ok) {
            try {
              const data = responseText ? JSON.parse(responseText) : {};
              botText = data.response || getFallbackResponse(userMessage);
            } catch (parseError) {
              console.warn("Chat response was not valid JSON, using fallback.", parseError);
              botText = getFallbackResponse(userMessage);
            }
          } else {
            console.warn("Chat function returned an error, using fallback.", response.status, responseText);
          }
        } catch (error) {
          console.warn("Error invoking chat function, using fallback.", error);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: botText,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error handling chat input:", error);
      const errorText = error instanceof Error ? error.message : "Sorry, something went wrong. Please try again later.";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errorText,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-transparent text-white shadow-none hover:shadow-none transition-all hover:scale-110 z-40 p-0"
        title="Chat with Siargao EcoLoop Assistant"
        size="icon"
      >
        <img src={aiIcon} alt="AI" className="h-16 w-16" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md h-[600px] flex flex-col p-0 border border-slate-200 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600">
            <DialogTitle className="flex items-center gap-2 text-white">
              <img src={aiIcon} alt="AI" className="h-8 w-8" />
              Siargao EcoLoop Assistant
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-primary to-secondary text-white rounded-br-none"
                      : "bg-white text-slate-900 border border-slate-200/60 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 border border-slate-200/60 px-4 py-2 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-600">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200/60 p-4 bg-white flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 border-primary/30 focus:border-primary focus:ring-primary/50"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 rounded-full w-10 h-10 p-0"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
