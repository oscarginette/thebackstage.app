import { SoundCloudClient } from './SoundCloudClient';
import { SoundCloudRepository } from './SoundCloudRepository';

// Singleton instances
export const soundCloudClient = new SoundCloudClient();
export const soundCloudRepository = new SoundCloudRepository(soundCloudClient);
