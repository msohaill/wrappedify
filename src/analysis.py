import datetime
import json
import os
import spotipy
import zoneinfo


# Class to contain and analyse raw streaming information from Spotify data
class StreamingHistory:

    def __init__(self, files: list, tz: str) -> None:

        self.year = 2021  # datetime.date.today().year
        self.end = None  # String representation of last listening day
        self.minutes_listened = 0
        self.hours_listened = 0
        self.data = ()

        for file in files:
            streaming_json = file.read()
            file.close()
            self.data += tuple(json.loads(streaming_json))

        for song in self.data:
            time_i = datetime.datetime.strptime(song['endTime'] + ' +00:00', '%Y-%m-%d %H:%M %z').astimezone(
                zoneinfo.ZoneInfo(tz))
            time = datetime.datetime(time_i.year, time_i.month, time_i.day, time_i.hour, time_i.minute)

            song['endTime'] = time

        self.data = tuple(song for song in self.data if
                          song['endTime'].year == self.year and song['msPlayed'] > 30000)

    def activity_by_month(self) -> dict:
        months = {month: 0 for month in range(1, 13)}

        for song in self.data:
            months[song['endTime'].month] += song['msPlayed']

        return months

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
        self.top_songs = []

        for song in streaming_history.data:

            artist, time, duration, track = song['artistName'], song['endTime'], song['msPlayed'], song['trackName']

            if artist not in self.data:
                self.data[artist] = [0, {}]

            if track not in self.data[artist][1]:
                self.data[artist][1][track] = 0

            self.data[artist][1][track] += 1
            self.data[artist][0] += duration

    def get_top_artists(self) -> None:
        # Format of each artist: [artist name, time spent listening, top song name, plays of top song,
        # [artist API success, song API success]]
        for artist in sorted(self.data, key=lambda a: self.data[a][0], reverse=True)[:20]:
            top_song = max(self.data[artist][1], key=lambda a: self.data[artist][1][a])
            self.top_artists += ([artist, self.data[artist][0], top_song, self.data[artist][1][top_song], [1, 1]],)

    def get_top_songs(self) -> None:
        # Format of each song: ([artist name, song name], plays, [API success])
        all_songs = {(artist, song): self.data[artist][1][song] for artist in self.data for song in
                     self.data[artist][1]}

        self.top_songs = tuple((list(artist), all_songs[artist], [1])
                               for artist in sorted(all_songs, key=all_songs.get, reverse=True)[:100])

    def clean_artist_time(self):
        for artist in self.top_artists:
            time = artist[1]
            if round(time / (60 * 60 * 1000)) == 0:
                artist[1] = (f'{round(time / (60 * 1000)):,}', 'minutes')
            else:
                artist[1] = (f'{round(time / (60 * 60 * 1000)):,}',
                             'hours' if round(time / (60 * 60 * 1000)) != 1 else 'hour')

    def api_success(self):
        for artist in self.top_artists:
            if type(artist[0]) == str:
                artist[4][0] = 0

            if type(artist[2]) == str:
                artist[4][1] = 0

        for song in self.top_songs:
            if type(song[0][1]) == str:
                song[2][0] = 0


class SpotifyAPI:
    client_id = os.environ.get('client_id')
    client_secret = os.environ.get('client_secret')

    def __init__(self):
        ccm = spotipy.SpotifyClientCredentials(client_id=SpotifyAPI.client_id, client_secret=SpotifyAPI.client_secret)
        self.sp = spotipy.Spotify(client_credentials_manager=ccm, requests_timeout=10)

    def get_track(self, track_name: str, artist_name: str):
        ntrack_name, nartist_name = track_name.replace("'", ""), artist_name.replace("'", "")

        tracks = self.sp.search(q=f'artist:{nartist_name} track:{ntrack_name}', type='track', limit=50)['tracks'][
            'items']

        for t in tracks:
            if t['name'].lower() == track_name.lower() \
                    and artist_name.lower() in [artist['name'].lower() for artist in t['artists']]:
                return t

        return None

    def get_artist(self, artist_name: str):
        nartist_name = artist_name.replace("'", "")

        artists = self.sp.search(q=f'artist:{nartist_name}', type='artist', limit=50)['artists']['items']

        for a in artists:
            if a['name'].lower() == artist_name.lower():
                return a

        return None

    def get_features(self, track_id: str):

        while True:
            try:
                features = self.sp.audio_features([track_id])[0]
                return features
            except:
                continue


def analyse_listening(listening_information: ListeningInformation, sh: StreamingHistory) -> None:
    listening_information.get_top_artists()
    listening_information.get_top_songs()
    listening_information.clean_artist_time()
    sh.retrieve_data()
