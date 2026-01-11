/**
 * Demo Entity
 *
 * Domain entity representing a demo (unreleased track) that can be sent to DJs.
 * Follows Clean Architecture principles with zero infrastructure dependencies.
 */

/**
 * Input for creating a new demo
 */
export interface CreateDemoInput {
  id: string;
  userId: string;
  title: string;
  artistName: string;
  genre?: string | null;
  bpm?: number | null;
  key?: string | null;
  fileUrl: string;
  artworkUrl?: string | null;
  waveformUrl?: string | null;
  durationSeconds?: number | null;
  releaseDate?: Date | null;
  notes?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Allowed file storage domains for security validation
 */
const ALLOWED_FILE_DOMAINS = [
  's3.amazonaws.com',
  'r2.cloudflarestorage.com',
  'storage.googleapis.com',
] as const;

/**
 * Musical key validation pattern (A-G, optional sharp/flat, optional minor)
 * Examples: "C", "C#", "Db", "Am", "F#m"
 */
const MUSICAL_KEY_PATTERN = /^[A-G](#|b)?m?$/;

/**
 * BPM (Beats Per Minute) constraints
 */
const MIN_BPM = 60;
const MAX_BPM = 200;

/**
 * Field length constraints
 */
const MAX_TITLE_LENGTH = 500;
const MAX_ARTIST_NAME_LENGTH = 255;
const MAX_GENRE_LENGTH = 100;

/**
 * Maximum years in the past for release date (prevents data entry errors)
 */
const MAX_RELEASE_DATE_YEARS_PAST = 50;

/**
 * Demo Entity
 *
 * Represents an unreleased track that can be sent to DJs for feedback/support.
 * Immutable entity with validation in constructor.
 */
export class Demo {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly artistName: string,
    public readonly genre: string | null,
    public readonly bpm: number | null,
    public readonly key: string | null,
    public readonly fileUrl: string,
    public readonly artworkUrl: string | null,
    public readonly waveformUrl: string | null,
    public readonly durationSeconds: number | null,
    public readonly releaseDate: Date | null,
    public readonly notes: string | null,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  /**
   * Validates all demo fields
   * @throws Error with descriptive message if validation fails
   */
  private validate(): void {
    // Title validation
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Demo title cannot be empty');
    }
    if (this.title.length > MAX_TITLE_LENGTH) {
      throw new Error(`Demo title cannot exceed ${MAX_TITLE_LENGTH} characters`);
    }

    // Artist name validation
    if (!this.artistName || this.artistName.trim().length === 0) {
      throw new Error('Artist name cannot be empty');
    }
    if (this.artistName.length > MAX_ARTIST_NAME_LENGTH) {
      throw new Error(`Artist name cannot exceed ${MAX_ARTIST_NAME_LENGTH} characters`);
    }

    // Genre validation (optional)
    if (this.genre !== null && this.genre.length > MAX_GENRE_LENGTH) {
      throw new Error(`Genre cannot exceed ${MAX_GENRE_LENGTH} characters`);
    }

    // BPM validation (optional but must be in valid range)
    if (this.bpm !== null) {
      if (this.bpm < MIN_BPM || this.bpm > MAX_BPM) {
        throw new Error(`BPM must be between ${MIN_BPM} and ${MAX_BPM}`);
      }
    }

    // Musical key validation (optional but must match pattern)
    if (this.key !== null && !MUSICAL_KEY_PATTERN.test(this.key)) {
      throw new Error(
        'Invalid musical key format. Must be A-G with optional # or b, and optional m for minor (e.g., "C", "C#", "Am", "F#m")'
      );
    }

    // File URL validation (required and must be from allowed domain)
    if (!this.fileUrl || this.fileUrl.trim().length === 0) {
      throw new Error('File URL cannot be empty');
    }
    this.validateFileUrl(this.fileUrl);

    // Release date validation (cannot be too far in the past)
    if (this.releaseDate !== null) {
      const maxPastDate = new Date();
      maxPastDate.setFullYear(maxPastDate.getFullYear() - MAX_RELEASE_DATE_YEARS_PAST);

      if (this.releaseDate < maxPastDate) {
        throw new Error(
          `Release date cannot be more than ${MAX_RELEASE_DATE_YEARS_PAST} years in the past`
        );
      }
    }

    // Duration validation (must be positive if provided)
    if (this.durationSeconds !== null && this.durationSeconds <= 0) {
      throw new Error('Duration must be greater than 0 seconds');
    }
  }

  /**
   * Validates that file URL is from an allowed storage domain
   * @throws Error if URL is not from allowed domain
   */
  private validateFileUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      const isAllowed = ALLOWED_FILE_DOMAINS.some((domain) =>
        hostname.endsWith(domain)
      );

      if (!isAllowed) {
        throw new Error(
          `File URL must be from allowed domains: ${ALLOWED_FILE_DOMAINS.join(', ')}`
        );
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid file URL format');
      }
      throw error;
    }
  }

  /**
   * Factory method to create a new demo
   *
   * @param input - Demo creation input
   * @returns New Demo instance
   * @throws Error if validation fails
   */
  static create(input: CreateDemoInput): Demo {
    return new Demo(
      input.id,
      input.userId,
      input.title,
      input.artistName,
      input.genre ?? null,
      input.bpm ?? null,
      input.key ?? null,
      input.fileUrl,
      input.artworkUrl ?? null,
      input.waveformUrl ?? null,
      input.durationSeconds ?? null,
      input.releaseDate ?? null,
      input.notes ?? null,
      input.active ?? true,
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date()
    );
  }

  /**
   * Factory method to reconstruct demo from database row
   *
   * @param row - Database row
   * @returns Demo instance
   * @throws Error if validation fails
   */
  static fromDatabase(row: {
    id: string;
    user_id: string;
    title: string;
    artist_name: string;
    genre: string | null;
    bpm: number | null;
    key: string | null;
    file_url: string;
    artwork_url: string | null;
    waveform_url: string | null;
    duration_seconds: number | null;
    release_date: Date | null;
    notes: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  }): Demo {
    return new Demo(
      row.id,
      row.user_id,
      row.title,
      row.artist_name,
      row.genre,
      row.bpm,
      row.key,
      row.file_url,
      row.artwork_url,
      row.waveform_url,
      row.duration_seconds,
      row.release_date,
      row.notes,
      row.active,
      row.created_at,
      row.updated_at
    );
  }

  /**
   * Checks if demo has all required fields to be sent to DJs
   *
   * @returns true if demo is ready to send
   */
  isReadyToSend(): boolean {
    return (
      this.active &&
      this.title.trim().length > 0 &&
      this.artistName.trim().length > 0 &&
      this.fileUrl.trim().length > 0
    );
  }

  /**
   * Gets display info for the demo
   *
   * Format: "Artist Name - Title (Genre, BPM BPM)" or simplified versions
   * Examples:
   * - "John Doe - My Track (Techno, 128 BPM)"
   * - "John Doe - My Track (Techno)"
   * - "John Doe - My Track"
   *
   * @returns Formatted display string
   */
  getDisplayInfo(): string {
    const baseInfo = `${this.artistName} - ${this.title}`;

    const details: string[] = [];

    if (this.genre) {
      details.push(this.genre);
    }

    if (this.bpm) {
      details.push(`${this.bpm} BPM`);
    }

    if (details.length > 0) {
      return `${baseInfo} (${details.join(', ')})`;
    }

    return baseInfo;
  }
}
