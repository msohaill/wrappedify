import AsyncLock from 'async-lock';
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
): [ListeningInformation, Record<string, TrackDetail>] => {
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

  for (const [artist, tracks] of Object.entries(data)) {
    for (const [trackName, records] of Object.entries(tracks)) {
      const trackDetails = {
        name: trackName,
        plays: records.length,
        timeListened: 0,
        artists: [artist],
      };
      trackInfo[trackName + '-' + artist] = trackDetails;

      for (const record of records) {
        trackDetails.timeListened += record.msPlayed;
        info.activity.byHour[record.endTime.getUTCHours()] += record.msPlayed;
        info.activity.byMonth[record.endTime.getUTCMonth()] += record.msPlayed;
        info.wrappedDate = info.wrappedDate > record.endTime ? info.wrappedDate : record.endTime;
      }

      info.total.time += trackDetails.timeListened;
    }
  }

  info.total.tracks = Object.keys(trackInfo).length;
  info.top.tracks = Object.values(trackInfo)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TOP_TRACKS);

  return [info, trackInfo];
};

const analyze = async (
  info: ListeningInformation,
  trackInfo: Record<string, TrackDetail>,
  job: Job,
): Promise<void> => {
  const lock = new AsyncLock();

  const albumInfo: Record<string, AlbumDetail> = {};
  const artistInfo: Record<string, ArtistDetail> = {};
  const genreInfo: Record<string, GenreDetail> = {};

  const total = (job.progress as { total: number; completed: number }).total;
  let completed = 0;

  await Promise.all(
    Object.values(trackInfo)
      .map(async track => {
        const spotifyTrack = await SpotifyClient.getTrack(track.name, track.artists[0]);

        if (!spotifyTrack) {
          return;
        }

        track.url = spotifyTrack.external_urls.spotify;
        track.artists = spotifyTrack.artists.map(a => a.name);
        track.previewLink = spotifyTrack.preview_url ?? undefined;
        track.trackUri = spotifyTrack.uri;

        // Analyze artist details
        await lock.acquire('artists', async () => {
          // Init and fetch artist details from API
          const newArtists = spotifyTrack.artists
            .filter(artist => !(artist.id in artistInfo))
            .map(artist => artist.id);

          if (newArtists.length === 0) return;

          (await SpotifyClient.getArtistsById(newArtists)).forEach(artist => {
            const artistDetails = {
              name: artist.name,
              plays: 0,
              timeListened: 0,
              topSong: track,
              url: artist.external_urls.spotify,
              coverUrl: artist.images.length > 0 ? artist.images[0].url : undefined,
            };

            artistInfo[artist.id] = artistDetails;

            for (const genre of artist.genres) {
              if (!(genre in genreInfo)) {
                genreInfo[genre] = { name: genre, plays: 0, timeListened: 0, topArtists: [] };
              }
              genreInfo[genre].topArtists.push(artistDetails);
            }
          });
        });

        // Update artist details
        spotifyTrack.artists.forEach(async artist => {
          const artistKey = artist.id;
          artistInfo[artistKey].plays += track.plays;
          artistInfo[artistKey].timeListened += track.timeListened;

          await lock.acquire(artistKey, () => {
            if (artistInfo[artistKey].topSong.plays < track.plays) {
              artistInfo[artistKey].topSong = track;
            }
          });
        });

        if (!spotifyTrack.album) {
          return;
        }

        track.coverUrl = spotifyTrack.album.images[0].url;

        const albumKey = spotifyTrack.album.id;

        lock.acquire('albums', () => {
          if (!(albumKey in albumInfo)) {
            albumInfo[albumKey] = {
              name: spotifyTrack.album.name,
              plays: 0,
              timeListened: 0,
              artists: spotifyTrack.album.artists.map(a => a.name),
              topSong: track,
              url: spotifyTrack.album.external_urls.spotify,
              coverUrl: spotifyTrack.album.images[0].url,
            };
          }
        });

        albumInfo[albumKey].plays += track.plays;
        albumInfo[albumKey].timeListened += track.timeListened;

        lock.acquire(albumKey, () => {
          if (albumInfo[albumKey].topSong.plays < track.plays) {
            albumInfo[albumKey].topSong = track;
          }
        });
      })
      .map(task =>
        task.then(async () => {
          await job.updateProgress({ total, completed: completed++ });
        }),
      ),
  );

  info.total.artists = Object.keys(artistInfo).length;
  info.total.albums = Object.keys(albumInfo).length;
  info.total.genres = Object.keys(genreInfo).length;

  info.top.artists = Object.values(artistInfo)
    .sort((a, b) => b.timeListened - a.timeListened)
    .slice(0, TOP_ARTISTS);
  info.top.albums = Object.values(albumInfo)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TOP_ALBUMS);

  // Process listening for genres
  for (const genre of Object.values(genreInfo)) {
    genre.plays = genre.topArtists.reduce((sum, artist) => sum + artist.plays, 0);
    genre.timeListened = genre.topArtists.reduce((sum, artist) => sum + artist.timeListened, 0);
    genre.topArtists = genre.topArtists.sort((a, b) => b.plays - a.plays).slice(0, TOP_GENRE_SONGS);
  }

  info.top.genres = Object.values(genreInfo)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TOP_GENRES);
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

  const [info, trackInfo] = preprocessData(data);
  const total = info.total.tracks;

  await job.updateProgress({ total, completed: 0 });
  await analyze(info, trackInfo, job);
  await job.updateProgress({ total, completed: total });

  return info;
};

export const taskQueue = new Queue('task-queue', {
  connection: { ...env.redis },
  defaultJobOptions: {
    attempts: 1,
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
