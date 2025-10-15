import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [dataInicio, setDataInicio] = useState<Date | undefined>(() => {
    if (campaign?.data_inicio) {
      return new Date(campaign.data_inicio);
    }
    return undefined;
  });
  const [dataFim, setDataFim] = useState<Date | undefined>(() => {
    if (campaign?.data_fim) {
      return new Date(campaign.data_fim);
    }
    return undefined;
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

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValor(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !dataInicio || !dataFim || !valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (dataFim <= dataInicio) {
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
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
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
        <Label>Data de Início *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dataInicio && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataInicio ? dataInicio.toLocaleDateString("pt-BR") : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dataInicio}
              onSelect={setDataInicio}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Data de Fim *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dataFim && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataFim ? dataFim.toLocaleDateString("pt-BR") : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dataFim}
              onSelect={setDataFim}
              initialFocus
              disabled={(date) => dataInicio ? date < dataInicio : false}
            />
          </PopoverContent>
        </Popover>
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
