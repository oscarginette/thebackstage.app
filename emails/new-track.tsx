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

interface NewTrackEmailProps {
  trackName: string;
  trackUrl: string;
  coverImage: string;
  unsubscribeUrl?: string;
  customContent?: {
    greeting?: string;
    message?: string;
    signature?: string;
  };
}

export default function NewTrackEmail({
  trackName,
  trackUrl,
  coverImage,
  unsubscribeUrl,
  customContent,
}: NewTrackEmailProps) {
  // Logo URL: works in both local and production
  // Files in /public are served from the root URL
  const baseUrl = getAppUrl();
  const logoUrl = `${baseUrl}/GEE_BEAT_LOGO_BLACK_HORIZONTAL.png`;

  // Use direct image URL - SoundCloud images work well in emails
  const coverUrl = coverImage;

  // Default content
  const greeting = customContent?.greeting || 'Hey mate,';
  const message = customContent?.message || `This is my new track **${trackName}** and it's now on Soundcloud!`;
  const signatureLines = (customContent?.signature || 'Much love,\nGee Beat').split('\n');

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
      <Preview>{greeting} {trackName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Content */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              {greeting}
            </Text>
            <Text style={paragraph}>
              {parseMessage(message)}
            </Text>
          </Section>

          {/* Cover Image */}
          <Section style={coverSection}>
            <Link href={trackUrl}>
              <Img
                src={coverUrl}
                alt={`Album cover: ${trackName}`}
                width="300"
                height="300"
                style={cover}
              />
            </Link>
          </Section>

          {/* Continue Content */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              Have a great day :)
            </Text>
            {signatureLines.map((line, i) => (
              <Text key={i} style={signature}>
                {line}
              </Text>
            ))}
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={trackUrl} style={button}>
              LISTEN NOW
            </Link>
          </Section>

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
          {unsubscribeUrl && (
            <Section style={unsubscribeSection}>
              <Text style={unsubscribeText}>
                Don't want to receive these emails?{' '}
                <Link href={unsubscribeUrl} style={unsubscribeLink}>
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          )}
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

const logoSection = {
  padding: '40px 0 32px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  filter: 'invert(1)', // Convert black logo to white
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

const signature = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '24px',
  margin: '0',
};

const buttonSection = {
  padding: '0 32px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 48px',
  borderRadius: '2px',
  letterSpacing: '0.8px',
  textTransform: 'uppercase' as const,
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
