export class MusicTrack {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly url: string,
    public readonly coverImage: string | null,
    public readonly publishedAt: Date,
    public readonly platform: 'soundcloud' | 'spotify' | 'bandcamp',
    public readonly artist?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || !this.title || !this.url) {
      throw new Error('MusicTrack requires id, title, and url');
    }

    if (this.title.length > 200) {
      throw new Error('Track title cannot exceed 200 characters');
    }

    if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
      throw new Error('Track url must be a valid HTTP(S) URL');
    }
  }

  isNewSince(date: Date): boolean {
    return this.publishedAt > date;
  }

  static fromSoundCloudRSS(data: any): MusicTrack {
    const trackId = data.guid || data.link || '';
    const coverImage = data.itunes?.image || data.enclosure?.url || null;
    const publishedAt = data.pubDate ? new Date(data.pubDate) : new Date();

    return new MusicTrack(
      trackId,
      data.title || 'Sin título',
      data.link || '',
      coverImage,
      publishedAt,
      'soundcloud',
      data.creator || data.author
    );
  }

  static fromSpotify(data: {
    id: string;
    title: string;
    url: string;
    publishedAt: Date;
    coverImage: string | null;
    albumType?: string;
    totalTracks?: number;
  }): MusicTrack {
    return new MusicTrack(
      data.id,
      data.title,
      data.url,
      data.coverImage,
      data.publishedAt,
      'spotify'
    );
  }
}
