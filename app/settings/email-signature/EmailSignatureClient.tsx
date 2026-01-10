'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Plus, Save, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATHS } from '@/lib/paths';

interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

interface EmailSignatureData {
  logoUrl: string | null;
  customText: string | null;
  socialLinks: SocialLink[];
  defaultToGeeBeat: boolean;
}

interface EmailSignatureClientProps {
  userId: number;
}

export default function EmailSignatureClient({ userId }: EmailSignatureClientProps) {
  const [signature, setSignature] = useState<EmailSignatureData>({
    logoUrl: null,
    customText: null,
    socialLinks: [],
    defaultToGeeBeat: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load signature on mount
  useEffect(() => {
    loadSignature();
  }, [userId]);

  const loadSignature = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/email-signature');
      const data = await res.json();

      if (res.ok) {
        setSignature(data.signature);
      } else {
        setError(data.error || 'Failed to load signature');
      }
    } catch (err) {
      setError('Failed to load signature');
      console.error('Load signature error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Maximum size is 2MB.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-signature-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSignature(prev => ({ ...prev, logoUrl: data.url }));
      } else {
        setError(data.error || 'Failed to upload logo');
      }
    } catch (err) {
      setError('Failed to upload logo');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSignature(prev => ({ ...prev, logoUrl: null }));
  };

  const handleAddLink = () => {
    if (signature.socialLinks.length >= 6) {
      setError('Maximum 6 social links allowed');
      return;
    }
    setSignature(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: '', url: '', label: '' }],
    }));
  };

  const handleUpdateLink = (index: number, field: keyof SocialLink, value: string) => {
    setSignature(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const handleRemoveLink = (index: number) => {
    setSignature(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch('/api/email-signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signature),
      });

      const data = await res.json();

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save signature');
      }
    } catch (err) {
      setError('Failed to save signature');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Are you sure you want to reset to the default The Backstage signature?')) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch('/api/email-signature', {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadSignature(); // Reload signature (will get The Backstage default)
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset signature');
      }
    } catch (err) {
      setError('Failed to reset signature');
      console.error('Reset error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={PATHS.SETTINGS}
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Preview'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            Signature saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 mt-6">
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Email Signature</h1>
            <p className="text-foreground/60 mt-2">
              Customize your email signature with your logo and social links
            </p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Logo</h2>
            {signature.logoUrl ? (
              <div className="relative inline-block">
                <img
                  src={signature.logoUrl}
                  alt="Signature logo"
                  className="h-20 w-auto border border-border rounded-md"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-foreground/40 mb-2" />
                  <p className="text-sm text-foreground/60">
                    {isUploading ? 'Uploading...' : 'Click to upload logo'}
                  </p>
                  <p className="text-xs text-foreground/40 mt-1">
                    PNG, JPEG, WebP or SVG (Max 2MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Custom Text */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Custom Text (Optional)</h2>
            <textarea
              value={signature.customText || ''}
              onChange={(e) => setSignature(prev => ({ ...prev, customText: e.target.value }))}
              placeholder="Thanks,&#10;Your Name"
              className="w-full px-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
              maxLength={500}
            />
            <p className="text-sm text-foreground/60">
              {signature.customText?.length || 0}/500 characters
            </p>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Social Links</h2>
              <button
                onClick={handleAddLink}
                disabled={signature.socialLinks.length >= 6}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>
            </div>

            <div className="space-y-3">
              {signature.socialLinks.map((link, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Platform (e.g., Instagram)"
                    value={link.platform}
                    onChange={(e) => handleUpdateLink(index, 'platform', e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={50}
                  />
                  <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={link.url}
                    onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g., @username)"
                    value={link.label}
                    onChange={(e) => handleUpdateLink(index, 'label', e.target.value)}
                    className="flex-1 px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={50}
                  />
                  <button
                    onClick={() => handleRemoveLink(index)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {signature.socialLinks.length === 0 && (
                <div className="text-center py-8 text-foreground/40 text-sm">
                  No social links yet. Click "Add Link" to get started.
                </div>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-6 border-t border-border">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-600/20 rounded-md hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset to The Backstage Default
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Signature Preview</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview */}
                <div className="border border-border rounded-lg p-8 bg-white text-black">
                  {/* Custom Text */}
                  {signature.customText && (
                    <div className="text-center mb-6">
                      {signature.customText.split('\n').map((line, i) => (
                        <p key={i} className="text-sm text-gray-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Logo */}
                  {signature.logoUrl && (
                    <div className="text-center mb-4">
                      <img
                        src={signature.logoUrl}
                        alt="Logo"
                        className="h-16 w-auto inline-block"
                      />
                    </div>
                  )}

                  {/* Social Links */}
                  {signature.socialLinks.length > 0 && (
                    <div className="text-center text-sm text-gray-600">
                      {signature.socialLinks.map((link, index) => (
                        <span key={index}>
                          {index > 0 && ' • '}
                          <a href={link.url} className="hover:underline">
                            {link.label}
                          </a>
                        </span>
                      ))}
                    </div>
                  )}

                  {!signature.logoUrl && !signature.customText && signature.socialLinks.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      Your signature will appear here
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
