import datetime
import json
import os
import spotipy
from tzlocal import get_localzone


class StreamingHistory:

    def __init__(self, path: str = '.') -> None:

        self.current_year = datetime.date.today().year
        self.end = None
        self.minutes_listened = 0
        self.hours_listened = 0

        files = [file for file in os.listdir(path) if file[:16] + file[-5:] == 'StreamingHistory.json']
        files.sort(key=lambda a: int(a[16:-5]))

        if not files:
            raise FileNotFoundError('The directory does not contain listening information')

        self.data = ()

        for file in files:
            streaming_file = open(os.path.join(path, file), 'r', encoding='utf-8')
            streaming_json = streaming_file.read()
            streaming_file.close()
            self.data += tuple(json.loads(streaming_json))

        for song in self.data:
            time_i = datetime.datetime.strptime(song['endTime'] + ' +00:00', '%Y-%m-%d %H:%M %z').astimezone(
                get_localzone())
            time = datetime.datetime(time_i.year, time_i.month, time_i.day, time_i.hour, time_i.minute)

            song['endTime'] = time

        self.data = tuple(song for song in self.data if
                          song['endTime'].year == self.current_year and song['msPlayed'] > 30000)

    def activity_by_date(self) -> dict:
        dates = {month: [0, 0] for month in range(1, 13)}

        for song in self.data:
            dates[song['endTime'].month][0] += 1
            dates[song['endTime'].month][1] += song['msPlayed']

        return dates

    def activity_by_time(self) -> dict:
        times = {hour: 0 for hour in range(24)}

        for song in self.data:
            times[song['endTime'].hour] += 1

        return times

    def retrieve_data(self) -> None:
        self.end = self.data[-1]['endTime'].strftime('%b %-d')
        self.minutes_listened = round(sum([s['msPlayed'] for s in self.data]) / (1000 * 60))
        self.hours_listened = round(self.minutes_listened / 60)


class ListeningInformation:

    def __init__(self, streaming_history: StreamingHistory) -> None:
        self.data = {}
        self.albums = 0
        self.top_albums = ()
        self.genres = 0
        self.top_genres = ()
        self.top_artists = ()
        self.top_songs = ()

        for song in streaming_history.data:

            artist, time, duration, track = song['artistName'], song['endTime'], song['msPlayed'], song['trackName']

            if artist not in self.data:
                self.data[artist] = [0, {}]

            if track not in self.data[artist][1]:
                self.data[artist][1][track] = 0

            self.data[artist][1][track] += 1
            self.data[artist][0] += duration

    def get_top_artists(self) -> None:
        self.top_artists = tuple((artist, self.data[artist][0]) for artist in
                                 sorted(self.data, key=lambda a: self.data[a][0], reverse=True)[:20])

    def get_top_songs(self) -> None:
        all_songs = {(artist, song): self.data[artist][1][song] for artist in self.data for song in
                     self.data[artist][1]}

        self.top_songs = tuple((artist, all_songs[artist]) for artist in sorted(all_songs,
                                                                                key=all_songs.get, reverse=True)[:100])


class SpotifyAPI:
    # Add your own
    client_id = ''
    client_secret = ''
    redirect_uri = 'http://localhost:7777/callback'
    scope = 'user-read-recently-played'

    def __init__(self, username):
        self.username = username
        self.authorization = spotipy.oauth2.SpotifyOAuth(username=username,
                                                         scope=SpotifyAPI.scope,
                                                         client_id=SpotifyAPI.client_id,
                                                         client_secret=SpotifyAPI.client_secret,
                                                         redirect_uri=SpotifyAPI.redirect_uri)
        self.token = self.authorization.get_access_token()

    def check_token(self):
        if spotipy.SpotifyOAuth.is_token_expired(self.token):
            self.token = self.authorization.refresh_access_token(self.token['refresh_token'])

    def get_track(self, track_name: str, artist_name: str):
        self.check_token()
        sp = spotipy.Spotify(auth=self.token['access_token'])

        while True:
            try:
                return sp.track(
                    sp.search(q=f'artist:{artist_name} track:{track_name}', type='track')['tracks']['items'][0]['id'])
            except IndexError:
                return None
            except:
                continue

    def get_artist(self, artist_name: str):
        self.check_token()
        sp = spotipy.Spotify(auth=self.token['access_token'])

        while True:
            try:
                return sp.artist(sp.search(q=f'artist:{artist_name}', type='artist')['artists']['items'][0]['id'])
            except IndexError:
                return None
            except:
                continue

    def get_features(self, track_id: str):
        self.check_token()
        sp = spotipy.Spotify(auth=self.token['access_token'])

        while True:
            try:
                features = sp.audio_features([track_id])[0]
                return features
            except:
                continue

    def top_albums(self, listening_information: ListeningInformation) -> None:
        all_songs = {(artist, song) for artist in listening_information.data for song in
                     listening_information.data[artist][1]}

        albums = {}

        counter = 0
        for artist, song in all_songs:

            track = self.get_track(song, artist)

            if not track:
                counter += 1
                print(counter, 'out of', len(all_songs), 'completed', end='\r')
                continue

            album = track['album']['name']
            key = tuple(artist['name'] for artist in track['album']['artists']) + (album,)

            if key not in albums:
                albums[key] = 0

            albums[key] += listening_information.data[artist][1][song]

            counter += 1
            print(counter, 'out of', len(all_songs), 'completed', end='\r')

        print()

        listening_information.albums = len(albums)
        listening_information.top_albums = tuple((key[-1], key[:-1], albums[key]) for key in
                                                 sorted(albums, key=albums.get, reverse=True)[:10])

    def top_genres(self, listening_information: ListeningInformation) -> None:
        all_artists = {artist: sum(tuple(listening_information.data[artist][1][song] for song in
                                         listening_information.data[artist][1])) for artist in
                       listening_information.data}

        genres = {}

        counter = 0
        for artist in all_artists:

            try:
                a_genres = self.get_artist(artist)['genres']
            except TypeError:
                counter += 1
                print(counter, 'out of', len(all_artists), 'completed', end='\r')
                continue

            for genre in a_genres:
                if genre not in genres:
                    genres[genre] = 0

                genres[genre] += all_artists[artist]

            counter += 1
            print(counter, 'out of', len(all_artists), 'completed', end='\r')

        print()
        listening_information.genres = len(genres)
        listening_information.top_genres = tuple(genre for genre in sorted(genres, key=genres.get, reverse=True)[:10])


def analyse_listening(sAPI: SpotifyAPI, listening_information: ListeningInformation, sh: StreamingHistory) -> None:
    listening_information.get_top_artists()
    listening_information.get_top_songs()
    sAPI.top_albums(listening_information)
    sAPI.top_genres(listening_information)
    sh.retrieve_data()
