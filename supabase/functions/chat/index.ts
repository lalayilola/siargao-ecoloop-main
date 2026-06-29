import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("VITE_GEMINI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!geminiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const systemPrompt = `You are an AI assistant for EcoLoop, a circular economy marketplace in Siargao, Philippines.

Your role is to help users with:
- Product search and recommendations from the marketplace (produce, waste materials, compost)
- How to use the marketplace features (buying, selling, bartering, trading)
- Waste management and recycling information for Siargao
- Location-based assistance and information about areas in Siargao
- Information about the circular economy and sustainable practices

Marketplace Details:
- Farmers list: fresh produce (vegetables, fruits, crops)
- Restaurants list: food waste for composting
- LGU lists: organic fertilizer
- Residents can buy: fresh produce, compost materials
- Transactions: sell, buy, barter, trade
- Location: listings show barangay for coordination

Guidelines:
- Be friendly, helpful, and concise
- Keep responses under 200 words
- Use simple language that's easy to understand
- If you don't know something specific, direct them to browse the marketplace
- For product questions, mention specific categories (produce, waste, fertilizer)
- Be supportive of the EcoLoop mission and circular economy principles

Context: EcoLoop connects farmers, restaurants, hotels, residents, and LGU (Local Government Units) in Siargao to buy, sell, and barter sustainable products and waste materials.`;

function getFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase();

  // Greetings
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I’m EcoLoop Assistant. I can help you find fresh produce, compost, waste materials, and other sustainable items in the marketplace. What are you looking for?";
  }

  // Products available
  if (lowerMessage.includes("what") && (lowerMessage.includes("product") || lowerMessage.includes("available") || lowerMessage.includes("marketplace"))) {
    return "The EcoLoop marketplace offers fresh produce (vegetables, fruits), food waste for composting, organic fertilizer, and other sustainable materials. Farmers, restaurants, and residents list items here. Browse the marketplace to see current listings!";
  }

  // Who buys produce
  if (lowerMessage.includes("who") && (lowerMessage.includes("buy") || lowerMessage.includes("purchase"))) {
    return "Residents, restaurants, hotels, and LGU staff can buy fresh produce from farmers in the marketplace. You can also barter or trade items. Check the marketplace for available listings and sellers.";
  }

  // What's in marketplace
  if (lowerMessage.includes("what") && lowerMessage.includes("marketplace")) {
    return "The marketplace includes listings for: fresh produce from farmers, food waste for composting, organic fertilizer from LGU, and other sustainable materials. Each listing shows the seller, quantity, price, and location.";
  }

  // Recommendations
  if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest")) {
    return "I recommend browsing the marketplace based on your role: farmers can list produce, restaurants can list food waste, residents can buy fresh items, and LGU can list organic fertilizer. Filter by category and location to find what you need!";
  }

  // Buying/selling/trading
  if (lowerMessage.includes("buy") || lowerMessage.includes("sell") || lowerMessage.includes("trade") || lowerMessage.includes("barter")) {
    return "You can buy, sell, barter, or trade in the marketplace. Create listings for items you have, or browse listings from others. Transactions can be for money or barter exchanges. Check each listing for available options.";
  }

  // Waste management
  if (lowerMessage.includes("waste") || lowerMessage.includes("recycle") || lowerMessage.includes("compost")) {
    return "EcoLoop helps with waste management by connecting restaurants with farmers who can use food waste for composting. You can also find organic fertilizer listings from LGU. Use the marketplace to find waste materials or compost opportunities.";
  }

  // Location assistance
  if (lowerMessage.includes("location") || lowerMessage.includes("siargao") || lowerMessage.includes("where")) {
    return "EcoLoop operates across Siargao with listings from different barangays. You can filter marketplace items by location to find sellers near you. Each listing shows the seller's barangay for easy coordination.";
  }

  // Thanks
  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
    return "You're welcome! Feel free to ask more questions about the marketplace, waste management, or any EcoLoop features. I'm here to help!";
  }

  // Default
  return "I can help you with the EcoLoop marketplace - finding fresh produce, compost materials, waste management, and local Siargao services. Try asking about available products, how to buy/sell, or waste recycling options.";
}

async function getGeminiResponse(message: string) {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemPrompt}\n\nUser question: ${message}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  };

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const responseText = await geminiResponse.text();

    if (geminiResponse.ok) {
      try {
        const geminiData = responseText ? JSON.parse(responseText) : {};
        const aiResponse =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
          geminiData.output?.text ||
          "";

        if (aiResponse) {
          return aiResponse;
        }
      } catch (parseError) {
        lastError = parseError;
      }
    } else {
      lastError = {
        status: geminiResponse.status,
        body: responseText,
      };
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    }
  }

  throw lastError || new Error("Unable to get a response from Gemini");
}

serve(async (req) => {
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!message) {
      return jsonResponse({ error: "Missing message" }, 400);
    }

    let aiResponse;
    let aiSource = "gemini";

    try {
      aiResponse = await getGeminiResponse(message);
    } catch (error) {
      console.error("Gemini request failed, using fallback response:", error);
      aiResponse = getFallbackResponse(message);
      aiSource = "fallback";
    }

    // Save to Supabase when the service role key is available.
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error: insertError } = await supabase.from("chat_messages").insert({
          user_id: userId ?? "anonymous",
          message,
          response: aiResponse,
        });

        if (insertError) {
          console.error("Error saving chat message:", insertError);
        }
      } catch (saveError) {
        console.error("Error initializing Supabase client for chat logging:", saveError);
      }
    }

    return jsonResponse({ response: aiResponse });
  } catch (error) {
    console.error("Error in chat function:", error);
    return jsonResponse(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});
