/**
 * EJEMPLO: Cómo refactorizar modales usando el componente base Modal
 *
 * ANTES (código repetitivo ~80 líneas):
 */

import { X } from 'lucide-react';

// ❌ ANTES - Código duplicado en cada modal
function OldActivateModal({ onClose, userCount, onConfirm }: { onClose: () => void; userCount: number; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1c1c1c]">Activate Subscription</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Activating for {userCount} users
              </p>
            </div>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* ... contenido del modal ... */}
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ DESPUÉS - Usando componente base (código limpio ~30 líneas)
 */

import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';

function NewActivateModal({ isOpen, onClose, userCount, onConfirm }: { isOpen: boolean; onClose: () => void; userCount: number; onConfirm: () => void }) {
  const handleConfirm = () => onConfirm();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      title="Activate Subscription"
      subtitle={`Activating for ${userCount} user${userCount > 1 ? 's' : ''}`}
    >
      <ModalBody>
        {/* Solo el contenido específico del modal */}
        <div className="grid grid-cols-[1fr,340px] gap-8">
          {/* Plan selection, billing, etc. */}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex gap-2">
          <button onClick={handleConfirm} className="btn-primary">
            Confirm Activation
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

/**
 * BENEFICIOS:
 *
 * 1. ✅ Menos código (80 → 30 líneas)
 * 2. ✅ Click-outside automático
 * 3. ✅ Consistencia visual en todos los modales
 * 4. ✅ Fácil de mantener (cambio en un solo lugar)
 * 5. ✅ Tamaños configurables (sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl)
 * 6. ✅ Props opcionales (title, subtitle, closeButton)
 *
 * MIGRACIÓN GRADUAL:
 *
 * No necesitas refactorizar todos los modales ahora.
 * Puedes migrar gradualmente cuando hagas cambios en cada modal.
 * Los modales existentes siguen funcionando con el fix de click-outside.
 */
