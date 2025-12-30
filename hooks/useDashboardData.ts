import { useState, useEffect } from 'react';
import { ExecutionHistoryItem, SoundCloudTrack, EmailContent } from '../types/dashboard';

export function useDashboardData() {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [allTracks, setAllTracks] = useState<SoundCloudTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [sendingTrackId, setSendingTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);
  const [contactStats, setContactStats] = useState<any>(null);
  const [gates, setGates] = useState<any[]>([]);
  const [loadingGates, setLoadingGates] = useState(false);
  const [hasSoundCloudId, setHasSoundCloudId] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    fetchUserSettings();
    fetchContactStats();
    fetchGates();
  }, []);

  // Auto-load tracks when hasSoundCloudId is available
  useEffect(() => {
    if (hasSoundCloudId) {
      loadAllTracks();
    }
  }, [hasSoundCloudId]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = async () => {
    try {
      const historyRes = await fetch('/api/execution-history');
      const historyData = await historyRes.json();

      if (!historyData.error) {
        setHistory(historyData.history || []);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const fetchContactStats = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (!data.error) {
        setContactStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching contact stats:', error);
    }
  };

  const fetchGates = async () => {
    setLoadingGates(true);
    try {
      const res = await fetch('/api/download-gates');
      const data = await res.json();
      if (!data.error) {
        setGates(data.gates || []);
      }
    } catch (error) {
      console.error('Error fetching gates:', error);
    } finally {
      setLoadingGates(false);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const res = await fetch('/api/user/settings');
      const response = await res.json();

      // successResponse wraps data in { success: true, data: {...} }
      const data = response.success ? response.data : response;

      if (!response.error && data.settings) {
        setHasSoundCloudId(data.settings.hasSoundCloudId || false);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const loadAllTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch('/api/soundcloud-tracks');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setAllTracks(data.tracks || []);
      setShowAllTracks(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tracks';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleSendTrack = async (track: SoundCloudTrack, customContent?: { subject?: string; greeting?: string; message?: string; signature?: string }) => {
    setSendingTrackId(track.trackId);
    setMessage(null);

    try {
      const res = await fetch('/api/send-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.trackId,
          title: track.title,
          url: track.url,
          coverImage: track.coverImage,
          publishedAt: track.publishedAt,
          customContent
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `Email enviado: "${data.track}" a ${data.emailsSent} contacto(s)`
      });

      // Recargar datos
      loadData();
      if (showAllTracks) {
        loadAllTracks();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send track';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSendingTrackId(null);
    }
  };

  const handleSendCustomEmail = async (content: EmailContent) => {
    setSendingCustomEmail(true);
    setMessage(null);

    try {
      const res = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          saveAsDraft: false
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `Email enviado a ${data.emailsSent} contacto(s)`
      });

      setShowEmailEditor(false);

      // Recargar datos
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send custom email';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSendingCustomEmail(false);
    }
  };

  const handleSaveDraft = async (content: EmailContent) => {
    setMessage(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          status: 'draft'
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: 'Borrador guardado correctamente'
      });

      setShowEmailEditor(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  return {
    history,
    allTracks,
    loadingTracks,
    showAllTracks,
    sendingTrackId,
    loading,
    message,
    showEmailEditor,
    sendingCustomEmail,
    contactStats,
    gates,
    loadingGates,
    hasSoundCloudId,
    loadAllTracks,
    handleSendTrack,
    handleSendCustomEmail,
    handleSaveDraft,
    setMessage,
    setShowEmailEditor,
    fetchGates,
    fetchContactStats
  };
}
