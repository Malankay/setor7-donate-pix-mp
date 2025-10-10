import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Secret {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

export const SecretsManager = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      const { data, error } = await supabase
        .from('app_secrets')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      setSecrets(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar secrets",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (secret: Secret) => {
    setEditingSecret(secret);
    setNewValue(secret.value);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingSecret) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_secrets')
        .update({ value: newValue })
        .eq('id', editingSecret.id);

      if (error) throw error;

      toast({
        title: "Secret atualizado",
        description: `${editingSecret.key} foi atualizado com sucesso.`,
      });

      setShowEditDialog(false);
      fetchSecrets();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar secret",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = (secretId: string) => {
    setVisibleSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(secretId)) {
        newSet.delete(secretId);
      } else {
        newSet.add(secretId);
      }
      return newSet;
    });
  };

  const maskValue = (value: string) => {
    return '•'.repeat(12);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Secrets</CardTitle>
          <CardDescription>Configure as chaves de API e tokens do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Secrets</CardTitle>
          <CardDescription>Configure as chaves de API e tokens do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((secret) => (
                <TableRow key={secret.id}>
                  <TableCell className="font-mono text-sm">{secret.key}</TableCell>
                  <TableCell className="text-muted-foreground">{secret.description || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {visibleSecrets.has(secret.id) ? secret.value : maskValue(secret.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(secret.id)}
                      >
                        {visibleSecrets.has(secret.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(secret)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Secret</DialogTitle>
            <DialogDescription>
              Atualize o valor de {editingSecret?.key}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Digite o novo valor"
              />
            </div>
            {editingSecret?.description && (
              <p className="text-sm text-muted-foreground">
                {editingSecret.description}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};