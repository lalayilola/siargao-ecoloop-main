import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Lightbulb } from "lucide-react";
import aiIcon from "@/assets/ai.png";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface QA {
  keywords: string[];
  answer: string;
}

const qaDatabase: QA[] = [
  // General Questions
  {
    keywords: ["what is", "farm2food", "platform", "about"],
    answer: "chatbot.whatIsAnswer",
  },
  {
    keywords: ["how does", "work", "how it works"],
    answer: "chatbot.howItWorksAnswer",
  },
  {
    keywords: ["goal", "main goal", "purpose", "mission", "important", "why important"],
    answer: "chatbot.goalAnswer",
  },
  // User Roles
  {
    keywords: ["who can use", "who can join", "roles", "participants"],
    answer: "chatbot.whoCanUseAnswer",
  },
  {
    keywords: ["farmer", "farmers", "what can farmers"],
    answer: "chatbot.farmersAnswer",
  },
  {
    keywords: ["restaurant", "restaurants", "what can restaurants"],
    answer: "chatbot.restaurantsAnswer",
  },
  {
    keywords: ["resident", "residents", "what can residents", "buy produce", "where can i buy", "purchase", "buy local"],
    answer: "chatbot.residentsAnswer",
  },
  {
    keywords: ["lgu", "admin", "what do lgu"],
    answer: "chatbot.lguAnswer",
  },
  // Features
  {
    keywords: ["ecofeed", "feed", "social feed"],
    answer: "chatbot.ecofeedAnswer",
  },
  {
    keywords: ["marketplace", "marketplaces", "what marketplaces"],
    answer: "chatbot.marketplaceAnswer",
  },
  {
    keywords: ["barter", "trade", "swap", "cashless"],
    answer: "chatbot.barterAnswer",
  },
  {
    keywords: ["smart search", "search", "find"],
    answer: "chatbot.smartSearchAnswer",
  },
  {
    keywords: ["dashboard", "lgu dashboard", "monitor"],
    answer: "chatbot.dashboardAnswer",
  },
  // Registration & Getting Started
  {
    keywords: ["join", "register", "sign up", "how to join"],
    answer: "chatbot.joinAnswer",
  },
  {
    keywords: ["information", "what information", "register details"],
    answer: "chatbot.informationAnswer",
  },
  {
    keywords: ["free", "cost", "price"],
    answer: "chatbot.freeAnswer",
  },
  // Benefits & Impact
  {
    keywords: ["diverting", "divert waste", "why important"],
    answer: "chatbot.divertingAnswer",
  },
  {
    keywords: ["environment", "environmental", "help environment"],
    answer: "chatbot.environmentAnswer",
  },
  {
    keywords: ["principles", "values", "core"],
    answer: "chatbot.principlesAnswer",
  },
  // Technical & Account
  {
    keywords: ["password", "reset password", "forgot password"],
    answer: "chatbot.passwordAnswer",
  },
  {
    keywords: ["verified", "verify", "verification"],
    answer: "chatbot.verifiedAnswer",
  },
  {
    keywords: ["mobile", "phone", "app"],
    answer: "chatbot.mobileAnswer",
  },
  {
    keywords: ["contact", "support", "help"],
    answer: "chatbot.contactAnswer",
  },
  // Planning & Forecasting
  {
    keywords: ["planning", "forecast", "future"],
    answer: "chatbot.planningAnswer",
  },
  {
    keywords: ["map", "location", "pickup points"],
    answer: "chatbot.mapAnswer",
  },
  // Community & Cooperation
  {
    keywords: ["barangay", "cooperation", "community"],
    answer: "chatbot.barangayAnswer",
  },
  {
    keywords: ["post waste", "how do i post", "post food waste", "add waste", "upload waste"],
    answer: "chatbot.postWasteAnswer",
  },
  // Greetings
  {
    keywords: ["hello", "hi", "hey"],
    answer: "chatbot.greetingAnswer",
  },
];

const suggestedQuestionsKeys = [
  "chatbot.question1",
  "chatbot.question2",
  "chatbot.question3",
];

const followUpQuestions: Record<string, string[]> = {
  "what is": ["chatbot.whatIsFollowUp.0", "chatbot.whatIsFollowUp.1", "chatbot.whatIsFollowUp.2"],
  "how does": ["chatbot.howDoesFollowUp.0", "chatbot.howDoesFollowUp.1", "chatbot.howDoesFollowUp.2"],
  "work": ["chatbot.workFollowUp.0", "chatbot.workFollowUp.1", "chatbot.workFollowUp.2"],
  "farmer": ["chatbot.farmerFollowUp.0", "chatbot.farmerFollowUp.1", "chatbot.farmerFollowUp.2"],
  "restaurant": ["chatbot.restaurantFollowUp.0", "chatbot.restaurantFollowUp.1", "chatbot.restaurantFollowUp.2"],
  "resident": ["chatbot.residentFollowUp.0", "chatbot.residentFollowUp.1", "chatbot.residentFollowUp.2"],
  "lgu": ["chatbot.lguFollowUp.0", "chatbot.lguFollowUp.1", "chatbot.lguFollowUp.2"],
  "marketplace": ["chatbot.marketplaceFollowUp.0", "chatbot.marketplaceFollowUp.1", "chatbot.marketplaceFollowUp.2"],
  "barter": ["chatbot.barterFollowUp.0", "chatbot.barterFollowUp.1", "chatbot.barterFollowUp.2"],
  "join": ["chatbot.joinFollowUp.0", "chatbot.joinFollowUp.1", "chatbot.joinFollowUp.2"],
  "environment": ["chatbot.environmentFollowUp.0", "chatbot.environmentFollowUp.1", "chatbot.environmentFollowUp.2"],
  "default": ["chatbot.defaultFollowUp.0", "chatbot.defaultFollowUp.1", "chatbot.defaultFollowUp.2"],
};

function getFallbackResponse(message: string, t: (key: string) => string): string {
  const lowerMessage = message.toLowerCase();

  // Check against QA database
  for (const qa of qaDatabase) {
    const hasKeyword = qa.keywords.some(keyword => lowerMessage.includes(keyword));
    if (hasKeyword) {
      return t(qa.answer);
    }
  }

  // Default fallback
  return t("chatbot.fallbackAnswer");
}

export function AIChatbot() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: t("chatbot.welcomeMessage"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  const handleSend = async (messageText?: string) => {
    const userMessage = messageText || input;
    if (!userMessage.trim() || !user || loading) return;

    if (!messageText) {
      setInput("");
    }
    setLastUserMessage(userMessage);
    setMessages((prev) => [...prev, { role: "user", text: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      // Add a small delay to simulate thinking
      await new Promise(resolve => setTimeout(resolve, 800));

      // Always use the fallback Q&A database first for accuracy
      let botText = getFallbackResponse(userMessage, t);

      // Add typing animation
      setIsTyping(true);
      setTypingText("");
      
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < botText.length) {
          setTypingText(prev => prev + botText[index]);
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          setLoading(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: botText,
              timestamp: new Date(),
            },
          ]);
          setTypingText("");
        }
      }, 10); // Type 10ms per character
    } catch (error) {
      console.error("Error handling chat input:", error);
      const errorText =
        error instanceof Error
          ? error.message
          : t("chatbot.errorMessage");
      setIsTyping(false);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: errorText,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const getFollowUpQuestions = (lastMessage: string): string[] => {
    const lowerMessage = lastMessage.toLowerCase();
    for (const key in followUpQuestions) {
      if (lowerMessage.includes(key)) {
        return followUpQuestions[key].map(q => t(q));
      }
    }
    return followUpQuestions["default"].map(q => t(q));
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-transparent text-white shadow-none hover:shadow-none transition-all hover:scale-110 z-40 p-0"
        title={t("chatbot.title")}
        size="icon"
      >
        <img src={aiIcon} alt="AI" className="h-16 w-16" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md h-[600px] flex flex-col p-0 border border-slate-200 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600">
            <DialogTitle className="flex items-center gap-2 text-white">
              <img src={aiIcon} alt="AI" className="h-8 w-8" />
              {t("chatbot.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50">
            {messages.length === 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>{t("chatbot.suggestedQuestions")}</span>
                </div>
                <div className="space-y-2">
                  {suggestedQuestionsKeys.map((key, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(t(key))}
                      className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm text-slate-700 hover:text-primary"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
            {isTyping && typingText && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 border border-slate-200/60 px-4 py-2 rounded-lg rounded-bl-none shadow-sm">
                  <span className="text-sm">{typingText}</span>
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                </div>
              </div>
            )}
            {!loading && !isTyping && messages.length > 1 && lastUserMessage && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>{t("chatbot.followUpQuestions")}</span>
                </div>
                <div className="space-y-2">
                  {getFollowUpQuestions(lastUserMessage).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm text-slate-700 hover:text-primary"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loading && !isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 border border-slate-200/60 px-4 py-2 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-600">{t("chatbot.thinking")}</span>
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
              placeholder={t("chatbot.placeholder")}
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
