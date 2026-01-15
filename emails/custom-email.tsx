import { env, getAppUrl, getBaseUrl } from '@/lib/env';
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { EmailSignatureComponent } from './components/EmailSignatureComponent';
import { EmailSignatureData } from '@/domain/value-objects/EmailSignature';

interface CustomEmailProps {
  greeting: string;
  message: string;
  signature: string;
  coverImage?: string;
  unsubscribeUrl: string;
  emailSignature: EmailSignatureData; // NEW: User's custom signature
}

export default function CustomEmail({
  greeting,
  message,
  signature,
  coverImage,
  unsubscribeUrl,
  emailSignature,
}: CustomEmailProps) {
  // Base URL for fallback
  const baseUrl = getAppUrl();

  // HTML is already sanitized in SaveDraftUseCase using RichTextContent.create()
  // Safe to render directly

  return (
    <Html>
      <Head />
      <Preview>{greeting || 'Email from The Backstage'}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Content - Only show if greeting or message exist */}
          {(greeting || message) && (
            <Section style={contentSection}>
              {greeting && (
                <Text style={paragraph}>
                  <span id="email-greeting" dangerouslySetInnerHTML={{ __html: greeting }} />
                </Text>
              )}
              {message && (
                <Text style={paragraph}>
                  <span id="email-message" dangerouslySetInnerHTML={{ __html: message }} />
                </Text>
              )}
            </Section>
          )}

          {/* Cover Image (only render if URL exists and is valid) */}
          {coverImage && coverImage.trim().length > 0 && (
            <Section id="email-cover-section" style={coverSection}>
              <Img
                id="email-cover-image"
                src={coverImage}
                alt="Cover image"
                width="300"
                height="300"
                style={cover}
              />
            </Section>
          )}

          {/* Continue Content - Only show if signature exists */}
          {signature && signature.trim().length > 0 && (
            <Section style={contentSection}>
              <Text style={paragraph}>
                Have a great day :)
              </Text>
              <Text style={signatureStyle}>
                <span id="email-signature" dangerouslySetInnerHTML={{ __html: signature }} />
              </Text>
            </Section>
          )}

          {/* Email Signature (customizable per user) */}
          <Section style={logoFooterSection}>
            <EmailSignatureComponent signature={emailSignature} baseUrl={baseUrl} />
          </Section>

          {/* Unsubscribe */}
          <Section style={unsubscribeSection}>
            <Text style={unsubscribeText}>
              Don't want to receive these emails?{' '}
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Ultra minimal modern styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
};

const coverSection = {
  padding: '0',
};

const cover = {
  width: '100%',
  height: 'auto',
  display: 'block',
};

const contentSection = {
  padding: '40px 32px',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

const signatureStyle = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '24px',
  margin: '0',
};

const linkStyle = {
  color: '#0066CC',
  textDecoration: 'underline',
};

const logoFooterSection = {
  padding: '48px 32px 24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e0e0e0',
};

const unsubscribeSection = {
  padding: '0 32px 32px',
  textAlign: 'center' as const,
};

const unsubscribeText = {
  color: '#444444',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '0',
};

const unsubscribeLink = {
  color: '#666666',
  textDecoration: 'underline',
};
