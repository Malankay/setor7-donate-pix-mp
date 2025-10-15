import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamerCampaign {
  id?: string;
  streamer_id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  valor: number;
}

interface StreamerCampaignFormProps {
  streamerId: string;
  campaign?: StreamerCampaign;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StreamerCampaignForm({ streamerId, campaign, onSuccess, onCancel }: StreamerCampaignFormProps) {
  const [nome, setNome] = useState(campaign?.nome || "");
  const [descricao, setDescricao] = useState(campaign?.descricao || "");
  const [dataInicio, setDataInicio] = useState(() => {
    if (campaign?.data_inicio) {
      const date = new Date(campaign.data_inicio);
      return date.toLocaleDateString("pt-BR");
    }
    return "";
  });
  const [dataFim, setDataFim] = useState(() => {
    if (campaign?.data_fim) {
      const date = new Date(campaign.data_fim);
      return date.toLocaleDateString("pt-BR");
    }
    return "";
  });
  const [valor, setValor] = useState(() => {
    if (campaign?.valor) {
      return campaign.valor.toLocaleString("pt-BR", {
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

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const parseDateToBR = (dateStr: string): Date | null => {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    
    return date;
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValor(formatted);
  };

  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setDataInicio(formatted);
  };

  const handleDataFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setDataFim(formatted);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !dataInicio || !dataFim || !valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dataInicioDate = parseDateToBR(dataInicio);
    const dataFimDate = parseDateToBR(dataFim);

    if (!dataInicioDate || !dataFimDate) {
      toast.error("Data inválida. Use o formato dd/mm/aaaa");
      return;
    }

    if (dataFimDate <= dataInicioDate) {
      toast.error("A data de fim deve ser posterior à data de início");
      return;
    }

    const valorNum = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }

    setIsSubmitting(true);

    try {
      const campaignData = {
        streamer_id: streamerId,
        nome,
        descricao: descricao || null,
        data_inicio: dataInicioDate.toISOString(),
        data_fim: dataFimDate.toISOString(),
        valor: valorNum,
      };

      if (campaign?.id) {
        const { error } = await supabase
          .from("streamer_campanhas")
          .update(campaignData)
          .eq("id", campaign.id);

        if (error) throw error;
        toast.success("Campanha atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("streamer_campanhas")
          .insert(campaignData);

        if (error) throw error;
        toast.success("Campanha criada com sucesso!");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar campanha:", error);
      toast.error("Erro ao salvar campanha: " + error.message);
    } finally {
      setIsSubmitting(false);
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
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição da campanha (opcional)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="dataInicio">Data de Início (dd/mm/aaaa) *</Label>
        <Input
          id="dataInicio"
          type="text"
          value={dataInicio}
          onChange={handleDataInicioChange}
          required
          placeholder="dd/mm/aaaa"
          maxLength={10}
        />
      </div>

      <div>
        <Label htmlFor="dataFim">Data de Fim (dd/mm/aaaa) *</Label>
        <Input
          id="dataFim"
          type="text"
          value={dataFim}
          onChange={handleDataFimChange}
          required
          placeholder="dd/mm/aaaa"
          maxLength={10}
        />
      </div>

      <div>
        <Label htmlFor="valor">Valor (R$) *</Label>
        <Input
          id="valor"
          type="text"
          value={valor}
          onChange={handleValorChange}
          required
          placeholder="0,00"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : campaign ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
