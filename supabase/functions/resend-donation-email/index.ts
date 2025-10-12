import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DonationEmailSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  steamId: z.string().max(100).optional(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  qrCodeBase64: z.string(),
  qrCode: z.string(),
  createdAt: z.string()
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Resend API key from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: secretData, error: secretError } = await supabaseClient
      .from('app_secrets')
      .select('value')
      .eq('key', 'RESEND_API_KEY')
      .single();
    
    if (secretError || !secretData?.value) {
      throw new Error('API key do Resend não configurado');
    }
    
    const RESEND_API_KEY = secretData.value;
    
    const requestBody = await req.json();
    
    // Validate input
    const validationResult = DonationEmailSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const { 
      name, 
      email, 
      phone, 
      steamId, 
      amount, 
      description, 
      qrCodeBase64, 
      qrCode,
      createdAt 
    } = validationResult.data;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Setor 7 <onboarding@resend.dev>",
        to: [email],
        subject: "Detalhes da sua doação - Setor 7",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              color: #1a1a1a;
              margin-bottom: 10px;
              font-size: 24px;
            }
            .info-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 6px;
            }
            .info-row {
              margin: 10px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #666;
              font-size: 14px;
            }
            .value {
              color: #1a1a1a;
              font-size: 14px;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #10b981;
            }
            .qr-section {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 8px;
            }
            .qr-code {
              max-width: 250px;
              height: auto;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              margin: 15px auto;
            }
            .pix-code {
              background-color: #fff;
              padding: 15px;
              border: 1px dashed #ccc;
              border-radius: 6px;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              margin-top: 15px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎮 Detalhes da sua doação</h1>
            <p>Olá ${name},</p>
            <p>Aqui estão os detalhes da sua doação:</p>
            
            <div class="info-section">
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${name}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${email}</span>
              </div>
              ${phone ? `
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${phone}</span>
              </div>
              ` : ''}
              ${steamId ? `
              <div class="info-row">
                <span class="label">Steam ID:</span>
                <span class="value">${steamId}</span>
              </div>
              ` : ''}
              ${description ? `
              <div class="info-row">
                <span class="label">Descrição:</span>
                <span class="value">${description}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Data:</span>
                <span class="value">${formatDate(createdAt)}</span>
              </div>
              <div class="info-row">
                <span class="label">Valor:</span>
                <span class="amount">${formatCurrency(amount)}</span>
              </div>
            </div>

            <div class="qr-section">
              <h2 style="margin-top: 0; color: #1a1a1a;">QR Code PIX</h2>
              <p style="color: #666; font-size: 14px;">Escaneie o QR Code abaixo ou copie o código PIX para realizar o pagamento:</p>
              <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code PIX" class="qr-code" />
              
              <div class="pix-code">
                <strong>Código PIX:</strong><br/>
                ${qrCode}
              </div>
            </div>

            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>Se tiver dúvidas, entre em contato conosco.</p>
              <p style="margin-top: 15px;">© ${new Date().getFullYear()} Setor 7. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in resend-donation-email function:", error);
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
