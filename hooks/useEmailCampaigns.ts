import { useState, useEffect } from 'react';
import { EmailCampaign, EmailContent } from '../types/dashboard';

export function useEmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [drafts, setDrafts] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      setError(err.message || 'Error loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns?status=draft');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const campaigns = data.campaigns || data.data?.campaigns || [];
      setDrafts(campaigns);
    } catch (err: any) {
      setError(err.message || 'Error loading drafts');
    } finally {
      setLoading(false);
    }
  };

  const getCampaignById = async (id: string): Promise<EmailCampaign | null> => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.campaign || null;
    } catch (err: any) {
      setError(err.message || 'Error loading campaign');
      return null;
    }
  };

  const createDraft = async (content: EmailContent & { templateId?: string }): Promise<EmailCampaign | null> => {
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

      // Reload drafts
      await loadDrafts();

      return data.campaign || null;
    } catch (err: any) {
      setError(err.message || 'Error creating draft');
      return null;
    }
  };

  const updateDraft = async (id: string, content: Partial<EmailContent>): Promise<EmailCampaign | null> => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload drafts
      await loadDrafts();

      return data.campaign || null;
    } catch (err: any) {
      setError(err.message || 'Error updating draft');
      return null;
    }
  };

  const deleteDraft = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload drafts
      await loadDrafts();

      return true;
    } catch (err: any) {
      setError(err.message || 'Error deleting draft');
      return false;
    }
  };

  const sendDraft = async (id: string): Promise<{
    success: boolean;
    emailsSent?: number;
    emailsFailed?: number;
    totalContacts?: number;
    duration?: number;
    failures?: Array<{ email: string; error: string }>;
    error?: string;
  }> => {
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: 'POST'
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload campaigns and drafts
      await loadCampaigns();
      await loadDrafts();

      return {
        success: true,
        emailsSent: data.emailsSent,
        emailsFailed: data.emailsFailed || 0,
        totalContacts: data.totalContacts,
        duration: data.duration,
        failures: data.failures
      };
    } catch (err: any) {
      setError(err.message || 'Error sending draft');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  return {
    campaigns,
    drafts,
    loading,
    error,
    loadCampaigns,
    loadDrafts,
    getCampaignById,
    createDraft,
    updateDraft,
    deleteDraft,
    sendDraft
  };
}
