import datetime
import json
import os
import spotipy
import zoneinfo


# Class to contain and analyse raw streaming information from Spotify data
class StreamingHistory:

    def __init__(self, files: list, tz: str) -> None:

        self.year = datetime.date.today().year
        self.end = None  # String representation of last listening day
        self.minutes_listened = 0
        self.hours_listened = 0
        self.data = ()  # Same as JSON file's format, except times are converted to locale appropriate datetime objects

        # Iterating through the provided files and adding data
        for file in files:
            streaming_json = file.read()
            file.close()
            self.data += tuple(json.loads(streaming_json))

        # Converting the times to locale appropriate datetime objects
        for song in self.data:
            time_i = datetime.datetime.strptime(song['endTime'] + ' +00:00', '%Y-%m-%d %H:%M %z').astimezone(
                zoneinfo.ZoneInfo(tz))
            time = datetime.datetime(time_i.year, time_i.month, time_i.day, time_i.hour, time_i.minute)

            song['endTime'] = time

        # Final filtering where minimum listening and current year is accounted for
        self.data = tuple(song for song in self.data if
                          song['endTime'].year == self.year and song['msPlayed'] > 30000)

    # Retrieves activity by month
    def activity_by_month(self) -> dict:
        # Dictionary mapping month to listening time
        months = {month: 0 for month in range(1, 13)}

        for song in self.data:
            months[song['endTime'].month] += song['msPlayed']

        return months

    # Retrieves activity by the hour of day
    def activity_by_time(self) -> dict:
        # Dictionary mapping hour of the day to song PLAYS (not listening time)
        times = {hour: 0 for hour in range(24)}

        for song in self.data:
            times[song['endTime'].hour] += 1

        return times

    # Retrieving instance data (last listening day and minutes/hours listened)
    def retrieve_data(self) -> None:
        self.end = self.data[-1]['endTime'].strftime('%b %-d')
        self.minutes_listened = round(sum([s['msPlayed'] for s in self.data]) / (1000 * 60))
        self.hours_listened = round(self.minutes_listened / 60)


# Class to contain listening statistics, categorized by artist
class ListeningInformation:

    def __init__(self, streaming_history: StreamingHistory) -> None:
        self.data = {}  # Maps artist names to a list of listening time and a dictionary of songs mapped to plays
        self.albums = 0  # Total albums listened to
        self.top_albums = ()
        self.genres = 0  # Total genres listened to
        self.top_genres = ()
        self.top_artists = ()
        self.top_songs = []

        # Iterating through the songs in the streaming history
        for song in streaming_history.data:

            artist, time, duration, track = song['artistName'], song['endTime'], song['msPlayed'], song['trackName']

            # If the artist is new, initialise a list for them
            if artist not in self.data:
                self.data[artist] = [0, {}]

            # If the track is new, initialise a key in the song dictionary
            if track not in self.data[artist][1]:
                self.data[artist][1][track] = 0

            # Add a play for the track and listening time for the artist
            self.data[artist][1][track] += 1
            self.data[artist][0] += duration

    # Retrieve the top artists from the data
    def get_top_artists(self) -> None:
        # Format of each artist: [artist name, time spent listening, top song name, plays of top song,
        # [artist API success, song API success]]
        for artist in sorted(self.data, key=lambda a: self.data[a][0], reverse=True)[:20]:
            top_song = max(self.data[artist][1], key=lambda a: self.data[artist][1][a])
            self.top_artists += ([artist, self.data[artist][0], top_song, self.data[artist][1][top_song], [1, 1]],)

    # Retrieve the top songs from the data
    def get_top_songs(self) -> None:
        # Format of each song: ([artist name, song name], plays, [API success])
        all_songs = {(artist, song): self.data[artist][1][song] for artist in self.data for song in
                     self.data[artist][1]}

        self.top_songs = tuple((list(artist), all_songs[artist], [1])
                               for artist in sorted(all_songs, key=all_songs.get, reverse=True)[:100])

    # Setting the hours OR minutes listened to depending on magnitude
    def clean_artist_time(self):
        for artist in self.top_artists:
            time = artist[1]
            if round(time / (60 * 60 * 1000)) == 0:
                artist[1] = (f'{round(time / (60 * 1000)):,}', 'minutes')
            else:
                artist[1] = (f'{round(time / (60 * 60 * 1000)):,}',
                             'hours' if round(time / (60 * 60 * 1000)) != 1 else 'hour')

    # Setting the API success variables depending on result of heavy analysis in tasks.py
    def api_success(self):
        for artist in self.top_artists:
            # If it's a string, the heavy task did not return anything relevant from the API call (otherwise a dict)
            if type(artist[0]) == str:
                artist[4][0] = 0

            if type(artist[2]) == str:
                artist[4][1] = 0

        for song in self.top_songs:
            if type(song[0][1]) == str:
                song[2][0] = 0


# A class for interacting with Spotify's API using spotipy
class SpotifyAPI:
    # Getting application variables from the environment
    client_id = os.environ.get('client_id')
    client_secret = os.environ.get('client_secret')

    def __init__(self):
        # Initialising a Spotify client
        ccm = spotipy.SpotifyClientCredentials(client_id=SpotifyAPI.client_id, client_secret=SpotifyAPI.client_secret)
        self.sp = spotipy.Spotify(client_credentials_manager=ccm, requests_timeout=10)

    # Get a track from Spotify's API using the search query
    def get_track(self, track_name: str, artist_name: str):
        # New track and artist names, removing all 's due to a query glitch that doesn't show results with 's present
        ntrack_name, nartist_name = track_name.replace("'", ""), artist_name.replace("'", "")

        # Getting 50 results with the appropriate query
        tracks = self.sp.search(q=f'artist:{nartist_name[:24]} track:{ntrack_name[:64]}',
                                type='track', limit=50)['tracks']['items']

        # Iterating through the retrieved tracks and determining if any track has the required track name and artist
        # Lowercase to avoid errors with name switches (i.e., updated API data but old streaming data)
        for t in tracks:
            if t['name'].lower() == track_name.lower() \
                    and artist_name.lower() in [artist['name'].lower() for artist in t['artists']]:
                return t

        # Return None if no match is found
        return None

    # Get an artist from Spotify's API using the appropriate search query
    def get_artist(self, artist_name: str):
        # As before, cleaning the artist name
        nartist_name = artist_name.replace("'", "")

        # Getting 50 results with the appropriate query
        artists = self.sp.search(q=f'artist:{nartist_name[:92]}', type='artist', limit=50)['artists']['items']

        # Iterating through the retrieved artists and determining if any are a match
        for a in artists:
            if a['name'].lower() == artist_name.lower():
                return a

        # Return None if no match is found
        return None

    # Getting features for a track provided an ID
    # Not used in the current implementation, but useful in case I want to add more stats
    def get_features(self, track_id: str):

        while True:
            try:
                features = self.sp.audio_features([track_id])[0]
                return features
            except:
                continue


# A comprehensive function that performs all light analysis tasks
def analyse_listening(listening_information: ListeningInformation, sh: StreamingHistory) -> None:
    listening_information.get_top_artists()
    listening_information.get_top_songs()
    listening_information.clean_artist_time()
    sh.retrieve_data()
