import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode, Skull } from "lucide-react";

const DonationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    steamId: "",
    amount: "",
  });
  const [showQrCode, setShowQrCode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (parseFloat(formData.amount) <= 0) {
      toast.error("Valor deve ser maior que zero!");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Simulate PIX generation
      setShowQrCode(true);
      toast.success("QR Code PIX gerado! Escaneie para doar.");
    }
  };

  const handleCopyPixCode = () => {
    const pixCode = "00020126580014BR.GOV.BCB.PIX0136setor7hardcore@example.com"; // Mock PIX code
    navigator.clipboard.writeText(pixCode);
    toast.success("Código PIX copiado!");
  };

  if (showQrCode) {
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
            <div className="bg-white p-6 rounded-lg">
              <QrCode className="w-48 h-48 text-black" strokeWidth={1} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-accent">
                R$ {parseFloat(formData.amount).toFixed(2)}
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
              Obrigado pelo apoio, {formData.name}! 🎮
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
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <Button type="submit" className="w-full donate-button">
            Doar via PIX
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DonationForm;
