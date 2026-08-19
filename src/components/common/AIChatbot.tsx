import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
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
    answer: "Farm2Food Cycle is a community platform that connects farmers, restaurants, residents, and LGUs to transform kitchen food waste into valuable compost and fertilizers that support the production of fresh, local produce—reducing food waste, supporting local agriculture, and keeping the community green through a closed-loop food system.",
  },
  {
    keywords: ["how does", "work", "how it works"],
    answer: "The loop works in four steps: 1) Restaurants and homes post available food waste, 2) Farmers request pickups for compost or animal feed, 3) Farmers offer harvests as sale, trade, or barter, 4) LGUs verify members and track island-wide impact.",
  },
  {
    keywords: ["goal", "main goal", "purpose", "mission", "important", "why important"],
    answer: "To close the loop on sustainability by diverting organic waste from landfills, reducing methane emissions, and creating inputs for local food production to strengthen island food security.",
  },
  // User Roles
  {
    keywords: ["who can use", "who can join", "roles", "participants"],
    answer: "Four roles can participate: Local Farmers, Restaurants, Residents, and LGU Admins. Each role has specific functions in the circular food system.",
  },
  {
    keywords: ["farmer", "farmers", "what can farmers"],
    answer: "Farmers can post crops, schedule harvests, request food waste for compost or feed, and offer harvests for sale, trade, or barter.",
  },
  {
    keywords: ["restaurant", "restaurants", "what can restaurants"],
    answer: "Restaurants can offer daily food waste, promote menu items, and barter meals for produce.",
  },
  {
    keywords: ["resident", "residents", "what can residents", "buy produce", "where can i buy", "purchase", "buy local"],
    answer: "Residents can drop household scraps, join barter trades, and buy local produce from the marketplace. You can browse the Fresh Produce Marketplace to find available crops, fruits, vegetables, and organic products from local farmers.",
  },
  {
    keywords: ["lgu", "admin", "what do lgu"],
    answer: "LGU Admins monitor waste diversion, verify users, publish announcements, and generate reports to track community-wide impact.",
  },
  // Features
  {
    keywords: ["ecofeed", "feed", "social feed"],
    answer: "EcoFeed is a social feed of available crops, waste, and trades from your barangay with photos, weight, price, location, and dates.",
  },
  {
    keywords: ["marketplace", "marketplaces", "what marketplaces"],
    answer: "Three markets: Fresh Produce Marketplace (fruits, vegetables, herbs), Farm Goods Marketplace (compost, fertilizers), and Food Waste Marketplace (available waste with quantity and pickup details).",
  },
  {
    keywords: ["barter", "trade", "swap", "cashless"],
    answer: "You can swap waste, produce, and meals without cash. The system tracks every trade end-to-end with approval and status tracking.",
  },
  {
    keywords: ["smart search", "search", "find"],
    answer: "Smart Search lets you find items by crop, user, barangay, address, restaurant, or waste type instantly.",
  },
  {
    keywords: ["dashboard", "lgu dashboard", "monitor"],
    answer: "The LGU Dashboard monitors waste collected, diversion rates, active users, successful trades, crop output, and generates monthly reports.",
  },
  // Registration & Getting Started
  {
    keywords: ["join", "register", "sign up", "how to join"],
    answer: "You can create an account as a Farmer, Restaurant Owner, or Resident. LGU Admin accounts require approval. Simply sign up with your email or Google account.",
  },
  {
    keywords: ["information", "what information", "register details"],
    answer: "You'll need your full name, phone, barangay (e.g., General Luna), address (optional), and your role (Farmer, Restaurant, Resident, or LGU Admin).",
  },
  {
    keywords: ["free", "cost", "price"],
    answer: "Yes, Farm2Food Cycle is a community platform designed to be accessible to everyone in the community.",
  },
  // Benefits & Impact
  {
    keywords: ["diverting", "divert waste", "why important"],
    answer: "Diverting organic waste from landfills reduces methane emissions, cuts pollution in waterways, and creates inputs for local food production—strengthening island food security and lowering costs for farmers.",
  },
  {
    keywords: ["environment", "environmental", "help environment"],
    answer: "It reduces environmental pollution and methane from landfills, supports local food production with low-cost farm goods, and strengthens barangay-level cooperation and barter culture.",
  },
  {
    keywords: ["principles", "values", "core"],
    answer: "The four principles are: Divert (reroute organic waste away from landfills), Regenerate (build soil and grow more food locally), Connect (make the community the platform), and Sustain (protect communities for the next generation).",
  },
  // Technical & Account
  {
    keywords: ["password", "reset password", "forgot password"],
    answer: "You can reset your password by clicking 'Forgot password?' on the sign-in page and entering your email to receive a reset link.",
  },
  {
    keywords: ["verified", "verify", "verification"],
    answer: "LGUs verify accounts to keep the network trusted and safe for all community members.",
  },
  {
    keywords: ["mobile", "phone", "app"],
    answer: "Yes, Farm2Food Cycle is designed to work on both desktop and mobile devices for easy community access.",
  },
  {
    keywords: ["contact", "support", "help"],
    answer: "You can send a message through the Contact page with your name, email, subject, and message. The team will get back to you shortly.",
  },
  // Planning & Forecasting
  {
    keywords: ["planning", "forecast", "future"],
    answer: "The Planning & Forecast feature allows farmers to plan future harvests and forecast supply so farmers and buyers can coordinate ahead of time.",
  },
  {
    keywords: ["map", "location", "pickup points"],
    answer: "The Maps & Locations feature shows user locations, pickup points, nearby food waste sources, and nearby farms at a glance.",
  },
  // Community & Cooperation
  {
    keywords: ["barangay", "cooperation", "community"],
    answer: "It strengthens barangay-level cooperation by enabling barter culture, connecting neighbors through waste sharing, and facilitating community-wide planning with future-supply and future-need announcements.",
  },
  // Greetings
  {
    keywords: ["hello", "hi", "hey"],
    answer: "Hello! I'm Farm2Food Cycle Assistant. I can help with marketplace questions, waste management, and local tips.",
  },
];

const suggestedQuestions = [
  "What is Farm2Food Cycle?",
  "How does the platform work?",
  "What can farmers do?",
];

const followUpQuestions: Record<string, string[]> = {
  "what is": ["How does the platform work?", "What are the user roles?", "Why is it important?"],
  "how does": ["What can farmers do?", "What can restaurants do?", "What is EcoFeed?"],
  "work": ["What are the user roles?", "What marketplaces are available?", "How do I join?"],
  "farmer": ["What can restaurants do?", "What can residents do?", "How does barter work?"],
  "restaurant": ["What can farmers do?", "What can residents do?", "How do I post waste?"],
  "resident": ["What can farmers do?", "How do I join barter trades?", "Where can I buy produce?"],
  "lgu": ["What does the dashboard show?", "How are accounts verified?", "How to generate reports?"],
  "marketplace": ["What is EcoFeed?", "How does barter work?", "What is Smart Search?"],
  "barter": ["How are trades tracked?", "Can I swap without cash?", "What can I trade?"],
  "join": ["What information do I need?", "Is it free to use?", "How long does approval take?"],
  "environment": ["What are the principles?", "How does it reduce waste?", "What is the impact?"],
  "default": ["What is Farm2Food Cycle?", "How does the platform work?", "What can farmers do?"],
};

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Check against QA database
  for (const qa of qaDatabase) {
    const hasKeyword = qa.keywords.some(keyword => lowerMessage.includes(keyword));
    if (hasKeyword) {
      return qa.answer;
    }
  }

  // Default fallback
  return "I'm here to help with Farm2Food Cycle questions. Try asking about how it works, user roles, marketplaces, barter system, or how to get started.";
}

export function AIChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi! I'm the Farm2Food Cycle assistant. I can help you with product recommendations, marketplace questions, waste management info, and location assistance. What would you like to know?",
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
      let botText = getFallbackResponse(userMessage);

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
          : "Sorry, something went wrong. Please try again later.";
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
        return followUpQuestions[key];
      }
    }
    return followUpQuestions["default"];
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
        title="Chat with Farm2Food Cycle Assistant"
        size="icon"
      >
        <img src={aiIcon} alt="AI" className="h-16 w-16" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md h-[600px] flex flex-col p-0 border border-slate-200 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600">
            <DialogTitle className="flex items-center gap-2 text-white">
              <img src={aiIcon} alt="AI" className="h-8 w-8" />
              Farm2Food Cycle Assistant
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50">
            {messages.length === 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Suggested questions:</span>
                </div>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
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
                  <span>Follow-up questions:</span>
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
