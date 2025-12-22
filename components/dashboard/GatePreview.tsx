'use client';

import { DownloadGate } from '@/types/download-gates';
import { Play, Music, Heart, MessageCircle, Repeat, Share2, Download } from 'lucide-react';

interface GatePreviewProps {
  data: {
    title: string;
    description?: string;
    artworkUrl?: string;
    fileUrl?: string;
    artistName?: string;
  };
}

export default function GatePreview({ data }: GatePreviewProps) {
  return (
    <div className="flex flex-col items-center transition-all duration-500">
      <div className="relative w-[340px] h-[680px] bg-[#0c0c0c] rounded-[3.5rem] border-[10px] border-[#1c1c1c] shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />
        
        {/* Screen Content */}
        <div className="relative h-full overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-black text-white p-6 pt-12 flex flex-col items-center">
          {/* Logo/Header */}
          <div className="flex justify-center mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#FF5500] flex items-center justify-center font-bold text-xs ring-2 ring-white/20">B</div>
          </div>

          {/* Artwork */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl mb-6 group">
            {data.artworkUrl ? (
              <img src={data.artworkUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Music className="w-16 h-16 text-gray-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-[#FF5500] flex items-center justify-center shadow-xl transform active:scale-90 transition-transform">
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
               </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold truncate px-2">{data.title || 'Track Title'}</h2>
            <p className="text-[#FF5500] text-sm font-medium mt-1 uppercase tracking-widest">{data.artistName || 'Artist Name'}</p>
          </div>

          {/* Social Stats Mockup */}
          <div className="flex justify-center gap-6 mb-8 text-gray-400">
             <div className="flex flex-col items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="text-[10px]">1.2k</span>
             </div>
             <div className="flex flex-col items-center gap-1 text-[#FF5500]">
                <Repeat className="w-4 h-4" />
                <span className="text-[10px]">450</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span className="text-[10px]">82</span>
             </div>
          </div>

          {/* Action Button */}
          <button className="w-full py-4 rounded-2xl bg-[#FF5500] text-white font-bold text-sm shadow-xl shadow-[#FF5500]/20 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            <span>DOWNLOAD</span>
          </button>

          {/* Footer */}
          <div className="mt-8 text-center">
             <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-loose">
               Powered by <br/>
               <span className="text-gray-400 font-bold">BACKSTAGE</span>
             </p>
          </div>
        </div>
      </div>
      
      {/* Phone Shadow/Reflect */}
      <div className="w-[280px] h-6 bg-black/20 blur-xl rounded-full mt-4" />
    </div>
  );
}
