import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface StreamerFormData {
  nome: string;
  email: string;
  telefone: string;
  steam_id: string;
  youtube: string;
  instagram: string;
  facebook: string;
}

interface Streamer {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  steam_id: string | null;
  youtube: string | null;
  instagram: string | null;
  facebook: string | null;
}

interface StreamerFormProps {
  streamer?: Streamer;
  onSuccess: () => void;
}

export function StreamerForm({ streamer, onSuccess }: StreamerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StreamerFormData>({
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      steam_id: "",
      youtube: "",
      instagram: "",
      facebook: "",
    }
  });

  useEffect(() => {
    if (streamer) {
      reset({
        nome: streamer.nome,
        email: streamer.email,
        telefone: streamer.telefone || "",
        steam_id: streamer.steam_id || "",
        youtube: streamer.youtube || "",
        instagram: streamer.instagram || "",
        facebook: streamer.facebook || "",
      });
    } else {
      reset({
        nome: "",
        email: "",
        telefone: "",
        steam_id: "",
        youtube: "",
        instagram: "",
        facebook: "",
      });
    }
  }, [streamer, reset]);

  const onSubmit = async (data: StreamerFormData) => {
    setIsSubmitting(true);
    
    try {
      const streamerData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || null,
        steam_id: data.steam_id || null,
        youtube: data.youtube || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
      };

      if (streamer) {
        const { error } = await supabase
          .from("streamers")
          .update(streamerData)
          .eq("id", streamer.id);

        if (error) throw error;

        toast({
          title: "Streamer atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("streamers")
          .insert([streamerData]);

        if (error) throw error;

        toast({
          title: "Streamer adicionado com sucesso!",
        });
      }

      reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar streamer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          {...register("nome", { required: "Nome é obrigatório" })}
          placeholder="Nome do streamer"
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register("email", { 
            required: "Email é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Email inválido"
            }
          })}
          placeholder="email@exemplo.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          {...register("telefone")}
          placeholder="(00) 00000-0000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steam_id">Steam ID</Label>
        <Input
          id="steam_id"
          {...register("steam_id")}
          placeholder="Steam ID do streamer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtube">YouTube</Label>
        <Input
          id="youtube"
          {...register("youtube")}
          placeholder="https://youtube.com/@canal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          {...register("instagram")}
          placeholder="https://instagram.com/usuario"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facebook">Facebook</Label>
        <Input
          id="facebook"
          {...register("facebook")}
          placeholder="https://facebook.com/pagina"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {streamer ? "Atualizar Streamer" : "Adicionar Streamer"}
      </Button>
    </form>
  );
}
