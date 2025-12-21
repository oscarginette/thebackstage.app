import React from 'react';

export default function StatCards() {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E8E6DF] rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="w-7 h-7 flex shrink-0 items-center justify-center bg-[#FDFCF8] rounded-full border border-[#F2F0E9]">
        <svg className="w-3.5 h-3.5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-medium text-[#1c1c1c] leading-none mb-0.5">Frecuencia</h3>
        <p className="text-[11px] text-gray-400 font-medium">Diario 20:00 CET</p>
      </div>
    </div>
  );
}
