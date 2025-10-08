import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, steamId, amount, description } = await req.json();

    console.log('Creating PIX payment:', { name, email, phone, steamId, amount });

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      throw new Error('Mercado Pago Access Token não configurado');
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description || 'Doação Setor 7 Hardcore PVE',
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
        identification: {
          type: 'other',
          number: steamId || '',
        },
      },
      additional_info: {
        payer: {
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
          phone: {
            area_code: phone ? phone.replace(/\D/g, '').substring(0, 2) : '',
            number: phone ? phone.replace(/\D/g, '').substring(2) : '',
          },
          registration_date: new Date().toISOString(),
        },
        items: [
          {
            id: 'donation',
            title: description || 'Doação Setor 7 Hardcore PVE',
            description: `Doação de ${name} - Steam ID: ${steamId}`,
            quantity: 1,
            unit_price: parseFloat(amount),
          },
        ],
      },
      metadata: {
        steam_id: steamId || '',
        phone: phone || '',
      },
    };

    console.log('Sending payment request to Mercado Pago');

    // Generate a unique idempotency key for this request
    const idempotencyKey = `${Date.now()}-${crypto.randomUUID()}`;

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    console.log('Mercado Pago response status:', response.status);

    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      throw new Error(data.message || 'Erro ao criar pagamento PIX');
    }

    // Retornar dados do QR Code
    const pixData = {
      qr_code: data.point_of_interaction?.transaction_data?.qr_code || '',
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      ticket_url: data.point_of_interaction?.transaction_data?.ticket_url || '',
      payment_id: data.id,
      status: data.status,
    };

    console.log('PIX payment created successfully:', pixData.payment_id);

    // Save donation to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: dbError } = await supabase
        .from('donations')
        .insert({
          payment_id: data.id.toString(),
          name,
          email,
          phone,
          steam_id: steamId,
          amount: parseFloat(amount),
          description: description || 'Doação Setor 7 Hardcore PVE',
          status: data.status,
          qr_code: pixData.qr_code,
          qr_code_base64: pixData.qr_code_base64,
          ticket_url: pixData.ticket_url,
        });

      if (dbError) {
        console.error('Error saving donation to database:', dbError);
      } else {
        console.log('Donation saved to database successfully');
      }
    } catch (dbError) {
      console.error('Failed to save donation:', dbError);
    }

    return new Response(
      JSON.stringify(pixData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in create-pix-payment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar pagamento';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});