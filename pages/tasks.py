from wrappedify.celery import app
from src.analysis import SpotifyAPI
from .models import Listening


@app.task(bind=True)
def top_albums_genres_songs(self, listening_id) -> None:

    listening = Listening.objects.get(id__exact=listening_id)
    listening_information = listening.args[1]
    sAPI = SpotifyAPI()
    tartists_and_songs = tuple((artist[0].lower(), artist[2].lower()) for artist in listening_information.top_artists)
    tsongs_and_artists = tuple((song[0][1].lower(), (song[0][0].lower())) for song in listening_information.top_songs)

    all_artists = {artist: sum(tuple(listening_information.data[artist][1][song] for song in
                                     listening_information.data[artist][1])) for artist in listening_information.data}

    all_songs = {(artist, song, listening_information.data[artist][1][song]) for artist in listening_information.data
                 for song in listening_information.data[artist][1]}

    total = len(all_artists) + len(all_songs)
    counter = 0

    genres = {}
    for artist_name in all_artists:

        artist = sAPI.get_artist(artist_name)

        if not artist:
            counter += 1
            self.update_state(state="PROGRESS",
                              meta={'current': counter, "total": total, "percentage": counter / total})
            continue

        a_genres = artist['genres']

        for genre in a_genres:
            if genre not in genres:
                genres[genre] = 0

            genres[genre] += all_artists[artist_name]

        if artist['name'].lower() in [a[0] for a in tartists_and_songs]:
            a = listening_information.top_artists[[a[0] for a in tartists_and_songs].index(artist['name'].lower())]
            a[0] = artist

        counter += 1
        self.update_state(state="PROGRESS", meta={'current': counter, "total": total, "percentage": counter / total})

    listening_information.genres = len(genres)
    listening_information.top_genres = tuple(genre for genre in sorted(genres, key=genres.get, reverse=True)[:10])

    albums = {}
    for artist, song, plays in all_songs:
        track = sAPI.get_track(song, artist)

        if not track:
            counter += 1
            self.update_state(state="PROGRESS",
                              meta={'current': counter, "total": total, "percentage": counter / total})
            continue

        album = track['album']
        key = (", ".join([artist['name'] for artist in album['artists']]),) + (album['name'],)

        if key not in albums:
            albums[key] = [0, (None, 0), album]

        albums[key][0] += listening_information.data[artist][1][song]

        if plays > albums[key][1][1]:
            albums[key][1] = (track, plays)

        if (artist.lower(), song.lower()) in tartists_and_songs:
            s = listening_information.top_artists[tartists_and_songs.index((artist.lower(), song.lower()))]
            s[2] = track

        if (song.lower(), artist.lower()) in tsongs_and_artists:
            song = listening_information.top_songs[tsongs_and_artists.index((song.lower(), artist.lower()))][0]
            song[1] = track
            song[0] = ", ".join([artist['name'] for artist in track['artists']])

        counter += 1
        self.update_state(state="PROGRESS", meta={'current': counter, "total": total, "percentage": counter / total})

    listening_information.albums = len(albums)
    listening_information.top_albums = tuple(albums[key] for key in
                                             sorted(albums, key=lambda a: albums.get(a)[0], reverse=True)[:10])

    listening_information.api_success()
    listening.args[1] = listening_information
    listening.save()
