import Parser from 'rss-parser';
import { IMusicPlatformClient } from './IMusicPlatformClient';

export class SoundCloudClient implements IMusicPlatformClient {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async fetchTracks(userId: string): Promise<any[]> {
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${userId}/sounds.rss`;
    console.log('[SoundCloudClient] Fetching from URL:', rssUrl);

    try {
      const feed = await this.parser.parseURL(rssUrl);
      console.log('[SoundCloudClient] Feed parsed:', {
        title: feed.title,
        itemCount: feed.items?.length || 0
      });

      if (!feed.items || feed.items.length === 0) {
        console.log('[SoundCloudClient] No tracks found in feed');
        return [];
      }

      console.log('[SoundCloudClient] First track:', feed.items[0]?.title);
      return feed.items;
    } catch (error) {
      console.error('[SoundCloudClient] Error fetching tracks:', error);
      throw new Error(`Failed to fetch SoundCloud tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  parseTrackData(rawData: any): any {
    return {
      guid: rawData.guid,
      link: rawData.link,
      title: rawData.title,
      pubDate: rawData.pubDate,
      creator: rawData.creator,
      author: rawData.author,
      itunes: rawData.itunes,
      enclosure: rawData.enclosure
    };
  }
}
