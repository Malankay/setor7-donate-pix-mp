import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CancelRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID é obrigatório'),
  donationId: z.string().uuid('Donation ID inválido')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validationResult = CancelRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    const { orderId, donationId } = validationResult.data;

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
      throw new Error('Token de acesso do Mercado Pago não configurado');
    }

    console.log(`Cancelando pedido: ${orderId}`);

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API do Mercado Pago:', response.status, errorText);
      throw new Error(`Erro ao cancelar pedido: ${response.status}`);
    }

    const orderData = await response.json();
    console.log('Pedido cancelado com sucesso');

    // Atualizar status no banco de dados usando o mesmo cliente
    const { error: updateError } = await supabaseClient
      .from('donations')
      .update({ status: 'cancelled' })
      .eq('id', donationId);

    if (updateError) {
      console.error('Erro ao atualizar status no banco:', updateError);
      throw new Error('Erro ao atualizar status da doação');
    }

    console.log('Status atualizado para: cancelled');

    return new Response(
      JSON.stringify({ success: true, status: 'cancelled' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na função cancel-mercadopago-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
