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

  const signatureLines = signature.split('\n');
  const messageLines = message.split('\n');

  // Parse message for bold text (**text**) and URLs
  const parseMessage = (text: string) => {
    // First split by bold markers
    const boldParts = text.split(/(\*\*.*?\*\*)/g);

    return boldParts.map((part, i) => {
      // Handle bold text
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: '600' }}>{part.slice(2, -2)}</strong>;
      }

      // Detect URLs in regular text
      // Regex matches http://, https://, and www. URLs
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
      const urlParts = part.split(urlRegex);

      return urlParts.map((urlPart, j) => {
        // Re-test each part individually
        const isUrl = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/.test(urlPart);
        if (isUrl) {
          // Ensure URL has protocol for proper linking
          const href = urlPart.startsWith('www.') ? `https://${urlPart}` : urlPart;
          return (
            <Link key={`${i}-${j}`} href={href} style={linkStyle}>
              {urlPart}
            </Link>
          );
        }
        return urlPart;
      });
    });
  };

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
                  {parseMessage(greeting)}
                </Text>
              )}
              {message && messageLines.map((line, i) => (
                <Text key={i} style={{ ...paragraph, margin: i === messageLines.length - 1 ? '0 0 16px 0' : '0' }}>
                  {line.trim() === '' ? '\u00A0' : parseMessage(line)}
                </Text>
              ))}
            </Section>
          )}

          {/* Cover Image (only render if URL exists and is valid) */}
          {coverImage && coverImage.trim().length > 0 && (
            <Section style={coverSection}>
              <Img
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
              {signatureLines.map((line, i) => (
                <Text key={i} style={signatureStyle}>
                  {parseMessage(line)}
                </Text>
              ))}
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
