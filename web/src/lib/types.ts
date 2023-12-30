export type ListeningRecord = {
  artistName: string;
  endTime: Date;
  msPlayed: number;
  trackName: string;
};

export type ListeningData = Record<string, Record<string, ListeningRecord[]>>;

export type TrackDetail = {
  name: string;
  plays: number;
  timeListened: number;
  artists: string[];
  url?: string;
  coverUrl?: string;
  previewLink?: string | null;
  trackUri?: string;
};

export type ArtistDetail = {
  name: string;
  plays: number;
  timeListened: number;
  topSong: TrackDetail;
  url?: string;
  coverUrl?: string;
};

export type AlbumDetail = {
  name: string;
  plays: number;
  timeListened: number;
  artists: string[];
  topSong: TrackDetail;
  url: string;
  coverUrl: string;
};

export type GenreDetail = {
  name: string;
  plays: number;
  timeListened: number;
  topArtists: ArtistDetail[];
};

export type ListeningInformation = {
  wrappedDate: Date;
  total: {
    time: number;
    tracks: number;
    artists: number;
    albums: number;
    genres: number;
  };
  top: {
    tracks: TrackDetail[];
    artists: ArtistDetail[];
    albums: AlbumDetail[];
    genres: GenreDetail[];
  };
  activity: {
    byHour: number[];
    byMonth: number[];
  };
};

export enum DataTab {
  TopSongs = 'Your Top Songs.',
  TopArtistsAlbums = 'Artists, Albums, & More.',
  Activity = 'Your Activity.',
}
