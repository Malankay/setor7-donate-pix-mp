import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, UserPlus, Edit, Trash2 } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { AddUserDialog, EditUserDialog } from "@/components/UserDialogs";

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

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [loading, setLoading] = useState(true);
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
    }
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
            <p className="text-muted-foreground">Gerencie as doações recebidas</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card>
          <Tabs defaultValue="donations" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="donations">Doações</TabsTrigger>
                <TabsTrigger value="users">Usuários</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="donations">
              <CardHeader>
                <CardTitle>Doações Recebidas</CardTitle>
                <CardDescription>
                  Total de {donations.length} doações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
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
                            <TableCell>{formatCurrency(donation.amount)}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                                {donation.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDonation(donation)}
                              >
                                Ver Detalhes
                              </Button>
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
                    <CardTitle>Usuários do Sistema</CardTitle>
                    <CardDescription>
                      Total de {users.length} usuários cadastrados
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowAddUserDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
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
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUserToDelete(userProfile.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
          </Tabs>
        </Card>

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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Doação</DialogTitle>
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
                    <p className="font-medium text-lg">{formatCurrency(selectedDonation.amount)}</p>
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
