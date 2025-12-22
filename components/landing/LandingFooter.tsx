"use client";

import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="py-20 bg-[#F2F0E9]/50 border-t border-border">
      <div className="container px-4 mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-serif mb-8 max-w-2xl mx-auto">
          Ready to build your community on <span className="italic">autopilot</span>?
        </h2>
        
        <Link 
          href="/dashboard"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground px-10 text-lg font-medium text-background transition-all hover:scale-105 active:scale-95 mb-12 shadow-xl hover:shadow-2xl"
        >
          Get Started for Free
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-border/50 text-foreground/40 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-lg text-foreground/80">Backstage</span>
            <span>© 2025</span>
          </div>
          
          <div className="flex gap-8">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
