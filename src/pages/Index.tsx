import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Users, Zap, Shield } from 'lucide-react';
import LearnMoreModal from '@/components/LearnMoreModal';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117]">
      <header className="border-b border-[hsl(var(--editor-border))] bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-accent-glow flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-accent to-cyan-accent-glow bg-clip-text text-transparent">
              CodeCollab
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/compiler')}
              className="bg-gradient-to-r from-cyan-accent to-cyan-accent-glow hover:opacity-90"
            >
              AI Compiler
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-cyan-accent to-cyan-accent-glow hover:opacity-90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-accent via-cyan-accent-glow to-cyan-accent bg-clip-text text-transparent">
            Code Together, Build Faster
          </h2>
          <p className="text-xl text-[hsl(var(--editor-text-muted))] mb-8 max-w-2xl mx-auto">
            The ultimate collaborative code editor with real-time editing, AI-powered tools, and seamless project management
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-cyan-accent to-cyan-accent-glow hover:opacity-90 text-lg px-8"
            >
              Start Coding Now
            </Button>
            <LearnMoreModal>
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-accent text-cyan-accent hover:bg-cyan-accent/10 text-lg px-8"
              >
                Learn More
              </Button>
            </LearnMoreModal>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-[hsl(var(--editor-border))] hover:border-cyan-accent/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-accent/20 to-cyan-accent-glow/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-cyan-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--editor-text))]">Real-time Collaboration</h3>
            <p className="text-[hsl(var(--editor-text-muted))]">
              Work together with your team in real-time. See cursor positions and changes instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-[hsl(var(--editor-border))] hover:border-cyan-accent/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-accent/20 to-cyan-accent-glow/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cyan-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--editor-text))]">AI-Powered Tools</h3>
            <p className="text-[hsl(var(--editor-text-muted))]">
              Get code explanations, fixes, and suggestions powered by advanced AI models.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-[hsl(var(--editor-border))] hover:border-cyan-accent/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-accent/20 to-cyan-accent-glow/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-cyan-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--editor-text))]">Secure & Private</h3>
            <p className="text-[hsl(var(--editor-text-muted))]">
              Your code is encrypted and secure. Full control over project permissions.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[hsl(var(--editor-border))] mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-[hsl(var(--editor-text-muted))]">
          <p>&copy; 2024 CodeCollab. Built with passion for developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;