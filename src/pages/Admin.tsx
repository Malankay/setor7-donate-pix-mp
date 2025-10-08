import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, UserPlus, Edit, Trash2, Copy, X, Plus } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { AddUserDialog, EditUserDialog } from "@/components/UserDialogs";
import { ServerForm } from "@/components/ServerForm";

interface Donation {
  id: string;
  payment_id: string;
  name: string;
  email: string;
  phone: string | null;
  steam_id: string | null;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}


interface Servidor {
  id: string;
  nome: string;
  host: string;
  valor_mensal: number;
  created_at: string;
}

interface ServidorMod {
  id: string;
  servidor_id: string;
  nome_mod: string;
  discord: string | null;
  loja_steam: string | null;
  valor_mensal: number;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null);
  const [servidorMods, setServidorMods] = useState<ServidorMod[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showAddServerDialog, setShowAddServerDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [updatingStatuses, setUpdatingStatuses] = useState(false);
  const [cancellingDonation, setCancellingDonation] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchDonations();
      fetchUsers();
      fetchServidores();
    }
  }, [user]);

  const fetchServidores = async () => {
    try {
      const { data, error } = await supabase
        .from("servidores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServidores(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar servidores",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewServidor = async (servidor: Servidor) => {
    setSelectedServidor(servidor);
    
    try {
      const { data, error } = await supabase
        .from("servidores_mods")
        .select("*")
        .eq("servidor_id", servidor.id);

      if (error) throw error;

      setServidorMods(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar MODs",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDonations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar doações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: "Usuário deletado",
        description: "O usuário foi removido do sistema.",
      });

      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') {
      return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
    }
    return 'bg-accent/10 text-accent hover:bg-accent/20';
  };

  const handleUpdateAllStatuses = async () => {
    const pendingDonations = donations.filter(d => d.status !== 'approved');
    
    if (pendingDonations.length === 0) {
      toast({
        title: "Nenhuma doação pendente",
        description: "Todas as doações já estão aprovadas.",
      });
      return;
    }

    setUpdatingStatuses(true);
    let updatedCount = 0;

    try {
      for (const donation of pendingDonations) {
        try {
          const { data, error } = await supabase.functions.invoke('get-mercadopago-order', {
            body: { orderId: donation.payment_id, donationId: donation.id }
          });

          if (!error && data?.status && data.status !== donation.status) {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Erro ao atualizar doação ${donation.id}:`, error);
        }
      }

      toast({
        title: "Atualização concluída",
        description: `${updatedCount} doação(ões) atualizada(s) com sucesso.`,
      });

      fetchDonations();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingStatuses(false);
    }
  };

  const handleCancelDonation = async (paymentId: string, donationId: string) => {
    setCancellingDonation(donationId);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-mercadopago-order', {
        body: { orderId: paymentId, donationId }
      });

      if (error) throw error;

      toast({
        title: "Doação cancelada",
        description: "A doação foi cancelada com sucesso.",
      });

      fetchDonations();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar doação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancellingDonation(null);
    }
  };

  const handleStatusClick = async (paymentId: string, donationId: string) => {
    setLoadingOrder(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mercadopago-order', {
        body: { orderId: paymentId, donationId }
      });

      if (error) throw error;

      setOrderData(data);

      // Se o status foi atualizado, mostrar notificação e recarregar
      if (data?.status && data.status !== "pending") {
        toast({
          title: "Status atualizado",
          description: `O status da doação foi atualizado para: ${data.status}`,
        });
        fetchDonations();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar dados do pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker-bg">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-glow opacity-20 pointer-events-none animate-pulse" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="py-8 px-4 border-b border-border/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  PAINEL DE ADMINISTRAÇÃO
                </h1>
                <p className="text-accent font-semibold mt-1">
                  Gerencie doações e usuários
                </p>
              </div>
              <Button onClick={handleSignOut} variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>


        {/* Content */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            <Card className="backdrop-blur-sm bg-card/50 border-border/50">
              <Tabs defaultValue="donations" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="donations">Doações</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                    <TabsTrigger value="servers">Servidor</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="donations">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl">Doações Recebidas</CardTitle>
                        <CardDescription>
                          Total de {donations.length} doações
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={handleUpdateAllStatuses} 
                        disabled={updatingStatuses}
                        className="gap-2 bg-red-900 hover:bg-red-800 text-white"
                      >
                        {updatingStatuses ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          "Atualizar Status"
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {donations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                Nenhuma doação encontrada
                              </TableCell>
                            </TableRow>
                          ) : (
                            donations.map((donation) => (
                              <TableRow key={donation.id}>
                                <TableCell>{formatDate(donation.created_at)}</TableCell>
                                <TableCell className="font-medium">{donation.name}</TableCell>
                                <TableCell>{donation.email}</TableCell>
                                <TableCell className="text-accent font-semibold">{formatCurrency(donation.amount)}</TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => handleStatusClick(donation.payment_id, donation.id)}
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${getStatusColor(donation.status)}`}
                                  >
                                    {donation.status}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {donation.status === 'pending' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCancelDonation(donation.payment_id, donation.id)}
                                        disabled={cancellingDonation === donation.id}
                                        className="h-8 w-8 p-0 bg-red-900 hover:bg-red-800 text-white"
                                      >
                                        {cancellingDonation === donation.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <X className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedDonation(donation)}
                                      className="text-white hover:text-white hover:bg-accent/10"
                                    >
                                      Ver Detalhes
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="users">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl">Usuários do Sistema</CardTitle>
                        <CardDescription>
                          Total de {users.length} usuários cadastrados
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowAddUserDialog(true)} className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Adicionar Usuário
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Data de Cadastro</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Nenhum usuário encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((userProfile) => (
                              <TableRow key={userProfile.id}>
                                <TableCell className="font-medium">
                                  {userProfile.full_name || "-"}
                                </TableCell>
                                <TableCell>{userProfile.email}</TableCell>
                                <TableCell>{formatDate(userProfile.created_at)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditUser(userProfile)}
                                      className="hover:text-accent"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setUserToDelete(userProfile.id)}
                                      className="hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="servers">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl">Servidores Cadastrados</CardTitle>
                        <CardDescription>
                          Total de {servidores.length} servidor(es) cadastrado(s)
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => setShowAddServerDialog(true)} 
                        className="gap-2 bg-red-900 hover:bg-red-800 text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Cadastrar Servidor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {servidores.length > 0 ? (
                      <div className="rounded-md border border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome do Servidor</TableHead>
                              <TableHead>Host</TableHead>
                              <TableHead>Valor Mensal</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {servidores.map((servidor) => (
                              <TableRow key={servidor.id}>
                                <TableCell className="font-medium">{servidor.nome}</TableCell>
                                <TableCell>{servidor.host}</TableCell>
                                <TableCell className="text-accent font-semibold">{formatCurrency(servidor.valor_mensal)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewServidor(servidor)}
                                    className="text-white hover:text-white hover:bg-accent/10"
                                  >
                                    Ver Detalhes
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum servidor cadastrado ainda. Clique em "Cadastrar Servidor" para adicionar o primeiro.
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </section>

        <AddUserDialog
          open={showAddUserDialog}
          onOpenChange={setShowAddUserDialog}
          onSuccess={fetchUsers}
        />

        <EditUserDialog
          open={showEditUserDialog}
          onOpenChange={setShowEditUserDialog}
          user={selectedUser}
          onSuccess={fetchUsers}
        />

        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
          <DialogContent className="max-w-2xl backdrop-blur-sm bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl">Detalhes da Doação</DialogTitle>
              <DialogDescription>
                Informações completas sobre a doação
              </DialogDescription>
            </DialogHeader>
            {selectedDonation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedDonation.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDonation.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedDonation.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Steam ID</p>
                    <p className="font-medium">{selectedDonation.steam_id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium text-lg text-accent">{formatCurrency(selectedDonation.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{selectedDonation.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID do Pagamento</p>
                    <p className="font-medium text-xs">{selectedDonation.payment_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{formatDate(selectedDonation.created_at)}</p>
                  </div>
                </div>
                {selectedDonation.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-medium">{selectedDonation.description}</p>
                  </div>
                )}
                {selectedDonation.qr_code_base64 && (
                  <div className="flex flex-col items-center gap-2 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">QR Code PIX</p>
                    <img 
                      src={`data:image/png;base64,${selectedDonation.qr_code_base64}`} 
                      alt="QR Code PIX" 
                      className="w-64 h-64 border border-border/50 rounded-lg"
                    />
                    {selectedDonation.qr_code && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedDonation.qr_code!);
                          toast({
                            title: "Código copiado!",
                            description: "O código PIX foi copiado para a área de transferência.",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Copiar código PIX
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!orderData} onOpenChange={() => setOrderData(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto backdrop-blur-sm bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl">Dados do Mercado Pago</DialogTitle>
              <DialogDescription>
                Informações completas retornadas pela API
              </DialogDescription>
            </DialogHeader>
            {loadingOrder ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : orderData ? (
              <div className="space-y-4">
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(orderData, null, 2)}
                </pre>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>


        <Dialog open={showAddServerDialog} onOpenChange={setShowAddServerDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-sm bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl">Cadastrar Novo Servidor</DialogTitle>
              <DialogDescription>
                Preencha as informações do servidor e seus MODs
              </DialogDescription>
            </DialogHeader>
            <ServerForm onSuccess={() => {
              toast({
                title: "Sucesso",
                description: "Servidor cadastrado com sucesso!",
              });
              fetchServidores();
              setShowAddServerDialog(false);
            }} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedServidor} onOpenChange={() => setSelectedServidor(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto backdrop-blur-sm bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl">Detalhes do Servidor</DialogTitle>
              <DialogDescription>
                Informações completas sobre o servidor e seus MODs
              </DialogDescription>
            </DialogHeader>
            {selectedServidor && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome do Servidor</p>
                    <p className="font-medium text-lg">{selectedServidor.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Host</p>
                    <p className="font-medium">{selectedServidor.host}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Mensal</p>
                    <p className="font-medium text-lg text-accent">{formatCurrency(selectedServidor.valor_mensal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                    <p className="font-medium">{formatDate(selectedServidor.created_at)}</p>
                  </div>
                </div>

                {servidorMods.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h3 className="text-lg font-semibold mb-4">MODs do Servidor</h3>
                    <div className="space-y-4">
                      {servidorMods.map((mod, index) => (
                        <Card key={mod.id} className="backdrop-blur-sm bg-card/30 border-border/50">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Nome do MOD</p>
                                <p className="font-medium">{mod.nome_mod}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                                <p className="font-medium text-accent">{formatCurrency(mod.valor_mensal)}</p>
                              </div>
                              {mod.discord && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Discord</p>
                                  <p className="font-medium">{mod.discord}</p>
                                </div>
                              )}
                              {mod.loja_steam && (
                                <div className="col-span-2">
                                  <p className="text-sm text-muted-foreground">Loja Steam</p>
                                  <a 
                                    href={mod.loja_steam} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-medium text-accent hover:underline"
                                  >
                                    {mod.loja_steam}
                                  </a>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
