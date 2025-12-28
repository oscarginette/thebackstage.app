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

interface CustomEmailProps {
  greeting: string;
  message: string;
  signature: string;
  coverImage?: string;
  unsubscribeUrl: string;
}

export default function CustomEmail({
  greeting,
  message,
  signature,
  coverImage,
  unsubscribeUrl,
}: CustomEmailProps) {
  // Logo from Vercel deployment (black version for white/light backgrounds in email)
  // Files in /public are served from the root URL in Vercel
  const logoUrl = 'https://backstage-art.vercel.app/GEE_BEAT_LOGO_BLACK_HORIZONTAL.png';

  const signatureLines = signature.split('\n');

  // Parse message for bold text (**text**)
  const parseMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: '600' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <Html>
      <Head />
      <Preview>{greeting || 'Email from Gee Beat'}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Content - Only show if greeting or message exist */}
          {(greeting || message) && (
            <Section style={contentSection}>
              {greeting && (
                <Text style={paragraph}>
                  {greeting}
                </Text>
              )}
              {message && (
                <Text style={paragraph}>
                  {parseMessage(message)}
                </Text>
              )}
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
                  {line}
                </Text>
              ))}
            </Section>
          )}

          {/* Logo Footer */}
          <Section style={logoFooterSection}>
            <Img
              src={logoUrl}
              alt="Gee Beat"
              width="100"
              style={logoFooter}
            />
          </Section>

          {/* Social Links */}
          <Section style={socialSection}>
            <Link href="https://www.geebeat.com" style={socialLink}>
              geebeat.com
            </Link>
            {' • '}
            <Link href="https://instagram.com/gee_beat" style={socialLink}>
              Instagram
            </Link>
            {' • '}
            <Link href="https://geebeat.bandcamp.com" style={socialLink}>
              Bandcamp
            </Link>
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

const logoFooterSection = {
  padding: '48px 32px 24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e0e0e0',
};

const logoFooter = {
  display: 'block',
  margin: '0 auto',
};

const socialSection = {
  padding: '0 32px 24px',
  textAlign: 'center' as const,
};

const socialLink = {
  color: '#666666',
  fontSize: '13px',
  textDecoration: 'none',
  letterSpacing: '0.3px',
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
