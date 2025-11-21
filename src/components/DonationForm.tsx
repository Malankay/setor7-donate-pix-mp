import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QrCode, Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoSetor7 from "@/assets/logoSetor7.jpg";

const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    steamId: "",
    amount: "",
    discountCoupon: "",
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
  const [couponError, setCouponError] = useState<string>("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [vipPackages, setVipPackages] = useState<Array<{ id: string; nome: string; valor: number }>>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("moedas");

  useEffect(() => {
    const fetchVipPackages = async () => {
      try {
        const { data, error } = await supabase
          .from("vip_packages")
          .select("id, nome, valor")
          .eq("active", true)
          .order("valor", { ascending: true });
        
        if (error) throw error;
        setVipPackages(data || []);
      } catch (error: any) {
        console.error("Erro ao carregar pacotes VIP:", error.message);
      }
    };

    fetchVipPackages();
  }, []);

  const handlePackageChange = (value: string) => {
    setSelectedPackage(value);
    
    if (value === "moedas") {
      // Limpar o valor quando "Moedas" for selecionado
      setFormData((prev) => ({ ...prev, amount: "" }));
    } else {
      // Preencher com o valor do pacote VIP selecionado
      const selectedVip = vipPackages.find((vip) => vip.id === value);
      if (selectedVip) {
        const formattedValue = selectedVip.valor.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setFormData((prev) => ({ ...prev, amount: formattedValue }));
      }
    }
  };

  const getPackageName = () => {
    if (selectedPackage === "moedas") {
      return "Moedas";
    }
    const selectedVip = vipPackages.find((vip) => vip.id === selectedPackage);
    return selectedVip?.nome || "Moedas";
  };

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
    } else if (name === "discountCoupon") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setCouponError("");
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateCoupon = async (couponCode: string): Promise<boolean> => {
    if (!couponCode.trim()) {
      return true; // Cupom vazio é válido (não obrigatório)
    }

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      // Buscar valor mínimo para cupom
      const { data: secretData } = await supabase
        .from("app_secrets")
        .select("value")
        .eq("key", "VALOR_MINIMO_CUPOM")
        .maybeSingle();

      const valorMinimoCupom = secretData?.value ? parseFloat(secretData.value) : 0;

      // Verificar se o valor da doação atende ao mínimo
      const amountValue = parseFloat(formData.amount.replace(/\./g, "").replace(",", "."));
      if (valorMinimoCupom > 0 && amountValue < valorMinimoCupom) {
        const valorMinimoFormatado = valorMinimoCupom.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setCouponError(`Valor mínimo para usar cupom: R$ ${valorMinimoFormatado}`);
        setIsValidatingCoupon(false);
        return false;
      }

      const { data: coupon, error } = await supabase
        .from("streamer_coupons")
        .select("*")
        .eq("codigo", couponCode)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        setCouponError("Cupom não encontrado");
        setIsValidatingCoupon(false);
        return false;
      }

      // Verificar se está dentro da validade
      const now = new Date();
      const dataInicio = new Date(coupon.data_inicio);
      const dataFim = new Date(coupon.data_fim);

      if (now < dataInicio || now > dataFim) {
        const dataFimFormatada = dataFim.toLocaleDateString("pt-BR");
        setCouponError(`Cupom fora da validade: ${dataFimFormatada}`);
        setIsValidatingCoupon(false);
        return false;
      }

      setIsValidatingCoupon(false);
      return true;
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      setCouponError("Erro ao validar cupom");
      setIsValidatingCoupon(false);
      return false;
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

    // Validar cupom se foi preenchido
    if (formData.discountCoupon) {
      const couponValid = await validateCoupon(formData.discountCoupon);
      if (!couponValid) {
        toast.error(couponError || "Cupom inválido");
        return;
      }
    }

    setIsLoading(true);

    try {
      const amountValue = formData.amount.replace(/\./g, "").replace(",", ".");
      const packageName = getPackageName();

      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          steamId: formData.steamId,
          amount: amountValue,
          description: `Doação Setor 7 - ${packageName} - ${formData.name} (${formData.steamId})`,
          discountCoupon: formData.discountCoupon,
          packageType: packageName,
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
                src={logoSetor7}
                alt="Setor 7 Logo"
                className="w-20 h-20 rounded-full logo-glow animate-pulse"
              />
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold">
                  Pagamento aprovado.
                </p>
                <p className="text-base text-muted-foreground px-4">
                  Muito obrigado por apoiar o Setor 7 Hardcode PVE, agradecemos sua presença em nosso servidor e bom jogo
                </p>
              </div>
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
            <Label htmlFor="package">Tipo de Pacote *</Label>
            <Select value={selectedPackage} onValueChange={handlePackageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pacote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moedas">Moedas</SelectItem>
                {vipPackages.map((vip) => (
                  <SelectItem key={vip.id} value={vip.id}>
                    {vip.nome} - R$ {vip.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={selectedPackage !== "moedas"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountCoupon">Cupom</Label>
            <Input
              id="discountCoupon"
              name="discountCoupon"
              type="text"
              value={formData.discountCoupon}
              onChange={handleChange}
              placeholder="Digite seu cupom"
              className={couponError ? "border-red-500" : ""}
            />
            {couponError && (
              <p className="text-sm text-red-500">{couponError}</p>
            )}
          </div>

          <Button type="submit" className="w-full donate-button" disabled={isLoading || isValidatingCoupon}>
            {isLoading ? "Gerando QR Code..." : isValidatingCoupon ? "Validando cupom..." : "Doar via PIX"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DonationForm;
