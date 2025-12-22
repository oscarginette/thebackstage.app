"use client";

import Link from "next/link";
import LandingHero from "@/components/landing/LandingHero";
import ProblemSection from "@/components/landing/ProblemSection";
import ValuePropSection from "@/components/landing/ValuePropSection";
import FeatureSection from "@/components/landing/FeatureSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-accent/30 selection:text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif italic text-2xl text-foreground">
            Backstage
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">Pricing</Link>
            <Link 
              href="/dashboard"
              className="h-10 px-6 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <LandingHero />
        <ProblemSection />
        <div id="value" />
        <ValuePropSection />
        <div id="features" />
        <FeatureSection />
      </main>

      <LandingFooter />
    </div>
  );
}
