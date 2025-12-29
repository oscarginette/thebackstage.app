import { NextResponse } from 'next/server';
import { ProcessEmailEventUseCase } from '@/domain/services/ProcessEmailEventUseCase';
import { emailEventRepository } from '@/infrastructure/database/repositories';
import { EmailEventFactory } from '@/infrastructure/events/EmailEventFactory';
import { ResendWebhookSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Resend para capturar eventos de emails
 *
 * Eventos que escuchamos:
 * - email.sent: Email enviado exitosamente
 * - email.delivered: Email entregado al servidor del destinatario
 * - email.delivery_delayed: Entrega retrasada
 * - email.bounced: Email rebotado (hard/soft bounce)
 * - email.opened: Email abierto por el usuario
 * - email.clicked: Usuario hizo click en un link del email
 *
 * Configuración en Resend:
 * 1. Dashboard → Webhooks → Add endpoint
 * 2. URL: https://tu-dominio.vercel.app/api/webhooks/resend
 * 3. Events: Seleccionar todos los de arriba
 * 4. Secret: Copiar y guardar en RESEND_WEBHOOK_SECRET
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate webhook payload
    const validation = ResendWebhookSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Resend Webhook] Validation failed:', validation.error.format());
      return NextResponse.json(
        { error: 'Invalid webhook payload', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { type, data } = validation.data;

    console.log('[Resend Webhook]', type, data);

    const handlers = EmailEventFactory.createHandlers(emailEventRepository);
    const useCase = new ProcessEmailEventUseCase(emailEventRepository, handlers);

    await useCase.execute(type, data);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Failed to process webhook';
    console.error('Error processing Resend webhook:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET endpoint para verificar que el webhook está activo
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/resend',
    events: [
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.bounced',
      'email.opened',
      'email.clicked'
    ]
  });
}
