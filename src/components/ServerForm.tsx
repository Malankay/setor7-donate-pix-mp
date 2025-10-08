import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Mod {
  nome_mod: string;
  discord: string;
  loja_steam: string;
  valor_mensal: string;
}

interface ServerFormProps {
  onSuccess: () => void;
}

export const ServerForm = ({ onSuccess }: ServerFormProps) => {
  const [nome, setNome] = useState("");
  const [host, setHost] = useState("");
  const [valorMensal, setValorMensal] = useState("");
  const [mods, setMods] = useState<Mod[]>([
    { nome_mod: "", discord: "", loja_steam: "", valor_mensal: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addMod = () => {
    setMods([...mods, { nome_mod: "", discord: "", loja_steam: "", valor_mensal: "" }]);
  };

  const removeMod = (index: number) => {
    setMods(mods.filter((_, i) => i !== index));
  };

  const updateMod = (index: number, field: keyof Mod, value: string) => {
    const newMods = [...mods];
    newMods[index][field] = value;
    setMods(newMods);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert servidor
      const { data: servidor, error: servidorError } = await supabase
        .from("servidores")
        .insert({
          nome,
          host,
          valor_mensal: parseFloat(valorMensal)
        })
        .select()
        .single();

      if (servidorError) throw servidorError;

      // Insert mods
      const modsToInsert = mods
        .filter(mod => mod.nome_mod.trim() !== "")
        .map(mod => ({
          servidor_id: servidor.id,
          nome_mod: mod.nome_mod,
          discord: mod.discord || null,
          loja_steam: mod.loja_steam || null,
          valor_mensal: parseFloat(mod.valor_mensal)
        }));

      if (modsToInsert.length > 0) {
        const { error: modsError } = await supabase
          .from("servidores_mods")
          .insert(modsToInsert);

        if (modsError) throw modsError;
      }

      toast({
        title: "Servidor cadastrado",
        description: "O servidor foi cadastrado com sucesso.",
      });

      // Reset form
      setNome("");
      setHost("");
      setValorMensal("");
      setMods([{ nome_mod: "", discord: "", loja_steam: "", valor_mensal: "" }]);
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar servidor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Servidor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Servidor</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Digite o nome do servidor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              placeholder="Digite o host do servidor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMensal">Valor Mensal</Label>
            <Input
              id="valorMensal"
              type="number"
              step="0.01"
              value={valorMensal}
              onChange={(e) => setValorMensal(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>MODs</CardTitle>
            <Button
              type="button"
              onClick={addMod}
              className="h-8 w-8 p-0 bg-red-900 hover:bg-red-800 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mods.map((mod, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">MOD {index + 1}</h4>
                  {mods.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMod(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`mod-nome-${index}`}>Nome do MOD</Label>
                  <Input
                    id={`mod-nome-${index}`}
                    value={mod.nome_mod}
                    onChange={(e) => updateMod(index, "nome_mod", e.target.value)}
                    required
                    placeholder="Digite o nome do MOD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`mod-discord-${index}`}>Discord</Label>
                  <Input
                    id={`mod-discord-${index}`}
                    value={mod.discord}
                    onChange={(e) => updateMod(index, "discord", e.target.value)}
                    placeholder="Link do Discord"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`mod-loja-${index}`}>Loja Steam</Label>
                  <Input
                    id={`mod-loja-${index}`}
                    value={mod.loja_steam}
                    onChange={(e) => updateMod(index, "loja_steam", e.target.value)}
                    placeholder="Link da Loja Steam"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`mod-valor-${index}`}>Valor Mensal</Label>
                  <Input
                    id={`mod-valor-${index}`}
                    type="number"
                    step="0.01"
                    value={mod.valor_mensal}
                    onChange={(e) => updateMod(index, "valor_mensal", e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Cadastrando..." : "Cadastrar Servidor"}
      </Button>
    </form>
  );
};
