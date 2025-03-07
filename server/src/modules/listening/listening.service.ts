import { Job, Queue, Worker } from 'bullmq';
import { Socket } from 'socket.io';
import env from '../../env.js';
import logger from '../../lib/logger/index.js';
import SpotifyClient from '../../lib/spotify/index.js';
import { TOP_ALBUMS, TOP_ARTISTS, TOP_GENRES, TOP_GENRE_SONGS, TOP_TRACKS } from './constants.js';
import {
  AlbumDetail,
  ArtistDetail,
  GenreDetail,
  ListeningData,
  ListeningInformation,
  TrackDetail,
} from './types.js';

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
  job: Job,
): Promise<void> => {
  const genreInfo = {} as Record<string, GenreDetail>;
  let completed = (job.progress as { total: number; completed: number }).completed;

  await Promise.all(
    Object.values(artistInfo).map(async artist => {
      const spotifyArtist = await SpotifyClient.getArtist(artist.name);

      if (!spotifyArtist || !spotifyArtist.genres) {
        const previousProgress = job.progress as { total: number; completed: number };
        await job.updateProgress({ ...previousProgress, completed: completed++ });
        return;
      }

      artist.url = spotifyArtist.external_urls.spotify;
      if (spotifyArtist.images && spotifyArtist.images.length > 0)
        artist.coverUrl = spotifyArtist.images[0].url;

      for (const genre of spotifyArtist.genres) {
        if (!(genre in genreInfo))
          genreInfo[genre] = { name: genre, plays: 0, timeListened: 0, topArtists: [] };
        genreInfo[genre].plays += artist.plays;
        genreInfo[genre].timeListened += artist.timeListened;
        genreInfo[genre].topArtists.push(artist);
      }

      const previousProgress = job.progress as { total: number; completed: number };
      await job.updateProgress({ ...previousProgress, completed: completed++ });
    }),
  );

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
  job: Job,
): Promise<void> => {
  const albumInfo: Record<string, AlbumDetail> = {};
  let completed = (job.progress as { total: number; completed: number }).completed;

  await Promise.all(
    Object.values(trackInfo).map(async track => {
      const spotifyTrack = await SpotifyClient.getTrack(track.name, track.artists[0]);

      if (!spotifyTrack) {
        const previousProgress = job.progress as { total: number; completed: number };
        await job.updateProgress({ ...previousProgress, completed: completed++ });
        return;
      }

      track.url = spotifyTrack.external_urls.spotify;
      track.artists = spotifyTrack.artists.map(a => a.name);
      track.previewLink = spotifyTrack.preview_url ?? undefined;
      track.trackUri = spotifyTrack.uri;

      if (!spotifyTrack.album) {
        const previousProgress = job.progress as { total: number; completed: number };
        await job.updateProgress({ ...previousProgress, completed: completed++ });
        return;
      }

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
          url: spotifyTrack.album.external_urls.spotify,
          coverUrl: spotifyTrack.album.images[0].url,
        };

      albumInfo[albumKey].plays += track.plays;
      albumInfo[albumKey].timeListened += track.timeListened;

      if (albumInfo[albumKey].topSong.plays < track.plays) albumInfo[albumKey].topSong = track;

      const previousProgress = job.progress as { total: number; completed: number };
      await job.updateProgress({ ...previousProgress, completed: previousProgress.completed + 1 });
    }),
  );

  info.total.albums = Object.keys(albumInfo).length;
  info.top.albums = Object.values(albumInfo)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TOP_ALBUMS);
};

const processListening = async (job: Job) => {
  const data: ListeningData = Object.fromEntries(
    Object.entries(job.data).map(([artist, tracks]: [string, any]) => [
      artist,
      Object.fromEntries(
        Object.entries(tracks).map(([trackName, records]: [string, any]) => [
          trackName,
          records.map((r: any) => ({ ...r, endTime: new Date(Date.parse(r.endTime)) })),
        ]),
      ),
    ]),
  );

  const [info, trackInfo, artistInfo] = preprocessData(data);
  const total = Object.keys(trackInfo).length + Object.keys(artistInfo).length;
  job.updateProgress({
    total,
    completed: 0,
  });
  await analyzeArtistsGenres(info, artistInfo, job);
  await analyzeSongsAlbums(info, trackInfo, job);

  await job.updateProgress({ total, completed: total });
  return info;
};

export const taskQueue = new Queue('task-queue', {
  connection: { ...env.redis },
  defaultJobOptions: {
    attempts: 5,
    backoff: 2000,
  },
});

const taskWorker = new Worker('task-queue', processListening, {
  concurrency: 8,
  connection: { ...env.redis },
  removeOnComplete: { age: 2 * 3600 },
  removeOnFail: { age: 2 * 3600 },
  autorun: true,
});

export const addListeningTask = async (data: any): Promise<string | undefined> => {
  return (await taskQueue.add('listening-task', data)).id;
};

export const handleSocket = (socket: Socket) => {
  socket.on('requestProgress', async (jobId: string) => {
    const job = await taskQueue.getJob(jobId);

    if (job) {
      if (!(await job.isFailed())) {
        socket.emit('progressUpdate', job.progress);
      } else {
        socket.emit('taskFailed');
        logger.error('Error with job ' + jobId, job.stacktrace);
      }
    } else {
      logger.error('No job for ID ' + jobId);
    }
  });
};
