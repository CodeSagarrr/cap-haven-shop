import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderDateTime: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    image_url?: string;
    customization?: { nickname?: string };
  }>;
  totalAmount: number;
}

const generateOrderEmailHTML = (order: OrderEmailRequest): string => {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; vertical-align: top;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">` : ''}
          <div>
            <div style="font-weight: 600; color: #333;">${item.title}</div>
            ${item.customization?.nickname ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">Custom: "${item.customization.nickname}"</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px; text-align: center; color: #666;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; color: #333; font-weight: 500;">₹${item.price.toLocaleString()}</td>
      <td style="padding: 12px; text-align: right; color: #333; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification - ${order.orderId}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🛍️ New Order Received!</h1>
          <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Order ID: ${order.orderId}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 0; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Order Summary -->
          <div style="padding: 30px; border-bottom: 2px solid #f1f5f9;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 600;">📋 Order Summary</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; font-weight: 500;">ORDER DATE</p>
                <p style="margin: 0; color: #334155; font-weight: 600;">${new Date(order.orderDateTime).toLocaleDateString('en-IN', { 
                  year: 'numeric', month: 'long', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}</p>
              </div>
              <div>
                <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; font-weight: 500;">PAYMENT METHOD</p>
                <p style="margin: 0; color: #334155; font-weight: 600;">${order.paymentMethod}</p>
              </div>
            </div>
            <div style="background: ${order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7'}; padding: 12px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: ${order.paymentStatus === 'paid' ? '#166534' : '#92400e'}; font-weight: 600; font-size: 16px;">
                Payment Status: ${order.paymentStatus.toUpperCase()}
                ${order.paymentStatus === 'paid' ? '✅' : '⏳'}
              </p>
            </div>
          </div>

          <!-- Customer Details -->
          <div style="padding: 30px; border-bottom: 2px solid #f1f5f9;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 600;">👤 Customer Details</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Name</p>
                  <p style="margin: 0; color: #334155; font-weight: 600; font-size: 16px;">${order.customerName}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Phone</p>
                  <p style="margin: 0; color: #334155; font-weight: 600; font-size: 16px;">${order.customerPhone}</p>
                </div>
              </div>
              <div>
                <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 500; text-transform: uppercase;">Email</p>
                <p style="margin: 0; color: #334155; font-weight: 600; font-size: 16px;">${order.customerEmail}</p>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="padding: 30px; border-bottom: 2px solid #f1f5f9;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 600;">🚚 Shipping Address</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
              <p style="margin: 0; color: #334155; line-height: 1.6; font-size: 16px;">
                <strong>${order.customerName}</strong><br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                ${order.shippingAddress.country}
              </p>
            </div>
          </div>

          <!-- Order Items -->
          <div style="padding: 30px;">
            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 600;">📦 Order Items</h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 16px; text-align: left; color: #475569; font-weight: 600; font-size: 14px;">Product</th>
                    <th style="padding: 16px; text-align: center; color: #475569; font-weight: 600; font-size: 14px;">Qty</th>
                    <th style="padding: 16px; text-align: right; color: #475569; font-weight: 600; font-size: 14px;">Price</th>
                    <th style="padding: 16px; text-align: right; color: #475569; font-weight: 600; font-size: 14px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr style="background: #f8fafc; border-top: 2px solid #e2e8f0;">
                    <td colspan="3" style="padding: 20px; text-align: right; color: #1e293b; font-size: 18px; font-weight: 700;">
                      Grand Total:
                    </td>
                    <td style="padding: 20px; text-align: right; color: #1e293b; font-size: 20px; font-weight: 700;">
                      ₹${order.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
          <p style="margin: 0;">This is an automated notification from CAPSTORE</p>
          <p style="margin: 8px 0 0; font-size: 12px;">Please process this order as soon as possible</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!adminEmail) {
      throw new Error("Admin email not configured");
    }

    const orderData: OrderEmailRequest = await req.json();

    console.log("Sending order email for:", orderData.orderId);

    const emailResponse = await resend.emails.send({
      from: "CAPSTORE Orders <orders@resend.dev>",
      to: [adminEmail],
      subject: `🛍️ New Order #${orderData.orderId.substring(0, 8)} - ₹${orderData.totalAmount.toLocaleString()}`,
      html: generateOrderEmailHTML(orderData),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Order email sent successfully"
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send order email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);