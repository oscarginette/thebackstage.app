"use client";

import { useTranslations } from '@/lib/i18n/context';
import { motion } from "framer-motion";
import { Download, Mail, UserPlus, Zap } from "lucide-react";

export default function ProblemSection() {
  const t = useTranslations('problem');
  
  const activities = [
    { icon: <Download className="w-4 h-4 text-blue-500" />, text: "Track 'Summer_Edit.wav' downloaded", time: "2m ago" },
    { icon: <UserPlus className="w-4 h-4 text-green-500" />, text: "New subscriber: alex.m@...com", time: "2m ago" },
    { icon: <Mail className="w-4 h-4 text-purple-500" />, text: "Auto-Email sent: 'Welcome Pack'", time: "1m ago" },
    { icon: <UserPlus className="w-4 h-4 text-green-500" />, text: "New subscriber: sarah.j@...com", time: "Just now" },
    { icon: <Zap className="w-4 h-4 text-yellow-500" />, text: "Gate conversion rate ↑ 24%", time: "Just now" },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-6">
              {t('title.line1')} <br />
              <span className="italic underline decoration-accent/30 decoration-8 underline-offset-4">{t('title.line2')}</span>.
            </h2>
            <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
              {t('subtitle')}
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">1</div>
                <div>
                  <h4 className="font-bold mb-1">{t('step1.title')}</h4>
                  <p className="text-foreground/60">{t('step1.description')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">2</div>
                <div>
                  <h4 className="font-bold mb-1">{t('step2.title')}</h4>
                  <p className="text-foreground/60">{t('step2.description')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* The Automation Card */}
            <div className="rounded-3xl bg-white border border-border shadow-2xl overflow-hidden relative">
               <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-mono text-foreground/40 uppercase tracking-widest">System Active</span>
               </div>
               
               <div className="p-6 space-y-4">
                  {activities.map((activity, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-border/50">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.text}</p>
                      </div>
                      <span className="text-[10px] text-foreground/30 whitespace-nowrap">{activity.time}</span>
                    </motion.div>
                  ))}
                  
                  {/* Processing indicator */}
                  <div className="flex items-center gap-2 justify-center pt-2">
                     <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                     <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce delay-100" />
                     <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce delay-200" />
                  </div>
               </div>
            </div>
            
            {/* Overlay Tag - The User Chilling */}
            <div className="absolute -bottom-6 -right-6 rotate-[-2deg] bg-white px-6 py-4 rounded-2xl shadow-xl border border-border max-w-[200px]">
              <p className="font-serif italic text-lg leading-tight text-foreground mb-2">"{t('quote')}"</p>
              <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-wide">Status: In the Studio</p>
            </div>
            
            {/* Background Glows */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
