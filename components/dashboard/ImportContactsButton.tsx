'use client';

import { Upload } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export default function ImportContactsButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200 text-sm font-bold active:scale-95 shadow-sm"
    >
      <Upload className="w-4 h-4" />
      Import
    </button>
  );
}
