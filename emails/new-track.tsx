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
}

export default function NewTrackEmail({
  trackName,
  trackUrl,
  coverImage,
  unsubscribeUrl,
}: NewTrackEmailProps) {
  // Logo hosted on GitHub (black version for white/light backgrounds in email)
  const logoUrl = 'https://raw.githubusercontent.com/oscarginette/soundcloud-brevo/main/public/GEE_BEAT_LOGO_BLACK_HORIZONTAL.png';

  // Use direct image URL - SoundCloud images work well in emails
  const coverUrl = coverImage;

  return (
    <Html>
      <Head />
      <Preview>This is my new track {trackName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Content */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              Hey mate,
            </Text>
            <Text style={paragraph}>
              This is my new track <strong style={{ fontWeight: '600' }}>{trackName}</strong> and it's now on Soundcloud!
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
            <Text style={signature}>
              Much love,
            </Text>
            <Text style={signature}>
              Gee Beat
            </Text>
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
