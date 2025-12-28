/**
 * SpotifyClient
 *
 * Client for fetching music releases from Spotify Web API.
 * Uses Client Credentials Flow (no user OAuth required for public data).
 *
 * Clean Architecture: Infrastructure layer
 * SOLID: Single Responsibility (Spotify API communication)
 *
 * API Documentation: https://developer.spotify.com/documentation/web-api
 */

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  release_date: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

export interface SpotifyArtistAlbumsResponse {
  items: SpotifyAlbum[];
  total: number;
  limit: number;
  offset: number;
}

export class SpotifyClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiBaseUrl = 'https://api.spotify.com/v1';
  private readonly tokenUrl = 'https://accounts.spotify.com/api/token';

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET'
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get access token using Client Credentials Flow
   * Caches token until expiration
   *
   * @returns Access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Request new token
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get Spotify access token: ${response.status} ${JSON.stringify(error)}`
      );
    }

    const data = await response.json();

    // Cache token (expires in 3600s, we refresh 5min early)
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

    return this.accessToken;
  }

  /**
   * Fetch artist's albums and singles
   *
   * @param artistId - Spotify artist ID
   * @param limit - Max number of items to fetch (default: 10)
   * @returns Array of albums/singles
   */
  async fetchArtistAlbums(
    artistId: string,
    limit: number = 10
  ): Promise<SpotifyAlbum[]> {
    const accessToken = await this.getAccessToken();

    // Fetch albums and singles (exclude 'appears_on' and 'compilation')
    const params = new URLSearchParams({
      include_groups: 'album,single',
      limit: limit.toString(),
      market: 'US', // Required for some releases
    });

    const response = await fetch(
      `${this.apiBaseUrl}/artists/${artistId}/albums?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch Spotify albums: ${response.status} ${JSON.stringify(error)}`
      );
    }

    const data: SpotifyArtistAlbumsResponse = await response.json();
    return data.items;
  }

  /**
   * Get artist information
   *
   * @param artistId - Spotify artist ID
   * @returns Artist data
   */
  async getArtist(artistId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.apiBaseUrl}/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch Spotify artist: ${response.status} ${JSON.stringify(error)}`
      );
    }

    return response.json();
  }

  /**
   * Parse Spotify album to standard track format
   *
   * @param album - Spotify album data
   * @returns Parsed track data
   */
  parseAlbumData(album: SpotifyAlbum): {
    id: string;
    title: string;
    url: string;
    publishedAt: Date;
    coverImage: string | null;
    albumType: string;
    totalTracks: number;
  } {
    return {
      id: album.id,
      title: album.name,
      url: album.external_urls.spotify,
      publishedAt: new Date(album.release_date),
      coverImage: album.images?.[0]?.url || null,
      albumType: album.album_type,
      totalTracks: album.total_tracks,
    };
  }
}
