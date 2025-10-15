import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    steamId: "",
    amount: "",
  });
  const [showQrCode, setShowQrCode] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
    donation_id?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);

  const formatCurrency = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "");
    
    // Converte para centavos
    const amount = parseFloat(numbers) / 100;
    
    // Retorna formatado
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "amount") {
      const formatted = formatCurrency(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === "phone") {
      const formatted = formatPhone(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.steamId || !formData.amount) {
      toast.error("Preencha todos os campos obrigatórios!");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("E-mail inválido!");
      return false;
    }

    const amountValue = parseFloat(formData.amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Valor deve ser maior que zero!");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const amountValue = formData.amount.replace(/\./g, "").replace(",", ".");

      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          steamId: formData.steamId,
          amount: amountValue,
          description: `Doação Setor 7 - ${formData.name} (${formData.steamId})`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar pagamento PIX');
      }

      setPixData(data);
      setShowQrCode(true);
      setPaymentApproved(false);
      toast.success("QR Code PIX gerado! Escaneie para doar.");
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar QR Code PIX');
    } finally {
      setIsLoading(false);
    }
  };

  // Polling para verificar o status do pagamento
  useEffect(() => {
    if (!showQrCode || !pixData?.payment_id || paymentApproved) return;

    const checkPaymentStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mercadopago-order', {
          body: {
            orderId: pixData.payment_id,
            donationId: pixData.donation_id,
          },
        });

        if (error) {
          console.error('Erro ao verificar status:', error);
          return;
        }

        if (data?.status === 'approved') {
          setPaymentApproved(true);
          toast.success("🎉 Pagamento aprovado! Obrigado pela sua doação!", {
            duration: 10000,
          });
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      }
    };

    const intervalId = setInterval(checkPaymentStatus, 30000);

    // Verificação inicial imediata
    checkPaymentStatus();

    return () => clearInterval(intervalId);
  }, [showQrCode, pixData, paymentApproved]);

  const handleCopyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success("Código PIX copiado!");
    }
  };

  if (showQrCode) {
    if (paymentApproved) {
      return (
        <Card className="w-full max-w-md donation-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <img 
                src="/src/assets/logoSetor7.jpg"
                alt="Setor 7 Logo"
                className="w-48 h-48 object-contain rounded-lg"
              />
              <p className="text-2xl font-bold text-center">
                Pagamento aprovado.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-md donation-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-accent" />
            QR Code PIX
          </CardTitle>
          <CardDescription>Escaneie ou copie o código para doar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {pixData?.qr_code_base64 ? (
              <img 
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-64 h-64 rounded-lg"
              />
            ) : (
              <div className="bg-white p-6 rounded-lg">
                <QrCode className="w-48 h-48 text-black" strokeWidth={1} />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-accent">
                R$ {formData.amount}
              </p>
              <p className="text-sm text-muted-foreground">Valor da doação</p>
            </div>
            <Button 
              onClick={handleCopyPixCode} 
              variant="outline" 
              className="w-full"
            >
              Copiar Código PIX
            </Button>
            <Button 
              onClick={() => setShowQrCode(false)} 
              variant="secondary" 
              className="w-full"
            >
              Voltar
            </Button>
          </div>
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Aguardando pagamento... Obrigado pelo apoio, {formData.name}! 🎮
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md donation-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Skull className="w-6 h-6 text-accent" />
          Faça sua Doação
        </CardTitle>
        <CardDescription>Apoie o Setor 7 Hardcore PVE</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (com DDD) *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steamId">SteamID *</Label>
            <Input
              id="steamId"
              name="steamId"
              type="text"
              value={formData.steamId}
              onChange={handleChange}
              placeholder="STEAM_0:0:123456"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor da Doação (R$) *</Label>
            <Input
              id="amount"
              name="amount"
              type="text"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0,00"
              required
            />
          </div>

          <Button type="submit" className="w-full donate-button" disabled={isLoading}>
            {isLoading ? "Gerando QR Code..." : "Doar via PIX"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DonationForm;
