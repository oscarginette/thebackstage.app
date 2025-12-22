'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateGateFormData } from '@/types/download-gates';
import { 
  Music, 
  FileAudio, 
  Shield, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft, 
  Save, 
  Loader2, 
  RefreshCw,
  Layout,
  Tags,
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';
import GatePreview from './GatePreview';

export default function CreateGateForm() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateGateFormData>({
    title: '',
    description: '',
    artistName: '',
    genre: '',
    soundcloudTrackUrl: '',
    artworkUrl: '',
    fileUrl: '',
    fileSizeMb: undefined,
    fileType: 'audio/wav',
    requireSoundcloudRepost: true,
    requireSoundcloudFollow: true,
    requireSpotifyConnect: false,
    maxDownloads: undefined,
    expiresAt: '',
    slug: ''
  });

  const steps = [
    { id: 1, name: 'Source', icon: ExternalLink, description: 'SoundCloud or Spotify URL' },
    { id: 2, name: 'Genre', icon: Tags, description: 'Classify your track' },
    { id: 3, name: 'Details', icon: Music, description: 'Title and Artwork' },
    { id: 4, name: 'Upload', icon: FileAudio, description: 'The file fans will get' },
    { id: 5, name: 'Settings', icon: Settings, description: 'Conversion & Limits' },
    { id: 6, name: 'Gate Steps', icon: Shield, description: 'Social requirements' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: CreateGateFormData) => ({ ...prev, [name]: val }));
  };

  const isStepComplete = (stepId: number) => {
    switch (stepId) {
      case 1: return !!formData.soundcloudTrackUrl;
      case 2: return !!formData.genre;
      case 3: return !!formData.title;
      case 4: return !!formData.fileUrl;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/download-gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create gate');

      const data = await response.json();
      router.push(`/dashboard/download-gates/${data.gate.id}`);
    } catch (error) {
      console.error('Error creating gate:', error);
      alert('Error al crear el gate. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-100px)] overflow-hidden">
      {/* Left Column: Vertical Accordion Form (Scrollable) */}
      <div className="flex-1 w-full space-y-2 overflow-y-auto pr-4 scrollbar-hide h-full pb-10">
        {steps.map((step) => {
          const isOpen = activeStep === step.id;
          const isComplete = isStepComplete(step.id);

          return (
            <div 
              key={step.id} 
              className={`bg-white/70 backdrop-blur-md rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen ? 'border-[#FF5500] shadow-lg ring-1 ring-[#FF5500]/10' : 'border-[#E8E6DF] hover:border-gray-300'
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                className="w-full flex items-center justify-between p-4 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isOpen ? 'bg-[#FF5500] text-white' : 
                    isComplete ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isComplete && !isOpen ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? 'text-[#1c1c1c]' : 'text-gray-500'}`}>
                      {step.name}
                    </span>
                  </div>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />}
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="p-5 pt-1 border-t border-[#E8E6DF] animate-in fade-in slide-in-from-top-2 duration-300">
                  {step.id === 1 && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Enter source track URL</label>
                      <div className="flex gap-3">
                         <input
                          type="url"
                          name="soundcloudTrackUrl"
                          value={formData.soundcloudTrackUrl}
                          onChange={handleChange}
                          placeholder="https://soundcloud.com/..."
                          className="flex-1 px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5500]/10 focus:border-[#FF5500] transition-all text-sm"
                        />
                        <button 
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="px-6 py-3 rounded-xl bg-[#1c1c1c] text-white font-bold text-sm hover:bg-black transition-all active:scale-95"
                        >
                          Next
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/SoundCloud_logo.svg" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
                         <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
                      </div>
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">What's the genre?</label>
                      <select
                        name="genre"
                        value={formData.genre}
                        onChange={handleChange}
                        className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none transition-all text-sm appearance-none"
                      >
                        <option value="">Selecciona género...</option>
                        <option value="house">House</option>
                        <option value="techno">Techno</option>
                        <option value="melodic">Melodic</option>
                        <option value="reggaeton">Reggaeton</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setActiveStep(3)} className="px-6 py-3 rounded-xl bg-[#1c1c1c] text-white font-bold text-sm">Continue</button>
                      </div>
                    </div>
                  )}

                  {step.id === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Track Title</label>
                           <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Song name..."
                            className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Artist Name</label>
                           <input
                            type="text"
                            name="artistName"
                            value={formData.artistName}
                            onChange={handleChange}
                            placeholder="Your DJ name..."
                            className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Artwork URL</label>
                         <input
                          type="url"
                          name="artworkUrl"
                          value={formData.artworkUrl}
                          onChange={handleChange}
                          placeholder="https://..."
                          className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setActiveStep(4)} className="px-6 py-3 rounded-xl bg-[#1c1c1c] text-white font-bold text-sm">Looks Good</button>
                      </div>
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="space-y-4">
                       <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Direct download URL</label>
                       <div className="relative group">
                        <input
                          type="url"
                          name="fileUrl"
                          value={formData.fileUrl}
                          onChange={handleChange}
                          placeholder="Dropbox, GDrive, R2..."
                          className="w-full px-5 py-3 pr-12 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white text-sm"
                        />
                        <FileAudio className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-hover:text-[#FF5500] transition-colors" />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setActiveStep(5)} className="px-6 py-3 rounded-xl bg-[#1c1c1c] text-white font-bold text-sm">Save & Next</button>
                      </div>
                    </div>
                  )}

                  {step.id === 5 && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Downloads</label>
                            <input
                              type="number"
                              name="maxDownloads"
                              value={formData.maxDownloads || ''}
                              onChange={handleChange}
                              placeholder="Unlimited"
                              className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Custom Slug</label>
                            <input
                              type="text"
                              name="slug"
                              value={formData.slug}
                              onChange={handleChange}
                              placeholder="custom-link"
                              className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] text-sm"
                            />
                          </div>
                       </div>
                       <div className="flex justify-end gap-3 font-bold">
                        <button onClick={() => setActiveStep(6)} className="px-6 py-3 rounded-xl bg-[#1c1c1c] text-white font-bold text-sm">Final Setup</button>
                      </div>
                    </div>
                  )}

                  {step.id === 6 && (
                    <div className="space-y-4">
                       <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5"/></div>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email Marketing</span>
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Always ON</span>
                       </div>

                       <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'requireSoundcloudRepost', label: 'SoundCloud Repost', icon: RefreshCw },
                            { id: 'requireSoundcloudFollow', label: 'SoundCloud Follow', icon: Plus },
                            { id: 'requireSpotifyConnect', label: 'Spotify Connect', icon: Music },
                          ].map((req) => (
                             <div 
                              key={req.id}
                              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                formData[req.id as keyof typeof formData] ? 'border-[#FF5500]/20 bg-[#FF5500]/5' : 'border-gray-100 hover:border-gray-200'
                              }`}
                              onClick={() => setFormData((p: CreateGateFormData) => ({ ...p, [req.id]: !p[req.id as keyof typeof formData] }))}
                             >
                               <div className="flex items-center gap-3">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                    formData[req.id as keyof typeof formData] ? 'bg-[#FF5500] text-white' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                     <req.icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{req.label}</span>
                               </div>
                               <input type="checkbox" checked={!!formData[req.id as keyof typeof formData]} readOnly className="w-3.5 h-3.5 rounded text-[#FF5500] focus:ring-[#FF5500] border-gray-300" />
                             </div>
                          ))}
                       </div>

                       <div className="flex justify-end pt-4">
                          <button 
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-[#FF5500] text-white font-bold shadow-xl shadow-[#FF5500]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>CREAR DOWNLOAD GATE</span>
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Column: Preview Stick Side (Wider) */}
      <div className="lg:sticky lg:top-0 h-full w-full lg:w-[450px] flex flex-col items-center shrink-0">
         <div className="w-full bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-[#E8E6DF] flex flex-col items-center h-full">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 self-start">Live Preview</h3>
            <div className="flex-1 flex items-start justify-center w-full pt-2">
               <div className="scale-90 xl:scale-100 origin-top transition-all">
                  <GatePreview data={formData} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
