import { IEmailEventRepository } from '../repositories/IEmailEventRepository';
import { IEmailEvent } from '../events/IEmailEvent';

export class ProcessEmailEventUseCase {
  constructor(
    private readonly eventRepository: IEmailEventRepository,
    private readonly eventHandlers: Map<string, IEmailEvent>
  ) {}

  async execute(webhookType: string, webhookData: any): Promise<void> {
    // Extract emailId from webhook data
    const emailId = webhookData?.email_id;

    if (!emailId) {
      console.warn('No email_id in webhook data');
      return;
    }

    // Find email log in database
    const emailLog = await this.eventRepository.findEmailLogByResendId(emailId);

    if (!emailLog) {
      console.warn(`Email log not found for resend_email_id: ${emailId}`);
      return;
    }

    // Get appropriate event handler
    const handler = this.eventHandlers.get(webhookType);

    if (!handler) {
      console.log(`Unhandled webhook type: ${webhookType}`);
      return;
    }

    // Process event
    await handler.process({
      emailId,
      emailLogId: emailLog.id,
      contactId: emailLog.contact_id,
      trackId: emailLog.track_id,
      data: webhookData
    });
  }
}
