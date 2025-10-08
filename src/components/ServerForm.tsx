import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NumericFormat } from "react-number-format";

interface Mod {
  nome_mod: string;
  discord: string;
  loja_steam: string;
  valor_mensal: string;
}

interface ServerFormData {
  nome: string;
  host: string;
  valor_mensal: string;
  mods: Mod[];
}

interface Servidor {
  id: string;
  nome: string;
  host: string;
  valor_mensal: number;
}

export const ServerForm = ({ servidor, onSuccess }: { servidor?: Servidor | null; onSuccess: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ServerFormData>({
    defaultValues: {
      nome: "",
      host: "",
      valor_mensal: "0",
      mods: [{ nome_mod: "", discord: "", loja_steam: "", valor_mensal: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "mods",
  });

  useEffect(() => {
    const loadServidorData = async () => {
      if (servidor) {
        // Buscar MODs do servidor
        const { data: mods, error } = await supabase
          .from('servidores_mods')
          .select('*')
          .eq('servidor_id', servidor.id);

        if (error) {
          console.error('Erro ao carregar MODs:', error);
          toast({
            title: "Erro ao carregar MODs",
            description: error.message,
            variant: "destructive",
          });
        }

        // Resetar formulário com dados do servidor e MODs
        reset({
          nome: servidor.nome,
          host: servidor.host,
          valor_mensal: servidor.valor_mensal.toString(),
          mods: mods && mods.length > 0 
            ? mods.map(mod => ({
                nome_mod: mod.nome_mod,
                discord: mod.discord || "",
                loja_steam: mod.loja_steam || "",
                valor_mensal: mod.valor_mensal.toString(),
              }))
            : [{ nome_mod: "", discord: "", loja_steam: "", valor_mensal: "0" }],
        });
      } else {
        // Resetar para valores padrão ao criar novo servidor
        reset({
          nome: "",
          host: "",
          valor_mensal: "0",
          mods: [{ nome_mod: "", discord: "", loja_steam: "", valor_mensal: "0" }],
        });
      }
    };

    loadServidorData();
  }, [servidor, reset, toast]);

  const onSubmit = async (data: ServerFormData) => {
    setIsSubmitting(true);
    try {
      // Validar valor_mensal
      const valorMensal = parseFloat(data.valor_mensal);
      if (isNaN(valorMensal) || valorMensal < 0) {
        toast({
          title: "Erro de validação",
          description: "O valor mensal do servidor deve ser maior ou igual a zero.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let servidorId: string;

      if (servidor) {
        // Update servidor
        const { error: serverError } = await supabase
          .from("servidores")
          .update({
            nome: data.nome,
            host: data.host,
            valor_mensal: valorMensal,
          })
          .eq("id", servidor.id);

        if (serverError) throw serverError;
        servidorId = servidor.id;

        // Delete existing mods
        await supabase
          .from("servidores_mods")
          .delete()
          .eq("servidor_id", servidor.id);
      } else {
        // Insert servidor
        const { data: novoServidor, error: serverError } = await supabase
          .from("servidores")
          .insert({
            nome: data.nome,
            host: data.host,
            valor_mensal: valorMensal,
          })
          .select()
          .single();

        if (serverError) throw serverError;
        servidorId = novoServidor.id;
      }

      // Insert mods
      if (data.mods.length > 0) {
        // Validar valores dos mods
        for (let i = 0; i < data.mods.length; i++) {
          const valorModMensal = parseFloat(data.mods[i].valor_mensal);
          if (isNaN(valorModMensal) || valorModMensal < 0) {
            toast({
              title: "Erro de validação",
              description: `O valor mensal do MOD ${i + 1} deve ser maior ou igual a zero.`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }

        const modsToInsert = data.mods.map((mod) => ({
          servidor_id: servidorId,
          nome_mod: mod.nome_mod,
          discord: mod.discord || null,
          loja_steam: mod.loja_steam || null,
          valor_mensal: parseFloat(mod.valor_mensal),
        }));

        const { error: modsError } = await supabase
          .from("servidores_mods")
          .insert(modsToInsert);

        if (modsError) throw modsError;
      }

      toast({
        title: servidor ? "Servidor atualizado" : "Servidor cadastrado",
        description: servidor ? "O servidor foi atualizado com sucesso!" : "O servidor foi cadastrado com sucesso!",
      });

      reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar servidor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="backdrop-blur-sm bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Informações do Servidor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Servidor</Label>
            <Input
              id="nome"
              {...register("nome", { required: "Nome é obrigatório" })}
              placeholder="Digite o nome do servidor"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              {...register("host", { required: "Host é obrigatório" })}
              placeholder="Digite o host do servidor"
            />
            {errors.host && (
              <p className="text-sm text-destructive">{errors.host.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
            <Controller
              name="valor_mensal"
              control={control}
              rules={{ 
                required: "Valor mensal é obrigatório",
                validate: (value) => {
                  const num = parseFloat(value);
                  if (isNaN(num) || num < 0) {
                    return "Valor deve ser maior ou igual a zero";
                  }
                  return true;
                }
              }}
              render={({ field }) => (
                <NumericFormat
                  value={field.value || "0"}
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale
                  prefix="R$ "
                  placeholder="R$ 0,00"
                  onValueChange={(values) => {
                    field.onChange(values.value || "0");
                  }}
                />
              )}
            />
            {errors.valor_mensal && (
              <p className="text-sm text-destructive">{errors.valor_mensal.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>MODs</CardTitle>
          <Button
            type="button"
            onClick={() => append({ nome_mod: "", discord: "", loja_steam: "", valor_mensal: "0" })}
            className="h-8 w-8 p-0 bg-red-900 hover:bg-red-800 text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-border/50 rounded-lg space-y-4 relative">
              <Button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-900 hover:bg-red-800 text-white"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <Label htmlFor={`mods.${index}.nome_mod`}>Nome do Mod</Label>
                <Input
                  {...register(`mods.${index}.nome_mod` as const, { required: "Nome do mod é obrigatório" })}
                  placeholder="Digite o nome do mod"
                />
                {errors.mods?.[index]?.nome_mod && (
                  <p className="text-sm text-destructive">{errors.mods[index]?.nome_mod?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`mods.${index}.discord`}>Discord</Label>
                <Input
                  {...register(`mods.${index}.discord` as const)}
                  placeholder="Discord do mod (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`mods.${index}.loja_steam`}>Loja Steam</Label>
                <Input
                  {...register(`mods.${index}.loja_steam` as const)}
                  placeholder="URL da loja Steam (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`mods.${index}.valor_mensal`}>Valor Mensal (R$)</Label>
                <Controller
                  name={`mods.${index}.valor_mensal` as const}
                  control={control}
                  rules={{ 
                    required: "Valor mensal é obrigatório",
                    validate: (value) => {
                      const num = parseFloat(value);
                      if (isNaN(num) || num < 0) {
                        return "Valor deve ser maior ou igual a zero";
                      }
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <NumericFormat
                      value={field.value || "0"}
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                      prefix="R$ "
                      placeholder="R$ 0,00"
                      onValueChange={(values) => {
                        field.onChange(values.value || "0");
                      }}
                    />
                  )}
                />
                {errors.mods?.[index]?.valor_mensal && (
                  <p className="text-sm text-destructive">{errors.mods[index]?.valor_mensal?.message}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-900 hover:bg-red-800 text-white"
        >
          {isSubmitting ? (servidor ? "Atualizando..." : "Cadastrando...") : (servidor ? "Atualizar Servidor" : "Cadastrar Servidor")}
        </Button>
      </div>
    </form>
  );
};
