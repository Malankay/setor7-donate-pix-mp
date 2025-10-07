import DonationForm from "@/components/DonationForm";
import logoSetor7 from "@/assets/logoSetor7.jpg";
import { Headphones, Users, Zap } from "lucide-react";
const Index = () => {
  return <div className="min-h-screen bg-darker-bg">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-glow opacity-20 pointer-events-none animate-pulse" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="py-8 px-4 text-center border-b border-border/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src={logoSetor7} alt="Setor 7 Logo" className="w-20 h-20 rounded-full logo-glow animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 tracking-tight">
              SETOR 7
            </h1>
            <p className="text-xl md:text-2xl text-accent font-semibold">
              Hardcore PVE
            </p>
          </div>
        </header>

        {/* Features */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="feature-card p-6 rounded-lg text-center">
                <Headphones className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-lg font-bold mb-2">Comunidade Ativa</h3>
                <p className="text-sm text-muted-foreground">
                  Jogadores dedicados e apaixonados
                </p>
              </div>
              
              <div className="feature-card p-6 rounded-lg text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-lg font-bold mb-2">Servidor Otimizado</h3>
                <p className="text-sm text-muted-foreground">
                  Performance e estabilidade garantidas
                </p>
              </div>
              
              <div className="feature-card p-6 rounded-lg text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-accent" />
                <h3 className="text-lg font-bold mb-2">Time Dedicado</h3>
                <p className="text-sm text-muted-foreground">Administração imparcial e justa</p>
              </div>
            </div>
          </div>
        </section>

        {/* Donation Form */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl flex justify-center">
            <DonationForm />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Setor 7 Hardcore PVE. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Desenvolvido com 💀 para a melhor comunidade PVE
            </p>
          </div>
        </footer>
      </div>
    </div>;
};
export default Index;