import SpotifyClient from '../../lib/spotify';
import { TOP_ALBUMS, TOP_ARTISTS, TOP_GENRES, TOP_GENRE_SONGS, TOP_TRACKS } from './constants';
import _data from './data/test.json';
import {
  AlbumDetail,
  ArtistDetail,
  GenreDetail,
  ListeningData,
  ListeningInformation,
  TrackDetail,
} from './types';

const listeningData: ListeningData = Object.fromEntries(
  Object.entries(_data).map(([artist, tracks]) => [
    artist,
    Object.fromEntries(
      Object.entries(tracks).map(([trackName, records]) => [
        trackName,
        records.map(r => ({ ...r, endTime: new Date(Date.parse(r.endTime)) })),
      ]),
    ),
  ]),
);

const preprocessData = (
  data: ListeningData,
): [ListeningInformation, Record<string, TrackDetail>, Record<string, ArtistDetail>] => {
  const info: ListeningInformation = {
    wrappedDate: new Date(0),
    total: {
      time: 0,
      tracks: 0,
      artists: 0,
      albums: 0,
      genres: 0,
    },
    top: {
      tracks: [],
      artists: [],
      albums: [],
      genres: [],
    },
    activity: {
      byHour: Array(24).fill(0),
      byMonth: Array(12).fill(0),
    },
  };

  const trackInfo: Record<string, TrackDetail> = {};
  const basicArtistInfo: Record<string, Omit<ArtistDetail, 'topSong'>> = {};

  for (const [artist, tracks] of Object.entries(data)) {
    const artistDetails = { name: artist, plays: 0, timeListened: 0 };
    basicArtistInfo[artist] = artistDetails;
    info.total.artists += 1;

    for (const [trackName, records] of Object.entries(tracks)) {
      const trackDetails = {
        name: trackName,
        plays: records.length,
        timeListened: 0,
        artists: [artist],
      };
      trackInfo[trackName + '-' + artist] = trackDetails;
      info.total.tracks += 1;

      for (const record of records) {
        trackDetails.timeListened += record.msPlayed;
        info.activity.byHour[record.endTime.getUTCHours()] += 1;
        info.activity.byMonth[record.endTime.getUTCMonth()] += record.msPlayed;
        info.wrappedDate = info.wrappedDate > record.endTime ? info.wrappedDate : record.endTime;
      }

      artistDetails.plays += records.length;
      artistDetails.timeListened += trackDetails.timeListened;
    }

    info.total.time += artistDetails.timeListened;
  }

  const artistInfo: Record<string, ArtistDetail> = Object.fromEntries(
    Object.entries(basicArtistInfo).map(([artistName, artistDetails]) => {
      const tracks = Object.keys(data[artistName]).map(
        trackName => trackInfo[trackName + '-' + artistName],
      );
      return [
        artistName,
        {
          ...artistDetails,
          topSong: tracks.reduce(
            (prevTop, cur) => (prevTop.plays > cur.plays ? prevTop : cur),
            tracks[0],
          ),
        },
      ];
    }),
  );

  info.top.artists = Object.values(artistInfo)
    .sort((a, b) => b.timeListened - a.timeListened)
    .slice(0, TOP_ARTISTS);
  info.top.tracks = Object.values(trackInfo)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TOP_TRACKS);

  return [info, trackInfo, artistInfo];
};

const analyzeArtistsGenres = async (
  info: ListeningInformation,
  artistInfo: Record<string, ArtistDetail>,
): Promise<void> => {
  const genreInfo = {} as Record<string, GenreDetail>;

  let i = 0;

  for (const artist of Object.values(artistInfo)) {
    const spotifyArtist = await SpotifyClient.getArtist(artist.name);

    if (!spotifyArtist || !spotifyArtist.genres) continue;

    artist.url = spotifyArtist.externalURL.spotify;
    if (spotifyArtist.images && spotifyArtist.images.length > 0)
      artist.coverUrl = spotifyArtist.images[0].url;

    for (const genre of spotifyArtist.genres) {
      if (!(genre in genreInfo))
        genreInfo[genre] = { name: genre, plays: 0, timeListened: 0, topArtists: [] };
      genreInfo[genre].plays += artist.plays;
      genreInfo[genre].timeListened += artist.timeListened;
      genreInfo[genre].topArtists.push(artist);
    }
    process.stderr.write(`${i++}\r`);
  }

  info.total.genres = Object.keys(genreInfo).length;
  info.top.genres = Object.values(genreInfo)
    .sort((a, b) => b.plays - a.plays)
    .map(g => ({
      ...g,
      topArtists: g.topArtists.sort((a, b) => b.plays - a.plays).slice(0, TOP_GENRE_SONGS),
    }))
    .slice(0, TOP_GENRES);
};

const analyzeSongsAlbums = async (
  info: ListeningInformation,
  trackInfo: Record<string, TrackDetail>,
): Promise<void> => {
  const albumInfo: Record<string, AlbumDetail> = {};
  let i = 0;

  for (const track of Object.values(trackInfo)) {
    const spotifyTrack = await SpotifyClient.getTrack(track.name, track.artists[0]);

    if (!spotifyTrack) continue;

    track.url = spotifyTrack.externalURL.spotify;
    track.artists = spotifyTrack.artists.map(a => a.name);
    track.previewLink = spotifyTrack.previewURL;
    track.trackUri = spotifyTrack.uri;

    if (!spotifyTrack.album) continue;

    track.coverUrl = spotifyTrack.album.images[0].url;

    const albumKey =
      spotifyTrack.album.name + '-' + spotifyTrack.album.artists.map(a => a.name).join(',');

    if (!(albumKey in albumInfo))
      albumInfo[albumKey] = {
        name: spotifyTrack.album.name,
        plays: 0,
        timeListened: 0,
        artists: spotifyTrack.album.artists.map(a => a.name),
        topSong: track,
        url: spotifyTrack.album.externalURL.spotify,
        coverUrl: spotifyTrack.album.images[0].url,
      };

    albumInfo[albumKey].plays += track.plays;
    albumInfo[albumKey].timeListened += track.timeListened;

    if (albumInfo[albumKey].topSong.plays < track.plays) albumInfo[albumKey].topSong = track;
    process.stderr.write(`${i++}\r`);
  }

  info.total.albums = Object.keys(albumInfo).length;
  info.top.albums = Object.values(albumInfo)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TOP_ALBUMS);
};

const main = async () => {
  const [info, trackInfo, artistInfo] = preprocessData(listeningData);
  await SpotifyClient.connect();
  await analyzeArtistsGenres(info, artistInfo);
  await analyzeSongsAlbums(info, trackInfo);
  console.log(JSON.stringify(info));
};

main();
