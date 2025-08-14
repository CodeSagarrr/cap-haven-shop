import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_record_id: string;
}

// Function to verify Razorpay signature
function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  
  const message = orderId + "|" + paymentId;
  const key = encoder.encode(secret);
  const data = encoder.encode(message);
  
  return crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(cryptoKey => 
    crypto.subtle.sign("HMAC", cryptoKey, data)
  ).then(signatureArrayBuffer => {
    const signatureArray = Array.from(new Uint8Array(signatureArrayBuffer));
    const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return expectedSignature === signature;
  }).catch(() => false);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_record_id 
    }: VerifyPaymentRequest = await req.json();

    console.log("Verifying payment:", { 
      order_id: razorpay_order_id, 
      payment_id: razorpay_payment_id,
      order_record_id 
    });

    // Verify signature
    const isSignatureValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isSignatureValid) {
      console.error("Invalid signature");
      throw new Error("Payment verification failed");
    }

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update order status to paid
    const { data: updatedOrder, error: updateError } = await supabaseService
      .from("orders")
      .update({ 
        status: "paid",
        updated_at: new Date().toISOString()
      })
      .eq("id", order_record_id)
      .eq("stripe_session_id", razorpay_order_id) // Additional security check
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error("Failed to update order status");
    }

    console.log("Order updated successfully:", updatedOrder);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        order: updatedOrder,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in verify-razorpay-payment function:", error);
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