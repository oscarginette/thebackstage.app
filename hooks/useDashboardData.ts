import { useState, useEffect } from 'react';
import { BrevoList, ExecutionHistoryItem, SoundCloudTrack } from '../types/dashboard';

export function useDashboardData() {
  const [lists, setLists] = useState<BrevoList[]>([]);
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [allTracks, setAllTracks] = useState<SoundCloudTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [sendingTrackId, setSendingTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar listas de Brevo
      const listsRes = await fetch('/api/brevo-lists');
      const listsData = await listsRes.json();

      if (listsData.error) {
        throw new Error(listsData.error);
      }

      setLists(listsData.lists || []);

      // Cargar configuración actual
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();

      if (!configData.error) {
        setSelectedLists(configData.listIds || []);
      }

      // Cargar historial de ejecuciones
      const historyRes = await fetch('/api/execution-history');
      const historyData = await historyRes.json();

      if (!historyData.error) {
        setHistory(historyData.history || []);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleList = (listId: number) => {
    setSelectedLists((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listIds: selectedLists })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/check-soundcloud');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Email enviado: "${data.track}" a ${data.listsUsed} lista(s)`
        });
        // Recargar historial después de una ejecución exitosa
        loadData();
      } else {
        setMessage({
          type: 'success',
          text: data.message || 'No hay nuevos tracks'
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTesting(false);
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleSendTrack = async (track: SoundCloudTrack) => {
    if (selectedLists.length === 0) {
      setMessage({ type: 'error', text: 'Debes configurar y guardar al menos una lista primero' });
      return;
    }

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
          listIds: selectedLists // Pasar las listas seleccionadas
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `Email enviado: "${data.track}" a ${data.listsUsed} lista(s)`
      });

      // Recargar datos
      loadData();
      if (showAllTracks) {
        loadAllTracks();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSendingTrackId(null);
    }
  };

  return {
    lists,
    selectedLists,
    history,
    allTracks,
    loadingTracks,
    showAllTracks,
    sendingTrackId,
    loading,
    saving,
    testing,
    message,
    handleToggleList,
    handleSave,
    handleTest,
    loadAllTracks,
    handleSendTrack,
    setMessage
  };
}
