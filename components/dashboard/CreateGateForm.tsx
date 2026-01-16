'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateGateFormData } from '@/types/download-gates';
import { SoundCloudTrack } from '@/types/dashboard';
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
import GenreSelector from './GenreSelector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialProfileInput } from '@/components/ui/SocialProfileInput';
import { CARD_STYLES, cn } from '@/domain/types/design-tokens';
import { useTranslations } from '@/lib/i18n/context';

export default function CreateGateForm() {
  const router = useRouter();
  const t = useTranslations('downloadGates.createForm');
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [soundcloudTracks, setSoundcloudTracks] = useState<SoundCloudTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [formData, setFormData] = useState<CreateGateFormData>({
    title: '',
    description: '' as string | undefined,
    artistName: '' as string | undefined,
    genre: '' as string | undefined,
    soundcloudTrackUrl: '',
    soundcloudTrackId: '' as string | undefined,
    artworkUrl: '' as string | undefined,
    fileUrl: '',
    fileSizeMb: undefined,
    fileType: 'audio', // ✅ Use backend enum, not MIME type
    collectEmail: true,
    collectName: false,
    requireSoundcloudRepost: true,
    requireSoundcloudFollow: true,
    requireInstagramFollow: true,
    instagramProfileUrl: '' as string | undefined,
    requireSpotifyConnect: true,
    customMessage: '' as string | undefined,
    maxDownloads: undefined,
    expiresAt: undefined,
    slug: '' as string | undefined,
    isActive: true,
  });

  // Load SoundCloud tracks and user Instagram URL on mount
  useEffect(() => {
    loadSoundCloudTracks();
    loadUserInstagramUrl();
  }, []);

  const loadUserInstagramUrl = async () => {
    try {
      const res = await fetch('/api/user/settings');
      const data = await res.json();

      if (data.instagramUrl) {
        setFormData(prev => ({ ...prev, instagramProfileUrl: data.instagramUrl }));
      }
    } catch (error) {
      console.error('Error loading user Instagram URL:', error);
    }
  };

  const loadSoundCloudTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch('/api/soundcloud-tracks');
      const data = await res.json();

      if (!data.error) {
        setSoundcloudTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error loading SoundCloud tracks:', error);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrackId(trackId);
    const track = soundcloudTracks.find(t => t.trackId === trackId);

    if (track) {
      // Extract numeric ID from SoundCloud URN format
      // Format: "tag:soundcloud,2010:tracks/2212048733" -> "2212048733"
      const numericId = track.trackId.split('/').pop() || track.trackId;

      console.log('[CreateGateForm] Track selected:', {
        originalTrackId: track.trackId,
        extractedNumericId: numericId
      });

      setFormData(prev => ({
        ...prev,
        soundcloudTrackUrl: track.url,
        soundcloudTrackId: numericId,
        title: track.title,
        artworkUrl: track.coverImage || '',
        description: track.description || ''
      }));
    }
  };

  const steps = [
    { id: 1, name: t('steps.source'), icon: ExternalLink, description: t('steps.sourceDescription') },
    { id: 2, name: t('steps.genre'), icon: Tags, description: t('steps.genreDescription') },
    { id: 3, name: t('steps.details'), icon: Music, description: t('steps.detailsDescription') },
    { id: 4, name: t('steps.upload'), icon: FileAudio, description: t('steps.uploadDescription') },
    { id: 5, name: t('steps.settings'), icon: Settings, description: t('steps.settingsDescription') },
    { id: 6, name: t('steps.gateSteps'), icon: Shield, description: t('steps.gateStepsDescription') },
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
      console.log('[CreateGateForm] Submitting formData:', formData);
      console.log('[CreateGateForm] soundcloudTrackId:', formData.soundcloudTrackId);

      // ✅ Clean empty strings to undefined (backend expects .url() or undefined)
      const cleanedData = {
        ...formData,
        artworkUrl: formData.artworkUrl ? formData.artworkUrl.trim() || undefined : undefined,
        instagramProfileUrl: formData.instagramProfileUrl ? formData.instagramProfileUrl.trim() || undefined : undefined,
        description: formData.description ? formData.description.trim() || undefined : undefined,
        artistName: formData.artistName ? formData.artistName.trim() || undefined : undefined,
        soundcloudTrackId: formData.soundcloudTrackId ? formData.soundcloudTrackId.trim() || undefined : undefined,
        customMessage: formData.customMessage ? formData.customMessage.trim() || undefined : undefined,
        slug: formData.slug ? formData.slug.trim() || undefined : undefined,
      };

      console.log('[CreateGateForm] Cleaned data:', cleanedData);

      const response = await fetch('/api/download-gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CreateGateForm] Server error:', errorData);
        throw new Error(errorData.error || 'Failed to create gate');
      }

      const data = await response.json();
      router.push(`/dashboard/download-gates/${data.gate.id}`);
    } catch (error) {
      console.error('Error creating gate:', error);
      alert(t('errors.createFailed'));
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
            <Card
              key={step.id}
              variant="subtle"
              padding="sm"
              className={cn(
                'transition-all duration-300 overflow-hidden',
                isOpen
                  ? 'border-accent shadow-lg ring-1 ring-accent/10'
                  : 'hover:border-foreground/20'
              )}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                className="w-full flex items-center justify-between p-4 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isOpen ? 'bg-accent text-white' :
                    isComplete ? 'bg-emerald-500 text-white' : 'bg-foreground/10 text-foreground/40'
                  )}>
                    {isComplete && !isOpen ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <div>
                    <span className={cn(
                      'text-xs font-bold uppercase tracking-wider',
                      isOpen ? 'text-foreground' : 'text-foreground/50'
                    )}>
                      {step.name}
                    </span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-foreground/40" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="p-5 pt-1 border-t border-foreground/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  {step.id === 1 && (
                    <div className="space-y-4">
                      {/* Toggle between track selector and manual URL */}
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          type="button"
                          onClick={() => setUseManualUrl(false)}
                          variant={!useManualUrl ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 uppercase"
                        >
                          {t('source.selectFromTracks')}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setUseManualUrl(true)}
                          variant={useManualUrl ? 'primary' : 'secondary'}
                          size="sm"
                          className="flex-1 uppercase"
                        >
                          {t('source.enterUrlManually')}
                        </Button>
                      </div>

                      {!useManualUrl ? (
                        // Track Selector
                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                            {t('source.selectSoundCloudTrack')}
                          </label>
                          {loadingTracks ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-accent" />
                            </div>
                          ) : soundcloudTracks.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-foreground/20 bg-foreground/5 text-center">
                              <p className="text-sm text-foreground/60">
                                {t('source.noTracksFound')}
                              </p>
                            </div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                              {soundcloudTracks.map((track) => (
                                <button
                                  key={track.trackId}
                                  type="button"
                                  onClick={() => handleTrackSelect(track.trackId)}
                                  className={cn(
                                    'w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3',
                                    selectedTrackId === track.trackId
                                      ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                                      : 'border-foreground/10 hover:border-foreground/20 hover:bg-foreground/5'
                                  )}
                                >
                                  {track.coverImage && (
                                    <img
                                      src={track.coverImage}
                                      alt={track.title}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">
                                      {track.title}
                                    </p>
                                    <p className="text-xs text-foreground/50 truncate">
                                      {new Date(track.publishedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {selectedTrackId === track.trackId && (
                                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-end pt-2">
                            <Button
                              type="button"
                              onClick={() => setActiveStep(2)}
                              disabled={!selectedTrackId}
                            >
                              {t('source.next')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Manual URL Input
                        <div className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                            {t('source.enterSourceUrl')}
                          </label>
                          <div className="flex gap-3">
                            <Input
                              type="url"
                              name="soundcloudTrackUrl"
                              value={formData.soundcloudTrackUrl}
                              onChange={handleChange}
                              placeholder="https://soundcloud.com/..."
                              focusVariant="soundcloud"
                            />
                            <Button
                              type="button"
                              onClick={() => setActiveStep(2)}
                            >
                              {t('source.next')}
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/a/a9/SoundCloud_logo.svg"
                              className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer"
                            />
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"
                              className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-foreground/40">{t('genre.label')}</label>
                      <GenreSelector
                        value={formData.genre}
                        onChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          type="button"
                          onClick={() => setActiveStep(3)}
                          disabled={!formData.genre}
                        >
                          {t('genre.continue')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step.id === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label={t('details.trackTitle')}
                          type="text"
                          name="title"
                          value={formData.title || ''}
                          onChange={handleChange}
                          placeholder={t('details.trackTitlePlaceholder')}
                        />
                        <Input
                          label={t('details.artistName')}
                          type="text"
                          name="artistName"
                          value={formData.artistName || ''}
                          onChange={handleChange}
                          placeholder={t('details.artistNamePlaceholder')}
                        />
                      </div>
                      <Input
                        label={t('details.artworkUrl')}
                        type="url"
                        name="artworkUrl"
                        value={formData.artworkUrl || ''}
                        onChange={handleChange}
                        placeholder={t('details.artworkUrlPlaceholder')}
                      />
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          onClick={() => setActiveStep(4)}
                        >
                          {t('details.looksGood')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Input
                          label={t('upload.directDownloadUrl')}
                          type="url"
                          name="fileUrl"
                          value={formData.fileUrl}
                          onChange={handleChange}
                          placeholder={t('upload.urlPlaceholder')}
                          className="pr-12"
                        />
                        <FileAudio className="absolute right-4 top-1/2 translate-y-1/4 w-4 h-4 text-foreground/30 group-hover:text-accent transition-colors" />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          onClick={() => setActiveStep(5)}
                        >
                          {t('upload.saveAndNext')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step.id === 5 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label={t('settings.maxDownloads')}
                          type="number"
                          name="maxDownloads"
                          value={formData.maxDownloads || ''}
                          onChange={handleChange}
                          placeholder={t('settings.maxDownloadsPlaceholder')}
                        />
                        <Input
                          label={t('settings.customSlug')}
                          type="text"
                          name="slug"
                          value={formData.slug || ''}
                          onChange={handleChange}
                          placeholder={t('settings.customSlugPlaceholder')}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          onClick={() => setActiveStep(6)}
                        >
                          {t('settings.finalSetup')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step.id === 6 && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl border border-foreground/10 bg-foreground/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5"/>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">{t('gateSteps.emailMarketing')}</span>
                        </div>
                        <span className="text-[9px] font-bold text-foreground/40 uppercase">{t('gateSteps.alwaysOn')}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'requireSoundcloudRepost' as const, label: t('gateSteps.soundcloudRepost'), icon: RefreshCw, hasInput: false },
                          { id: 'requireSoundcloudFollow' as const, label: t('gateSteps.soundcloudFollow'), icon: Plus, hasInput: false },
                          { id: 'requireSpotifyConnect' as const, label: t('gateSteps.spotifyConnect'), icon: Music, hasInput: false },
                          { id: 'requireInstagramFollow' as const, label: 'Instagram Follow', icon: ExternalLink, hasInput: true },
                        ].map((req) => {
                          const isChecked = formData[req.id];
                          return (
                            <div
                              key={req.id}
                              className={cn(
                                'rounded-xl border transition-all',
                                isChecked ? 'border-accent/20 bg-accent/5' : 'border-foreground/10'
                              )}
                            >
                              <div
                                className={cn(
                                  'p-3 flex items-center justify-between cursor-pointer',
                                  req.hasInput ? '' : 'hover:bg-foreground/5'
                                )}
                                onClick={() => setFormData((p: CreateGateFormData) => ({ ...p, [req.id]: !p[req.id] }))}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                                    isChecked ? 'bg-accent text-white' : 'bg-foreground/10 text-foreground/40'
                                  )}>
                                    <req.icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">{req.label}</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="w-3.5 h-3.5 rounded text-accent focus:ring-accent border-foreground/30"
                                />
                              </div>

                              {/* Instagram URL Input inside card */}
                              {req.hasInput && isChecked && (
                                <div className="px-3 pb-3 pt-0">
                                  <SocialProfileInput
                                    platform="instagram"
                                    value={formData.instagramProfileUrl || ''}
                                    onChange={async (value) => {
                                      // Update form data
                                      setFormData(prev => ({ ...prev, instagramProfileUrl: value }));

                                      // Save to user settings (auto-saves for future gates)
                                      try {
                                        await fetch('/api/user/settings', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ instagramUrl: value })
                                        });
                                      } catch (error) {
                                        console.error('Error saving Instagram URL:', error);
                                      }
                                    }}
                                    label=""
                                    helperText="Se guardará para futuros gates"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={submitting}
                          loading={submitting}
                          variant="primary"
                          className="w-full md:w-auto bg-accent text-background hover:bg-accent/90 shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95"
                        >
                          <Save className="w-4 h-4" />
                          <span>{t('gateSteps.createGate').toUpperCase()}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Right Column: Preview Stick Side (Wider) */}
      <div className="lg:sticky lg:top-0 h-full w-full lg:w-[450px] flex flex-col items-center shrink-0">
        <Card variant="subtle" padding="lg" className="w-full flex flex-col items-center h-full">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/40 mb-6 self-start">{t('preview.title')}</h3>
          <div className="flex-1 flex items-start justify-center w-full pt-2">
            <GatePreview data={formData} />
          </div>
        </Card>
      </div>
    </div>
  );
}
