'use client';

import { useState, useEffect, use } from 'react';
import Header from '../../../../components/dashboard/Header';
import Dock from '../../../../components/ui/Dock';
import Link from 'next/link';
import { ChevronLeft, BarChart2, Users, Settings, Loader2 } from 'lucide-react';
import { DownloadGate } from '@/types/download-gates';
import GateOverview from '@/components/dashboard/GateOverview';
import GateSubmissions from '@/components/dashboard/GateSubmissions';

export default function GateDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [gate, setGate] = useState<DownloadGate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'edit'>('overview');

  useEffect(() => {
    fetchGate();
  }, [id]);

  const fetchGate = async () => {
    try {
      const res = await fetch(`/api/download-gates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGate(data);
      }
    } catch (error) {
      console.error('Error fetching gate:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <Loader2 className="w-12 h-12 text-[#FF5500] animate-spin" />
      </div>
    );
  }

  if (!gate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
         <div className="text-center">
            <h1 className="text-2xl font-serif text-[#1c1c1c] mb-4">Gate no encontrado</h1>
            <Link href="/dashboard/download-gates" className="text-[#FF5500] hover:underline">Volver a mis Gates</Link>
         </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart2 },
    { id: 'submissions', name: 'Submissions', icon: Users },
    { id: 'edit', name: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1c1c1c] selection:bg-[#FF5500] selection:text-white overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-aurora-light"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-16">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link 
            href="/dashboard/download-gates"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#FF5500] transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a mis Gates</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
             {gate.coverImageUrl && (
                <img src={gate.coverImageUrl} alt={gate.title} className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-white" />
             )}
             <div>
                <h1 className="text-4xl font-serif text-[#1c1c1c] mb-1">{gate.title}</h1>
                <div className="flex items-center gap-3">
                   <span className="text-sm font-mono text-[#666]">/gate/{gate.slug}</span>
                   <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                     gate.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                   }`}>
                      {gate.active ? 'Activo' : 'Pausado'}
                   </div>
                </div>
             </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-[#E8E6DF] flex gap-1">
             {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    activeTab === tab.id 
                      ? 'bg-white text-[#FF5500] shadow-md' 
                      : 'text-gray-500 hover:text-[#1c1c1c] hover:bg-white/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
             ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="pb-32">
          {activeTab === 'overview' && <GateOverview gate={gate} />}
          {activeTab === 'submissions' && <GateSubmissions gateId={gate.id} />}
          {activeTab === 'edit' && (
             <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl p-12 text-center">
                <p className="text-[#666]">Formulario de edición en construcción...</p>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="mt-4 text-[#FF5500] hover:underline"
                >
                  Volver al Overview
                </button>
             </div>
          )}
        </div>

        <Dock />
      </div>
    </div>
  );
}
