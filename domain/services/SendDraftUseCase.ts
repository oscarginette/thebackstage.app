/**
 * SendDraftUseCase
 *
 * Use case for sending a saved draft campaign.
 * Converts draft to sent status and sends to all subscribed contacts.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles draft sending logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 */

import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { IEmailProvider } from '@/domain/providers/IEmailProvider';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { IUserSettingsRepository } from '@/domain/repositories/IUserSettingsRepository';
import { CompileEmailHtmlUseCase } from '@/domain/services/CompileEmailHtmlUseCase';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';
import { trackOperation, trackQuery, setUser, addBreadcrumb, captureError } from '@/lib/sentry-utils';

export interface SendDraftInput {
  userId: number;
  draftId: string;
}

export interface SendDraftResult {
  success: boolean;
  campaignId: string;
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

export class SendDraftUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private executionLogRepository: IExecutionLogRepository,
    private campaignRepository: IEmailCampaignRepository,
    private compileEmailHtmlUseCase: CompileEmailHtmlUseCase,
    private userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(input: SendDraftInput): Promise<SendDraftResult> {
    setUser({ id: input.userId });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 CAMPAIGN SEND - START');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Input:', JSON.stringify(input, null, 2));
    console.log('Test Mode:', env.TEST_EMAIL_ONLY ? 'ACTIVE ⚠️' : 'DISABLED');
    console.log('Email Provider:', env.USE_MAILGUN ? 'Mailgun' : 'Resend');
    console.log('');

    return trackOperation(
      'SendCampaign',
      async () => {
        const startTime = Date.now();

        try {
          addBreadcrumb('Starting campaign send', {
            draftId: input.draftId,
            userId: input.userId
          });

          // 1. Retrieve draft campaign
          console.log('📋 Step 1: Retrieving campaign...');
          const campaign = await trackQuery(
            'getCampaignById',
            () => this.campaignRepository.findById(input.draftId),
            { draftId: input.draftId }
          );

          if (!campaign) {
            console.log('❌ Campaign not found:', input.draftId);
            throw new ValidationError(`Draft with ID ${input.draftId} not found`);
          }

          console.log('✅ Campaign retrieved:');
          console.log('   - ID:', campaign.id);
          console.log('   - Subject:', campaign.subject);
          console.log('   - Status:', campaign.status);
          console.log('');

          addBreadcrumb('Campaign retrieved', {
            campaignId: campaign.id,
            subject: campaign.subject,
            status: campaign.status
          });

          // 2. Verify it's a draft
          console.log('🔍 Step 2: Verifying campaign status...');
          if (campaign.status === 'sent') {
            console.log('❌ Campaign already sent');
            throw new ValidationError('This campaign has already been sent');
          }
          console.log('✅ Campaign is a draft (ready to send)');
          console.log('');

          // 2.5. Compile HTML if not already compiled (CRITICAL FIX)
          // Campaign may have greeting/message/signature but no html_content
          // This happens when drafts are saved without pre-compilation
          if (!campaign.htmlContent && (campaign as any).greeting) {
            console.log('🔧 Step 2.5: Compiling HTML from draft fields...');
            console.log('   Greeting:', (campaign as any).greeting?.substring(0, 50) || 'none');
            console.log('   Message:', (campaign as any).message?.substring(0, 50) || 'none');
            console.log('   Signature:', (campaign as any).signature?.substring(0, 50) || 'none');

            try {
              const compilationResult = await this.compileEmailHtmlUseCase.execute({
                userId: input.userId,
                greeting: (campaign as any).greeting || '',
                message: (campaign as any).message || '',
                signature: (campaign as any).signature || '',
                coverImageUrl: (campaign as any).coverImageUrl || null,
                unsubscribeUrlPlaceholder: 'unsubscribe?token=TEMP_TOKEN',
              });

              // Update campaign in-memory with compiled HTML
              (campaign as any).htmlContent = compilationResult.html;

              // Persist compiled HTML to database
              await trackQuery(
                'updateCampaignHtml',
                () => this.campaignRepository.update({
                  id: campaign.id,
                  htmlContent: compilationResult.html,
                }),
                { campaignId: campaign.id }
              );

              console.log('✅ HTML compiled successfully');
              console.log('   HTML Length:', compilationResult.html.length, 'chars');
              console.log('');
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.log('❌ Failed to compile HTML:', errorMessage);
              throw new ValidationError(`Cannot send campaign: ${errorMessage}`);
            }
          } else if (!campaign.htmlContent) {
            console.log('❌ Campaign has no HTML content and no draft fields to compile');
            throw new ValidationError('Campaign must have either htmlContent or greeting/message/signature');
          } else {
            console.log('✅ Campaign already has HTML content (', campaign.htmlContent.length, 'chars)');
            console.log('');
          }

          // 3. Get subscribed contacts
          console.log('👥 Step 3: Retrieving subscribed contacts...');
          let contacts = await trackQuery(
            'getSubscribedContacts',
            () => this.contactRepository.getSubscribed(input.userId),
            { userId: input.userId }
          );

          console.log('✅ Retrieved contacts from database:', contacts.length);
          console.log('');

          // TEMPORARY TEST FILTER: Only send to specific email in test mode
          // Remove this block when ready for production
          if (env.TEST_EMAIL_ONLY === true) {
            const testEmail = 'info@geebeat.com';
            const originalCount = contacts.length;

            console.log('⚠️  TEST MODE ACTIVE');
            console.log('   Original contacts:', originalCount);
            console.log('   Filtering to test email only:', testEmail);

            contacts = contacts.filter(c => c.email === testEmail);

            console.log('   Filtered contacts:', contacts.length);

            if (contacts.length === 0) {
              console.log('   ❌ Test email not found in contact list!');
              console.log('   Available emails:', contacts.slice(0, 5).map(c => c.email).join(', '));
            } else {
              console.log('   ✅ Test email found:', contacts[0].email);
            }
            console.log('');

            addBreadcrumb('Test mode activated', {
              testEmail,
              originalContactCount: originalCount,
              filteredCount: contacts.length
            });
          }

          if (contacts.length === 0) {
            console.log('❌ No subscribed contacts after filtering');
            throw new ValidationError('No hay contactos suscritos');
          }

          addBreadcrumb('Contacts retrieved', {
            totalContacts: contacts.length
          });

          console.log(`📨 Preparing to send to ${contacts.length} contact(s)...`);
          console.log('');

          // 4. Send emails
          console.log('📬 Step 4: Sending emails...');
          const results = await this.sendEmails(contacts, campaign, input.userId);

          console.log('✅ Email sending complete:');
          console.log('   - Sent successfully:', results.emailsSent.length);
          console.log('   - Failed:', results.emailsFailed.length);
          if (results.emailsFailed.length > 0) {
            console.log('   - Failures:');
            results.emailsFailed.forEach(f => console.log(`     • ${f.email}: ${f.error}`));
          }
          console.log('');

          addBreadcrumb('Emails sent', {
            emailsSent: results.emailsSent.length,
            emailsFailed: results.emailsFailed.length
          });

          // 5. Mark campaign as sent
          console.log('💾 Step 5: Marking campaign as sent...');
          await trackQuery(
            'markCampaignAsSent',
            () => this.campaignRepository.markAsSent(input.draftId),
            { draftId: input.draftId }
          );
          console.log('✅ Campaign marked as sent');
          console.log('');

          // 6. Log execution
          console.log('📊 Step 6: Logging execution...');
          await this.logExecution(campaign.subject, results.emailsSent.length, input.draftId, startTime);
          console.log('✅ Execution logged');
          console.log('');

          // 7. Build response
          const duration = Date.now() - startTime;
          const response = {
            success: true,
            campaignId: input.draftId,
            emailsSent: results.emailsSent.length,
            emailsFailed: results.emailsFailed.length,
            totalContacts: contacts.length,
            duration,
            failures: results.emailsFailed.length > 0 ? results.emailsFailed : undefined
          };

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ CAMPAIGN SEND - SUCCESS');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Final Results:');
          console.log(JSON.stringify(response, null, 2));
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');

          return response;
        } catch (error: unknown) {
          const errorToLog = error instanceof Error ? error : new Error('Unknown error occurred');

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('❌ CAMPAIGN SEND - ERROR');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Error:', errorToLog.message);
          console.log('Stack:', errorToLog.stack);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');

          captureError(errorToLog, {
            userId: input.userId,
            action: 'send-campaign',
            metadata: {
              draftId: input.draftId
            }
          });

          await this.logError(errorToLog, startTime);
          throw error;
        }
      },
      {
        draftId: input.draftId,
        userId: input.userId
      }
    );
  }

  private async sendEmails(
    contacts: Array<{ id: number; email: string; name?: string | null; unsubscribeToken: string }>,
    campaign: { id: string; subject: string | null; htmlContent: string | null },
    userId: number
  ) {
    return trackOperation(
      'SendEmailBatch',
      async () => {
        const emailsSent: Array<{ email: string; id?: string }> = [];
        const emailsFailed: Array<{ email: string; error: string }> = [];

        const baseUrl = getAppUrl();

        // Retrieve user settings to get sender email and name
        console.log('   📝 Retrieving user sender settings...');
        let senderEmail: string | undefined;
        let senderName: string | undefined;

        try {
          const userSettings = await trackQuery(
            'getUserSettings',
            () => this.userSettingsRepository.getByUserId(userId),
            { userId }
          );

          if (userSettings.hasSenderEmail()) {
            senderEmail = userSettings.senderEmail || undefined;
            senderName = userSettings.senderName || undefined;
            console.log('   ✅ Using custom sender:', senderEmail, senderName ? `(${senderName})` : '');
          } else {
            console.log('   ℹ️  No custom sender configured, using provider default');
          }
        } catch (error) {
          console.log('   ⚠️  Failed to retrieve user settings, using provider default');
          console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
        }

        console.log('');
        console.log(`   Sending to ${contacts.length} recipient(s):`);

        for (const contact of contacts) {
          try {
            console.log(`   → Sending to: ${contact.email}...`);

            // Replace temporary unsubscribe URL with contact-specific one
            const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;
            const personalizedHtml = (campaign.htmlContent || '').replace(
              /unsubscribe\?token=TEMP_TOKEN/g,
              `unsubscribe?token=${contact.unsubscribeToken}`
            );

            // Build sender string if custom sender is configured
            // Format: "Sender Name <sender@example.com>" or "sender@example.com"
            const fromAddress = senderEmail
              ? (senderName ? `${senderName} <${senderEmail}>` : senderEmail)
              : undefined;

            const result = await trackOperation(
              'SendEmail',
              () => this.emailProvider.send({
                from: fromAddress, // Pass custom sender if configured
                to: contact.email,
                subject: campaign.subject || 'No Subject',
                html: personalizedHtml,
                tags: [
                  { name: 'category', value: 'campaign' },
                  { name: 'campaign_id', value: campaign.id }
                ],
                unsubscribeUrl
              }),
              {
                contactId: contact.id,
                email: contact.email,
                campaignId: campaign.id
              }
            );

            if (result.success) {
              console.log(`     ✅ Sent successfully (ID: ${result.id})`);
              emailsSent.push({ email: contact.email, id: result.id });
            } else {
              console.log(`     ❌ Failed: ${result.error}`);
              captureError(new Error(`Email send failed: ${result.error}`), {
                action: 'send-email',
                metadata: {
                  email: contact.email,
                  campaignId: campaign.id,
                  error: result.error
                }
              });
              emailsFailed.push({ email: contact.email, error: result.error || 'Unknown error' });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log(`     ❌ Exception: ${errorMessage}`);

            captureError(
              error instanceof Error ? error : new Error(errorMessage),
              {
                action: 'send-email-exception',
                metadata: {
                  email: contact.email,
                  campaignId: campaign.id
                }
              }
            );

            emailsFailed.push({ email: contact.email, error: errorMessage });
          }
        }

        console.log('');

        return { emailsSent, emailsFailed };
      },
      {
        totalRecipients: contacts.length,
        campaignId: campaign.id,
        subject: campaign.subject
      }
    );
  }

  private async logExecution(
    subject: string | null,
    emailsSent: number,
    campaignId: string,
    startTime: number
  ): Promise<void> {
    await this.executionLogRepository.create({
      newTracks: 0,
      emailsSent,
      durationMs: Date.now() - startTime,
      trackId: null,
      trackTitle: `Campaign: ${subject}`
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
