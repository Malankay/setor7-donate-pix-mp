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
  const [dataInicio, setDataInicio] = useState(campaign?.data_inicio?.split('T')[0] || "");
  const [dataFim, setDataFim] = useState(campaign?.data_fim?.split('T')[0] || "");
  const [valor, setValor] = useState(campaign?.valor?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !dataInicio || !dataFim || !valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const valorNum = parseFloat(valor);
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
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: new Date(dataFim).toISOString(),
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
        <Label htmlFor="valor">Valor (R$) *</Label>
        <Input
          id="valor"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          placeholder="0.00"
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
