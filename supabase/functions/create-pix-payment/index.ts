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
    const { name, email, phone, steamId, amount, description, discountCoupon } = await req.json();

    console.log('Creating PIX payment:', { name, email, phone, steamId, amount, discountCoupon });

    // Get Mercado Pago token from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: secretData, error: secretError } = await supabaseClient
      .from('app_secrets')
      .select('value')
      .eq('key', 'MERCADO_PAGO_ACCESS_TOKEN')
      .single();
    
    if (secretError || !secretData?.value) {
      throw new Error('Token do Mercado Pago não configurado');
    }
    
    const accessToken = secretData.value;
    
    if (!accessToken) {
      throw new Error('Mercado Pago Access Token não configurado');
    }

    // Verificar e aplicar cupom de desconto se fornecido
    let finalAmount = parseFloat(amount);
    let appliedDiscount = 0;
    let couponCode = null;
    let discountValue = 0;
    let streamerSteamId = null;
    
    if (discountCoupon) {
      // Buscar cupom de streamer primeiro
      const { data: streamerCouponData, error: streamerCouponError } = await supabaseClient
        .from('streamer_coupons')
        .select('codigo, porcentagem, valor, streamer_id, streamers(steam_id)')
        .eq('codigo', discountCoupon.toUpperCase())
        .gte('data_fim', new Date().toISOString())
        .lte('data_inicio', new Date().toISOString())
        .maybeSingle();
      
      if (streamerCouponData) {
        // Aplicar desconto do cupom de streamer
        if (streamerCouponData.porcentagem) {
          appliedDiscount = streamerCouponData.porcentagem;
          discountValue = parseFloat(amount) * (appliedDiscount / 100);
          finalAmount = finalAmount * (1 - appliedDiscount / 100);
        } else if (streamerCouponData.valor) {
          discountValue = streamerCouponData.valor;
          finalAmount = Math.max(0, finalAmount - discountValue);
          appliedDiscount = (discountValue / parseFloat(amount)) * 100;
        }
        couponCode = streamerCouponData.codigo;
        streamerSteamId = streamerCouponData.streamers?.steam_id || null;
        console.log(`Cupom de streamer aplicado: ${discountCoupon} - Desconto: ${appliedDiscount}% - Valor: ${discountValue} - Streamer Steam ID: ${streamerSteamId}`);
      } else {
        // Se não encontrou cupom de streamer, buscar cupom global
        const { data: couponData, error: couponError } = await supabaseClient
          .from('discount_coupons')
          .select('discount_percentage, active, code')
          .eq('code', discountCoupon.toUpperCase())
          .eq('active', true)
          .maybeSingle();
        
        if (couponData) {
          appliedDiscount = couponData.discount_percentage;
          couponCode = couponData.code;
          discountValue = parseFloat(amount) * (appliedDiscount / 100);
          finalAmount = finalAmount * (1 - appliedDiscount / 100);
          console.log(`Cupom global aplicado: ${discountCoupon} - Desconto: ${appliedDiscount}% - Valor: ${discountValue}`);
        } else {
          console.log('Cupom inválido ou inativo:', discountCoupon);
        }
      }
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: finalAmount,
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
        coupon_code: couponCode || '',
        coupon_percentage: appliedDiscount || 0,
        coupon_discount_value: discountValue || 0,
        streamer_steam_id: streamerSteamId || '',
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
      const { error: dbError } = await supabaseClient
        .from('donations')
        .insert({
          payment_id: data.id.toString(),
          name,
          email,
          phone,
          steam_id: steamId,
          amount: finalAmount,
          description: description || 'Doação Setor 7 Hardcore PVE',
          status: data.status,
          qr_code: pixData.qr_code,
          qr_code_base64: pixData.qr_code_base64,
          ticket_url: pixData.ticket_url,
          discount_coupon: discountCoupon || null,
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