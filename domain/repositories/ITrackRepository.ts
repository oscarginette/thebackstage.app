export interface Track {
  id?: number;
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  coverImage?: string | null;
  createdAt?: string;
  userId?: number;
}

export interface ITrackRepository {
  existsByTrackId(trackId: string, userId: number): Promise<boolean>;
  save(track: Track, userId: number): Promise<void>;
  findByTrackId(trackId: string, userId: number): Promise<Track | null>;
  findAll(userId: number): Promise<Track[]>;
  getAllTrackIds(userId: number): Promise<Set<string>>;
}
