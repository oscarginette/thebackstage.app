import { SoundCloudClient } from './SoundCloudClient';
import { SoundCloudRepository } from './SoundCloudRepository';
import { SpotifyClient } from './SpotifyClient';
import { SpotifyRepository } from './SpotifyRepository';

// Singleton instances
export const soundCloudClient = new SoundCloudClient();
export const soundCloudRepository = new SoundCloudRepository(soundCloudClient);

export const spotifyClient = new SpotifyClient();
export const spotifyRepository = new SpotifyRepository(spotifyClient);
