"use client";

import { 
  BarChart3, 
  Users, 
  Mail, 
  Music, 
  Settings, 
  Plus, 
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";
import { useTranslations } from '@/lib/i18n/context';

export default function ProductShowcase() {
  const t = useTranslations('hero'); // Reuse hero strings if needed or just hardcode for the mockup

  return (
    <section className="py-24 bg-[#FDFCF9] overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-6xl font-serif mb-6">
             Your command center <br />
            <span className="italic text-accent">for growth.</span>
          </h2>
          <p className="text-xl text-foreground/60">
            Manage your fanbase, downloads, and newsletters from one beautiful dashboard.
          </p>
        </div>

        {/* Browser Window mockup */}
        <div className="relative max-w-7xl mx-auto">
           {/* Glow layout */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-accent/10 to-purple-500/10 rounded-[2.5rem] blur-3xl -z-10" />
          
          <div className="rounded-[20px] bg-white border border-border shadow-2xl overflow-hidden ring-1 ring-black/5 mx-4 md:mx-0">
            {/* Window Controls */}
            <div className="h-10 bg-[#F9F9F9] border-b border-border flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-black/10" />
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white rounded-md text-[10px] text-foreground/40 font-medium border border-border shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                backstage.app/dashboard
              </div>
              <div className="w-16" /> 
            </div>

            {/* App Interface */}
            <div className="min-h-[500px] bg-[#FDFCF9] p-6 font-sans">
              
              {/* App Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-serif text-foreground mb-1">Backstage</h1>
                  <p className="text-sm text-foreground/40 font-light">The Artist's Command Center</p>
                </div>
                <div className="text-right">
                   <div className="text-sm font-medium text-foreground">contact@alexmusic.com</div>
                   <div className="text-[10px] text-foreground/40 tracking-wider uppercase mb-2">ARTIST</div>
                   <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-full text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-sm">
                      <Settings className="w-3 h-3" />
                      SETTINGS
                   </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-white p-1.5 rounded-2xl border border-border shadow-sm inline-flex mb-6 w-full md:w-auto overflow-x-auto">
                  <div className="flex items-center gap-1">
                    <button className="px-4 py-2 bg-[#111] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
                       <BarChart3 className="w-3.5 h-3.5" />
                       Overview
                    </button>
                    <button className="px-4 py-2 text-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors">
                       <Music className="w-3.5 h-3.5" />
                       Download Gates
                    </button>
                    <button className="px-4 py-2 text-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors">
                       <Mail className="w-3.5 h-3.5" />
                       Emails & Newsletters
                    </button>
                    <button className="px-4 py-2 text-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors">
                       <Users className="w-3.5 h-3.5" />
                       Audience
                    </button>
                  </div>
              </div>

              {/* Main Content Area */}
              <div className="space-y-6">
                 
                 {/* Stats Row */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: "AUDIENCE", value: "2,840", icon: <Users className="w-4 h-4 text-blue-500" /> },
                      { label: "DOWNLOADS", value: "15.2k", icon: <CheckCircle2 className="w-4 h-4 text-accent" /> },
                      { label: "ENGAGEMENT", value: "1,204", icon: <BarChart3 className="w-4 h-4 text-purple-500" /> },
                      { label: "CONVERSION", value: "18.5%", icon: <ArrowUpRight className="w-4 h-4 text-green-500" /> },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white px-4 py-3 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                         <span className="p-2 bg-muted/30 rounded-lg flex-shrink-0">{stat.icon}</span>
                         <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-foreground/40 tracking-widest mb-0.5">{stat.label}</div>
                            <div className="text-xl font-serif font-medium text-foreground">{stat.value}</div>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* Active Gates Section */}
                 <div>
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-accent/10 rounded-lg text-accent"><Music className="w-3.5 h-3.5" /></span>
                          <h3 className="text-lg font-serif text-foreground">Active Gates</h3>
                       </div>
                       <button className="px-3 py-1.5 bg-[#111] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-black/80 transition-colors">
                          <Plus className="w-3 h-3" />
                          Create New
                       </button>
                    </div>

                    <div className="bg-white p-2 rounded-2xl border border-border shadow-sm">
                       {/* List Item 1 */}
                       <div className="group flex items-center gap-3 p-3 hover:bg-muted/20 rounded-xl transition-colors cursor-default">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-inner flex items-center justify-center text-white font-bold text-xs flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-sm text-foreground truncate">Midnight City - Extended Mix</h4>
                             <p className="text-xs text-foreground/40">Tech House • Released 2 days ago</p>
                          </div>

                          <div className="hidden md:flex items-center gap-6 mr-4">
                             <div className="text-right">
                                <div className="font-bold text-sm">1,204</div>
                                <div className="text-[10px] text-foreground/40 uppercase">Downloads</div>
                             </div>
                             <div className="text-right">
                                <div className="font-bold text-sm">85%</div>
                                <div className="text-[10px] text-foreground/40 uppercase">Conversion</div>
                             </div>
                          </div>
                          <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted cursor-pointer flex-shrink-0">
                             <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Two Columns: Campaign History & Growth Engine */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Growth Engine Banner */}
                    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-center items-start">
                       <div className="mb-3">
                          <h3 className="text-xl font-serif mb-1.5">Growth Engine</h3>
                          <p className="text-sm text-foreground/60">Create high-converting download gates to grow your audience automatically.</p>
                       </div>
                       <button className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all">
                          Start New Campaign
                       </button>
                    </div>

                    {/* Empty State / History */}
                    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                       <div className="w-10 h-10 bg-muted/30 rounded-xl flex items-center justify-center mb-3 text-foreground/40">
                          <Mail className="w-5 h-5" />
                       </div>
                       <h4 className="font-serif text-base mb-1">Campaign History</h4>
                       <p className="text-xs text-foreground/40">Your sent newsletters will appear here</p>
                    </div>
                 </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
