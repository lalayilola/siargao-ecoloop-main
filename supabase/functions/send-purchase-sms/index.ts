import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("63") && digits.length > 10) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.length === 10) return `+63${digits}`;
  return `+${digits}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    const { phone, sellerUserId, listingTitle, buyerName, sellerName } = await req.json();

    if (!listingTitle) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    let resolvedPhone = phone;
    let resolvedSellerName = sellerName;

    if (!resolvedPhone && sellerUserId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data: sellerProfile, error: sellerProfileError } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("id", sellerUserId)
          .single();

        if (!sellerProfileError && sellerProfile?.phone) {
          resolvedPhone = sellerProfile.phone;
          resolvedSellerName = resolvedSellerName || sellerProfile.full_name || "Seller";
        }
      }
    }

    const normalizedPhone = normalizePhoneNumber(resolvedPhone);
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body = `${resolvedSellerName || "Seller"}, ${buyerName || "A buyer"} just purchased your listing: ${listingTitle}.`;

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER") || Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    let response: Response;
    let responseText: string;

    if (accountSid && authToken && fromNumber) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append("To", normalizedPhone);
      params.append("From", fromNumber);
      params.append("Body", body);

      response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      responseText = await response.text();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Twilio request failed", details: responseText }), {
          status: response.status,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
    } else {
      const textbeltUrl = "https://textbelt.com/text";
      const textbeltResponse = await fetch(textbeltUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: body,
          key: Deno.env.get("TEXTBELT_KEY") || "textbelt",
        }),
      });
      responseText = await textbeltResponse.text();
      response = textbeltResponse;

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "SMS provider request failed", details: responseText }), {
          status: response.status,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, phone: normalizedPhone, provider: accountSid && authToken && fromNumber ? "twilio" : "textbelt", details: responseText }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
