import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";

interface VipFormProps {
  vip?: {
    id: string;
    nome: string;
    descricao: string | null;
    valor: number;
  };
  onSubmit: (data: {
    nome: string;
    descricao: string;
    valor: number;
  }) => void;
  onCancel: () => void;
}

export function VipForm({ vip, onSubmit, onCancel }: VipFormProps) {
  const [nome, setNome] = useState(vip?.nome || "");
  const [descricao, setDescricao] = useState(vip?.descricao || "");
  const [valor, setValor] = useState(vip?.valor?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nome,
      descricao,
      valor: parseFloat(valor),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do Pacote VIP</Label>
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
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="valor">Valor (R$)</Label>
        <NumericFormat
          id="valor"
          value={valor}
          onValueChange={(values) => setValor(values.value)}
          thousandSeparator="."
          decimalSeparator=","
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          allowNegative={false}
          customInput={Input}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
