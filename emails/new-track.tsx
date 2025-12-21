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
}

export default function NewTrackEmail({
  trackName,
  trackUrl,
  coverImage,
}: NewTrackEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  // Ensure HTTPS for email clients
  const coverUrl = coverImage.replace('http://', 'https://');

  return (
    <Html>
      <Head />
      <Preview>This is my new track {trackName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Cover Image */}
          <Section style={coverSection}>
            <Link href={trackUrl}>
              <Img
                src={coverUrl}
                alt={trackName}
                width="600"
                style={cover}
              />
            </Link>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              Hey mate,
            </Text>
            <Text style={paragraph}>
              This is my new track <strong style={{ fontWeight: '600' }}>{trackName}</strong> and it's now on Soundcloud!
            </Text>
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
              src={`${baseUrl}/GEE_BEAT_LOGO_BLACK_HORIZONTAL.png`}
              alt="Gee Beat"
              width="80"
              style={logoFooter}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Ultra minimal modern styles
const main = {
  backgroundColor: '#000000',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#000000',
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
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

const signature = {
  color: '#ffffff',
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
  backgroundColor: '#ffffff',
  color: '#000000',
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
  padding: '48px 32px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #222222',
};

const logoFooter = {
  margin: '0 auto',
  opacity: '0.5',
  filter: 'invert(1)',
};
