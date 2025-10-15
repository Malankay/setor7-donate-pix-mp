import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamerCoupon {
  id?: string;
  streamer_id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  valor: number | null;
  porcentagem: number | null;
}

interface StreamerCouponFormProps {
  streamerId: string;
  coupon?: StreamerCoupon;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StreamerCouponForm({ streamerId, coupon, onSuccess, onCancel }: StreamerCouponFormProps) {
  const [nome, setNome] = useState(coupon?.nome || "");
  const [codigo, setCodigo] = useState(coupon?.codigo || "");
  const [descricao, setDescricao] = useState(coupon?.descricao || "");
  const [dataInicio, setDataInicio] = useState(coupon?.data_inicio?.split('T')[0] || "");
  const [dataFim, setDataFim] = useState(coupon?.data_fim?.split('T')[0] || "");
  const [valor, setValor] = useState(() => {
    if (coupon?.valor) {
      return coupon.valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "";
  });
  const [porcentagem, setPorcentagem] = useState(() => {
    if (coupon?.porcentagem) {
      return coupon.porcentagem.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !codigo || !dataInicio || !dataFim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!valor && !porcentagem) {
      toast.error("Preencha o valor ou a porcentagem");
      return;
    }

    if (valor && porcentagem) {
      toast.error("Preencha apenas o valor OU a porcentagem, não ambos");
      return;
    }

    setIsSubmitting(true);

    try {
      const couponData = {
        streamer_id: streamerId,
        nome,
        codigo,
        descricao: descricao || null,
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: new Date(dataFim).toISOString(),
        valor: valor ? parseFloat(valor.replace(/\./g, "").replace(",", ".")) : null,
        porcentagem: porcentagem ? parseFloat(porcentagem.replace(/\./g, "").replace(",", ".")) : null,
      };

      if (coupon?.id) {
        const { error } = await supabase
          .from("streamer_coupons")
          .update(couponData)
          .eq("id", coupon.id);

        if (error) throw error;
        toast.success("Cupom atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("streamer_coupons")
          .insert(couponData);

        if (error) throw error;
        toast.success("Cupom criado com sucesso!");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar cupom:", error);
      toast.error("Erro ao salvar cupom: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValorChange = (value: string) => {
    const formatted = formatCurrency(value);
    setValor(formatted);
    if (formatted) {
      setPorcentagem("");
    }
  };

  const handlePorcentagemChange = (value: string) => {
    const formatted = formatPercentage(value);
    setPorcentagem(formatted);
    if (formatted) {
      setValor("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="codigo">Código *</Label>
        <Input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição do cupom (opcional)"
        />
      </div>

      <div>
        <Label htmlFor="dataInicio">Data de Início *</Label>
        <Input
          id="dataInicio"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="dataFim">Data de Fim *</Label>
        <Input
          id="dataFim"
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="valor">Valor (R$)</Label>
        <Input
          id="valor"
          type="text"
          value={valor}
          onChange={(e) => handleValorChange(e.target.value)}
          disabled={!!porcentagem}
          placeholder="Deixe vazio se usar porcentagem"
        />
      </div>

      <div>
        <Label htmlFor="porcentagem">Porcentagem (%)</Label>
        <Input
          id="porcentagem"
          type="text"
          value={porcentagem}
          onChange={(e) => handlePorcentagemChange(e.target.value)}
          disabled={!!valor}
          placeholder="Deixe vazio se usar valor"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : coupon ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
