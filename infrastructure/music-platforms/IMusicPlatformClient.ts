export interface IMusicPlatformClient {
  fetchTracks(artistIdentifier: string): Promise<any[]>;
  parseTrackData(rawData: any): any;
}
