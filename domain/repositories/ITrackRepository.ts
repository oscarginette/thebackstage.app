export interface Track {
  id?: number;
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  coverImage?: string | null;
  createdAt?: string;
}

export interface ITrackRepository {
  existsByTrackId(trackId: string): Promise<boolean>;
  save(track: Track): Promise<void>;
  findByTrackId(trackId: string): Promise<Track | null>;
  findAll(): Promise<Track[]>;
  getAllTrackIds(): Promise<Set<string>>;
}
