import { Shield, Lock, Activity, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="w-full flex-col flex items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-6 py-24 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
            <Shield className="h-20 w-20 text-primary relative z-10" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Secure Your Development Pipeline with <span className="text-primary">Sentinel</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Advanced DevSecOps platform for automated security analysis, vulnerability tracking, and continuous compliance.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg" className="px-8">
            <Link to="/auth?tab=register">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8">
            <Link to="/auth?tab=login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-8 text-left">
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <Activity className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Continuous Monitoring</h3>
          <p className="text-muted-foreground">
            Real-time tracking of security metrics and automated alerts for suspicious activities in your CI/CD pipelines.
          </p>
        </div>
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <Lock className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Vulnerability Scanning</h3>
          <p className="text-muted-foreground">
            Deep analysis of your codebase and dependencies to identify and score security vulnerabilities instantly.
          </p>
        </div>
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
          <Server className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Infrastructure Security</h3>
          <p className="text-muted-foreground">
            Automated compliance checks and policy enforcement for your cloud infrastructure and containers.
          </p>
        </div>
      </section>
    </div>
  );
}
