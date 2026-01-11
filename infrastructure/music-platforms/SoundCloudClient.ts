import { XMLParser } from 'fast-xml-parser';
import { IMusicPlatformClient } from '@/domain/providers/IMusicPlatformClient';

interface RSSFeed {
  rss: {
    channel: {
      title: string;
      item?: RSSItem | RSSItem[];
    };
  };
}

interface RSSItem {
  guid: string;
  link: string;
  title: string;
  pubDate: string;
  'dc:creator'?: string;
  'itunes:author'?: string;
  'itunes:duration'?: string;
  'itunes:image'?: { '@_href': string };
  'itunes:summary'?: string;
  description?: string;
  enclosure?: { '@_url': string; '@_type': string };
}

export class SoundCloudClient implements IMusicPlatformClient {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  async fetchTracks(userId: string): Promise<any[]> {
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${userId}/sounds.rss`;
    console.log('[SoundCloudClient] Fetching from URL:', rssUrl);

    try {
      const response = await fetch(rssUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const feed = this.parser.parse(xmlText) as RSSFeed;

      const channel = feed.rss?.channel;
      if (!channel) {
        throw new Error('Invalid RSS feed structure');
      }

      console.log('[SoundCloudClient] Feed parsed:', {
        title: channel.title,
        itemCount: 0
      });

      // Handle both single item and array of items
      let items: RSSItem[] = [];
      if (channel.item) {
        items = Array.isArray(channel.item) ? channel.item : [channel.item];
      }

      console.log('[SoundCloudClient] Feed parsed:', {
        title: channel.title,
        itemCount: items.length
      });

      if (items.length === 0) {
        console.log('[SoundCloudClient] No tracks found in feed');
        return [];
      }

      console.log('[SoundCloudClient] First track:', items[0]?.title);

      // Parse tracks to normalize structure
      const parsedTracks = items.map(item => this.parseTrackData(item));
      return parsedTracks;
    } catch (error) {
      console.error('[SoundCloudClient] Error fetching tracks:', error);
      throw new Error(`Failed to fetch SoundCloud tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  parseTrackData(rawData: any): any {
    // Normalize guid - can be string or object with #text property
    const normalizeGuid = (guid: any): string => {
      if (typeof guid === 'string') return guid;
      if (guid && typeof guid === 'object' && '#text' in guid) return guid['#text'];
      return '';
    };

    return {
      guid: normalizeGuid(rawData.guid),
      link: rawData.link,
      title: rawData.title,
      pubDate: rawData.pubDate,
      creator: rawData['dc:creator'],
      author: rawData['itunes:author'],
      contentSnippet: rawData['itunes:summary'] || rawData.description,
      content: rawData.description || rawData['itunes:summary'],
      itunes: {
        duration: rawData['itunes:duration'],
        image: rawData['itunes:image']?.['@_href'],
      },
      enclosure: rawData.enclosure ? {
        url: rawData.enclosure['@_url'],
        type: rawData.enclosure['@_type'],
      } : undefined
    };
  }
}
