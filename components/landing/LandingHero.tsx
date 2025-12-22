"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Background Aurora Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
        <div className="bg-aurora-light w-full h-full opacity-30" />
      </div>

      <div className="container px-4 mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium border rounded-full bg-white/50 border-border backdrop-blur-sm">
          <span className="flex w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-foreground/80">Backstage for Artists</span>
        </div>
        
        <h1 className="max-w-4xl mx-auto mb-6 text-6xl md:text-8xl font-serif tracking-tight leading-[0.9]">
          Make music. <br />
          <span className="text-accent italic">Grow</span> automatically.
        </h1>
        
        <p className="max-w-2xl mx-auto mb-10 text-xl md:text-2xl text-foreground/60 leading-relaxed font-sans">
          Stop worrying about marketing. We help you turn listeners into a dedicated community through automated email lists while you stay in your creative flow.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard"
            className="group relative inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-lg font-medium text-background transition-all hover:bg-foreground/90 active:scale-95"
          >
            Start Growing Now
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="text-sm text-foreground/40 font-medium italic">
            No credit card required. Pure automation.
          </p>
        </div>
      </div>
    </section>
  );
}
