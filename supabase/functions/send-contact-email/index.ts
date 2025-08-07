import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    console.log("Contact form submission received:", { name, email, subject });

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to admin
    const emailResponse = await resend.emails.send({
      from: "CAPSTORE Contact <onboarding@resend.dev>",
      to: ["admin@capstore.com"], // Replace with your admin email
      subject: `Contact Form: ${subject || 'New Message'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
        <hr>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr>
        <p><em>This message was sent through the CAPSTORE contact form.</em></p>
      `,
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: "CAPSTORE <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for contacting CAPSTORE",
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        
        <h3>Your message:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        
        <p>If you have any urgent questions, you can also reach us at:</p>
        <ul>
          <li>Email: support@capstore.com</li>
          <li>Phone: +1 (555) 123-4567</li>
        </ul>
        
        <p>Best regards,<br>The CAPSTORE Team</p>
      `,
    });

    console.log("Contact emails sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);