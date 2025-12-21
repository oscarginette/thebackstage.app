import { ITrackRepository } from '@/domain/repositories/ITrackRepository';
import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { IEmailLogRepository } from '@/domain/repositories/IEmailLogRepository';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { IEmailProvider } from '@/infrastructure/email/IEmailProvider';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';

export interface SendTrackInput {
  trackId: string;
  title: string;
  url: string;
  coverImage?: string;
  publishedAt?: string;
  customContent?: {
    subject?: string;
    greeting?: string;
    message?: string;
    signature?: string;
  };
}

export interface SendTrackResult {
  success: boolean;
  track: string;
  emailsSent: number;
  emailsFailed: number;
  totalContacts: number;
  duration: number;
  failures?: Array<{ email: string; error: string }>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SendTrackEmailUseCase {
  constructor(
    private trackRepository: ITrackRepository,
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private emailLogRepository: IEmailLogRepository,
    private executionLogRepository: IExecutionLogRepository
  ) {}

  async execute(input: SendTrackInput): Promise<SendTrackResult> {
    const startTime = Date.now();

    try {
      // 1. Validar input
      this.validateInput(input);

      // 2. Verificar si el track ya fue enviado
      await this.checkDuplicateTrack(input.trackId);

      // 3. Obtener contactos suscritos
      const contacts = await this.contactRepository.getSubscribed();

      if (contacts.length === 0) {
        throw new ValidationError('No hay contactos suscritos');
      }

      console.log(`Enviando emails a ${contacts.length} contactos...`);

      // 4. Enviar emails
      const results = await this.sendEmails(contacts, input);

      // 5. Guardar track en DB
      await this.saveTrack(input);

      // 6. Log de ejecución exitosa
      await this.logExecution(input, results.emailsSent.length, startTime);

      // 7. Construir respuesta
      return {
        success: true,
        track: input.title,
        emailsSent: results.emailsSent.length,
        emailsFailed: results.emailsFailed.length,
        totalContacts: contacts.length,
        duration: Date.now() - startTime,
        failures: results.emailsFailed.length > 0 ? results.emailsFailed : undefined
      };
    } catch (error: any) {
      // Log de error
      await this.logError(error, startTime);
      throw error;
    }
  }

  private validateInput(input: SendTrackInput): void {
    if (!input.trackId || !input.title || !input.url) {
      throw new ValidationError('Missing required fields: trackId, title, url');
    }
  }

  private async checkDuplicateTrack(trackId: string): Promise<void> {
    const exists = await this.trackRepository.existsByTrackId(trackId);
    if (exists) {
      throw new ValidationError('Este track ya ha sido enviado anteriormente');
    }
  }

  private async sendEmails(
    contacts: Array<{ id: number; email: string; name?: string | null; unsubscribeToken: string }>,
    input: SendTrackInput
  ) {
    const emailsSent: Array<{ email: string; id?: string }> = [];
    const emailsFailed: Array<{ email: string; error: string }> = [];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soundcloud-brevo.vercel.app';

    for (const contact of contacts) {
      try {
        const result = await this.sendSingleEmail(contact, input, baseUrl);

        if (result.success) {
          emailsSent.push({ email: contact.email, id: result.id });
          await this.emailLogRepository.create({
            contactId: contact.id,
            trackId: input.trackId,
            resendEmailId: result.id || null,
            status: 'sent'
          });
        } else {
          emailsFailed.push({ email: contact.email, error: result.error || 'Unknown error' });
          await this.emailLogRepository.create({
            contactId: contact.id,
            trackId: input.trackId,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error: any) {
        console.error(`Error procesando ${contact.email}:`, error);
        emailsFailed.push({ email: contact.email, error: error.message });
      }
    }

    return { emailsSent, emailsFailed };
  }

  private async sendSingleEmail(
    contact: { email: string; unsubscribeToken: string },
    input: SendTrackInput,
    baseUrl: string
  ) {
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;

    const emailHtml = await render(
      NewTrackEmail({
        trackName: input.title,
        trackUrl: input.url,
        coverImage: input.coverImage || '',
        unsubscribeUrl,
        customContent: input.customContent ? {
          greeting: input.customContent.greeting,
          message: input.customContent.message,
          signature: input.customContent.signature
        } : undefined
      })
    );

    const emailSubject = input.customContent?.subject || 'New music from Gee Beat';

    return await this.emailProvider.send({
      to: contact.email,
      subject: emailSubject,
      html: emailHtml,
      tags: [
        { name: 'category', value: 'new_track' },
        { name: 'track_id', value: input.trackId }
      ]
    });
  }

  private async saveTrack(input: SendTrackInput): Promise<void> {
    const publishedDateStr = input.publishedAt
      ? new Date(input.publishedAt).toISOString()
      : new Date().toISOString();

    await this.trackRepository.save({
      trackId: input.trackId,
      title: input.title,
      url: input.url,
      publishedAt: publishedDateStr,
      coverImage: input.coverImage || null
    });
  }

  private async logExecution(input: SendTrackInput, emailsSent: number, startTime: number): Promise<void> {
    await this.executionLogRepository.create({
      newTracks: 1,
      emailsSent,
      durationMs: Date.now() - startTime,
      trackId: input.trackId,
      trackTitle: input.title
    });
  }

  private async logError(error: Error, startTime: number): Promise<void> {
    try {
      await this.executionLogRepository.create({
        error: error.message,
        durationMs: Date.now() - startTime
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}
