import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  orderData: {
    user_email: string;
    user_id?: string;
    items: any[];
    shipping_address: any;
    total_price: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Parse request body
    const { amount, currency = "INR", receipt, orderData }: CreateOrderRequest = await req.json();

    console.log("Creating Razorpay order:", { amount, currency, receipt });

    // Create Razorpay order
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount, // Amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          user_email: orderData.user_email,
          user_id: orderData.user_id || "",
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay API error:", errorData);
      throw new Error(`Razorpay API error: ${razorpayResponse.status}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log("Razorpay order created:", razorpayOrder);

    // Create Supabase client with service role key for secure operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Save order in Supabase database
    const { data: orderRecord, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        user_email: orderData.user_email,
        user_id: orderData.user_id || null,
        items: orderData.items,
        shipping_address: orderData.shipping_address,
        total_price: orderData.total_price,
        status: "pending",
        stripe_session_id: razorpayOrder.id, // Using this field for Razorpay order ID
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error saving order:", orderError);
      throw new Error("Failed to save order");
    }

    console.log("Order saved to database:", orderRecord);

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          ...razorpayOrder,
          key_id: razorpayKeyId, // Include the key ID for frontend
        },
        order_record_id: orderRecord.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-razorpay-order function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});