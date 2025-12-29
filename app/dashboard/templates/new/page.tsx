'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuotaGuard from '@/components/QuotaGuard';
import { PATHS } from '@/lib/paths';

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);

      const defaultMJML = {
        tagName: 'mjml',
        children: [
          {
            tagName: 'mj-body',
            children: [
              {
                tagName: 'mj-section',
                children: [
                  {
                    tagName: 'mj-column',
                    children: [
                      { tagName: 'mj-text', content: '{{greeting}}' },
                      { tagName: 'mj-spacer', attributes: { height: '20px' } },
                      { tagName: 'mj-image', attributes: { src: '{{coverImage}}', alt: 'Cover' } },
                      { tagName: 'mj-spacer', attributes: { height: '20px' } },
                      { tagName: 'mj-text', content: '{{message}}' },
                      { tagName: 'mj-button', attributes: { href: '{{trackUrl}}' }, content: 'LISTEN NOW' },
                      { tagName: 'mj-spacer', attributes: { height: '20px' } },
                      { tagName: 'mj-text', content: '{{signature}}' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const compileRes = await fetch('/api/templates/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mjmlContent: defaultMJML })
      });

      const { html, errors } = await compileRes.json();

      if (errors && errors.length > 0) {
        alert('Error compilando MJML: ' + errors.map((e: any) => e.message).join(', '));
        return;
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          mjmlContent: defaultMJML,
          htmlSnapshot: html,
          isDefault: false
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      router.push(PATHS.DASHBOARD.TEMPLATES.ROOT);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <QuotaGuard>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Crear Nuevo Template</h1>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Template *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Ej: Welcome Email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                rows={3}
                placeholder="Describe para qué se usa este template"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Creando...' : 'Crear Template'}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </QuotaGuard>
  );
}
