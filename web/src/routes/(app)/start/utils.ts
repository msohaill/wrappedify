import type { ListeningData, ListeningInformation, ListeningRecord } from '$lib/types';
import first from '$static/login.png';
import second from '$static/privacy.png';
import third from '$static/request.png';

export const steps = [
  {
    desc: 'To understand your listening, you must download your Spotify data. This guide walks you through step-by-step. First, log on to  <a class="decoration-dotted underline underline-offset-4" href="https://www.spotify.com/ca-en/account/" target="_blank" rel="noopener noreferrer">Spotify<a/>.',
    image: first,
    colours: ['white', 'blue'],
  },
  {
    desc: 'Scroll to <em>Security and privacy</em> and visit the <em>Privacy settings</em> page.',
    image: second,
    colours: ['white', 'purple'],
  },
  {
    desc: 'Scroll down towards the bottom of the page and request your <em>Account data</em>. Now, simply wait a few days to recieve an e-mail from Spotify containing a link to download your personal data.',
    image: third,
    colours: ['blue', 'purple'],
  },
  {
    desc: 'Once you have downloaded the ZIP file, unzip it and select all files following the naming format <em>StreamingHistory_music_#.json</em>. It is important that you select <em>all</em> and <em>only</em> those files that follow the specified naming convention.',
  },
];

export enum UploadError {
  None,
  IncorrectFiles,
  IncompleteFiles,
  TooLarge,
  InsufficientData,
  Unknown,
}

export const errorData: Record<UploadError, { title: string; message: string }> = {
  [UploadError.None]: { title: '', message: '' },
  [UploadError.IncorrectFiles]: {
    title: 'Invalid files selected.',
    message:
      'Some of the uploaded files do not follow the specified naming format (<em>StreamingHistory_music_#.json</em>).<br><br>Please try again and make sure to select <em>only</em> files in your Spotify personal data folder that follow the specified naming convention.',
  },
  [UploadError.IncompleteFiles]: {
    title: 'Please select all files.',
    message:
      'There are missing streaming history files.<br><br>Please try again and make sure to select <em>all</em> files in your Spotify personal data folder that follow the specified naming convention.',
  },
  [UploadError.TooLarge]: {
    title: 'Request too large.',
    message:
      'You request cannot be process as your files are too large. If you would still like to try out Wrappedify, try uploading fewer files.<br><br>Again, we are sorry for not being able to analyze your listening.',
  },
  [UploadError.InsufficientData]: {
    title: 'Insufficient listening data.',
    message:
      'Unfortunately, your Spotify listening cannot be processed as you haven\'t listened enough this year. To receive meaningful insigts through Wrappedify, you must listen to at least <span class="keyword-pink">5 unique artists</span> and <span class="keyword-pink">30 different songs</span>. Further, each listen should be at least <span class="keyword-pink">30 seconds</span> in length. Sorry for now, but please come back as soon as you pick up your listening!',
  },
  [UploadError.Unknown]: {
    title: 'Unexpected error during file upload.',
    message:
      'Whoops, something unexpected happened while uploading your files. Please wait a bit and try again.',
  },
};

export const aggregateListening = (data: ListeningRecord[]): ListeningData => {
  return data.reduce((data, r) => {
    if (r.artistName === 'Unknown Artist') return data;

    if (!(r.artistName in data)) {
      data[r.artistName] = {};
    }
    if (!(r.trackName in data[r.artistName])) {
      data[r.artistName][r.trackName] = [];
    }

    data[r.artistName][r.trackName].push(r);
    return data;
  }, {} as ListeningData);
};
