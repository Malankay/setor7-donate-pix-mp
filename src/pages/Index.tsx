import React from "react";
import { Link } from "react-router-dom";
import DonationForm from "@/components/DonationForm";
import logoSetor7 from "@/assets/logoSetor7.jpg";
import { Headphones, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);
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

        {/* Discord Link */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-6xl flex justify-center">
            <a 
              href="https://discord.gg/uaFaNccGR9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              <DiscordIcon className="w-6 h-6" />
              <span className="font-semibold">Junte-se ao nosso Discord</span>
            </a>
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