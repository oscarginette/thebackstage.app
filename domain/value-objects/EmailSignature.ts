/**
 * EmailSignature Value Object
 *
 * Represents a user's customizable email signature with logo and social links.
 * Immutable value object following Clean Architecture principles.
 */

export interface SocialLink {
  platform: string; // FREE-FORM: User enters any platform name (e.g., "Instagram", "TikTok", "Patreon")
  url: string; // VALIDATED: Must be valid URL
  label: string; // FREE-FORM: Display text (e.g., "@myusername", "My Website")
}

export interface EmailSignatureData {
  logoUrl: string | null; // User's logo URL (stored in Cloudinary)
  customText: string | null; // Optional signature text (e.g., "Thanks, John")
  socialLinks: SocialLink[]; // Array of social links
  defaultToGeeBeat: boolean; // Fallback to The Backstage branding if no custom signature
}

export class EmailSignature {
  constructor(
    public readonly logoUrl: string | null,
    public readonly customText: string | null,
    public readonly socialLinks: SocialLink[],
    public readonly defaultToGeeBeat: boolean = false
  ) {
    this.validate();
  }

  private validate(): void {
    // Logo URL validation
    if (this.logoUrl && !this.isValidUrl(this.logoUrl)) {
      throw new Error('Invalid logo URL');
    }

    // Social links validation
    for (const link of this.socialLinks) {
      // Platform name required
      if (!link.platform || link.platform.trim().length === 0) {
        throw new Error('Platform name is required');
      }
      if (link.platform.length > 50) {
        throw new Error('Platform name too long (max 50 characters)');
      }

      // URL validation
      if (!this.isValidUrl(link.url)) {
        throw new Error(`Invalid URL for ${link.platform}: ${link.url}`);
      }

      // Label required
      if (!link.label || link.label.trim().length === 0) {
        throw new Error(`Label required for ${link.platform}`);
      }
      if (link.label.length > 50) {
        throw new Error(
          `Label too long for ${link.platform} (max 50 characters)`
        );
      }
    }

    // Max 6 social links (UX best practice)
    if (this.socialLinks.length > 6) {
      throw new Error('Maximum 6 social links allowed');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Factory method for default The Backstage signature
  static createGeeBeatDefault(): EmailSignature {
    return new EmailSignature(
      'https://thebackstage.app/THEBACKSTAGE_LOGO_BLACK_HORIZONTAL.png',
      null,
      [
        {
          platform: 'website',
          url: 'https://thebackstage.app',
          label: 'thebackstage.app',
        },
        {
          platform: 'instagram',
          url: 'https://instagram.com/thebackstage.app',
          label: 'Instagram',
        },
        {
          platform: 'bandcamp',
          url: 'https://thebackstage.bandcamp.com',
          label: 'Bandcamp',
        },
      ],
      true
    );
  }

  // Factory method for empty signature (user will customize)
  static createEmpty(): EmailSignature {
    return new EmailSignature(null, null, [], false);
  }

  // Convert to plain object for JSON serialization
  toJSON(): EmailSignatureData {
    return {
      logoUrl: this.logoUrl,
      customText: this.customText,
      socialLinks: this.socialLinks,
      defaultToGeeBeat: this.defaultToGeeBeat,
    };
  }
}
