import { IEmailEvent } from '@/domain/events/IEmailEvent';
import { IEmailEventRepository } from '@/domain/repositories/IEmailEventRepository';
import { EmailSentEvent } from '@/domain/events/EmailSentEvent';
import { EmailDeliveredEvent } from '@/domain/events/EmailDeliveredEvent';
import { EmailOpenedEvent } from '@/domain/events/EmailOpenedEvent';
import { EmailClickedEvent } from '@/domain/events/EmailClickedEvent';
import { EmailBouncedEvent } from '@/domain/events/EmailBouncedEvent';
import { EmailDelayedEvent } from '@/domain/events/EmailDelayedEvent';

export class EmailEventFactory {
  static createHandlers(repository: IEmailEventRepository): Map<string, IEmailEvent> {
    const handlers = new Map<string, IEmailEvent>();
    handlers.set('email.sent', new EmailSentEvent(repository));
    handlers.set('email.delivered', new EmailDeliveredEvent(repository));
    handlers.set('email.opened', new EmailOpenedEvent(repository));
    handlers.set('email.clicked', new EmailClickedEvent(repository));
    handlers.set('email.bounced', new EmailBouncedEvent(repository));
    handlers.set('email.delivery_delayed', new EmailDelayedEvent(repository));
    return handlers;
  }
}
