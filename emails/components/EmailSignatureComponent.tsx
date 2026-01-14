/**
 * EmailSignatureComponent
 *
 * Reusable email signature component for React Email templates.
 * Renders logo and social links with responsive design optimized for email clients.
 */

import { Img, Link, Section, Text } from '@react-email/components';
import { EmailSignatureData } from '@/domain/value-objects/EmailSignature';

interface EmailSignatureComponentProps {
  signature: EmailSignatureData;
  baseUrl: string; // For logo URL fallback
}

export function EmailSignatureComponent({
  signature,
  baseUrl,
}: EmailSignatureComponentProps) {
  return (
    <>
      {/* Custom Text Signature (optional) */}
      {signature.customText && (
        <Section style={customTextSection}>
          {signature.customText.split('\n').map((line, i) => (
            <Text key={i} style={customTextStyle}>
              {line}
            </Text>
          ))}
        </Section>
      )}

      {/* Logo Footer */}
      {signature.logoUrl && (
        <Section style={logoFooterSection}>
          <Img
            src={signature.logoUrl}
            alt="Artist Logo"
            width="100"
            style={logoFooter}
          />
        </Section>
      )}

      {/* Social Links */}
      {signature.socialLinks.length > 0 && (
        <Section style={socialSection}>
          {signature.socialLinks.map((link, index) => (
            <span key={link.platform}>
              {index > 0 && ' • '}
              <Link href={link.url} style={socialLink}>
                {link.label}
              </Link>
            </span>
          ))}
        </Section>
      )}
    </>
  );
}

// Styles (inline for email client compatibility)
const customTextSection = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const customTextStyle = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const logoFooterSection = {
  textAlign: 'center' as const,
  margin: '24px 0 16px',
};

const logoFooter = {
  maxWidth: '100px',
  height: 'auto',
  display: 'block',
  margin: '0 auto',
};

const socialSection = {
  textAlign: 'center' as const,
  margin: '12px 0 24px',
};

const socialLink = {
  color: '#6B7280',
  fontSize: '12px',
  textDecoration: 'none',
};
