from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from pages.models import Listening
from src.analysis import SpotifyAPI
from wrappedify.celery import app


async def closing_send(channel_layer, channel, message):
    await channel_layer.group_send(channel, message)
    await channel_layer.close_pools()


# The heavy analysis task
@app.task(bind=True)
def top_albums_genres_songs(self, listening_id) -> None:
    channel_layer = get_channel_layer()
    task_id = self.request.id

    # Retrieving listening information from the database
    listening = Listening.objects.get(id__exact=listening_id)
    listening_information = listening.args[1]

    # Initialising a SpotifyAPI client
    sAPI = SpotifyAPI()

    # Top artists and their top songs (for the user). Top songs and their artists
    tartists_and_songs = tuple((artist[0].lower(), artist[2].lower()) for artist in listening_information.top_artists)
    tsongs_and_artists = tuple((song[0][1].lower(), (song[0][0].lower())) for song in listening_information.top_songs)

    # Retrieving all artists (mapped to total plays) and songs
    all_artists = {artist: sum(tuple(listening_information.data[artist][1][song] for song in
                                     listening_information.data[artist][1])) for artist in listening_information.data}

    all_songs = {(artist, song, listening_information.data[artist][1][song]) for artist in listening_information.data
                 for song in listening_information.data[artist][1]}

    # Initialising progress counters for the celery task
    total = len(all_artists) + len(all_songs)
    counter = 0

    # Empty dictionary of genres and iterating through all artists
    genres = {}
    for artist_name in all_artists:

        # Getting the artist response from the API
        artist = sAPI.get_artist(artist_name)

        # If None was returned, increase progress and continue to next iteration
        if not artist:
            counter += 1
            async_to_sync(closing_send)(channel_layer, task_id, {
                'type': 'progress_update',
                'details': {
                    'status': 'Progress',
                    'percentage': counter / total
                    }
            })
            continue

        # Getting the artists characterizing genres
        a_genres = artist['genres']

        # For each genre in the artists genres, if it new, initialise a key for it in the overall genre dictionary
        for genre in a_genres:
            if genre not in genres:
                genres[genre] = 0

            # Add the artists plays to the genre
            genres[genre] += all_artists[artist_name]

        # If this is a top artist, overwrite the artist name in listening_information.top_artists with the API response
        if artist['name'].lower() in [a[0] for a in tartists_and_songs]:
            a = listening_information.top_artists[[a[0] for a in tartists_and_songs].index(artist['name'].lower())]
            a[0] = artist

        # Increase progress
        counter += 1
        async_to_sync(closing_send)(channel_layer, task_id, {
            'type': 'progress_update',
            'details': {
                'status': 'Progress',
                'percentage': counter / total
            }
        })

    # Determine the total and top genres
    listening_information.genres = len(genres)
    listening_information.top_genres = tuple(genre for genre in sorted(genres, key=genres.get, reverse=True)[:10])

    # Empty dictionary of albums and iterating through all songs
    albums = {}
    for artist, song, plays in all_songs:

        # Getting the track response from the API
        track = sAPI.get_track(song, artist)

        # If None was returned, increase the progress and continue to the next iteration
        if not track:
            counter += 1
            async_to_sync(closing_send)(channel_layer, task_id, {
                'type': 'progress_update',
                'details': {
                    'status': 'Progress',
                    'percentage': counter / total
                }
            })
            continue

        # Retrieve the track's album and create a key: (artist names separated by commas, album name)
        album = track['album']
        key = (", ".join([artist['name'] for artist in album['artists']]),) + (album['name'],)

        # If this key is not present in the albums, it is a new album and so initialise it in the album dictionary
        if key not in albums:
            albums[key] = [0, (None, 0), album]  # [number of plays, (top track, top track plays), album response]

        albums[key][0] += listening_information.data[artist][1][song]

        # If the track is more listened, update it as the top track of the album
        if plays > albums[key][1][1]:
            albums[key][1] = (track, plays)

        # If the track is a top track of a top artist, overwrite the track name with the track response
        if (artist.lower(), song.lower()) in tartists_and_songs:
            s = listening_information.top_artists[tartists_and_songs.index((artist.lower(), song.lower()))]
            s[2] = track

        # If the track is a top track, overwrite track name with the track response and adjust the artist accordingly
        if (song.lower(), artist.lower()) in tsongs_and_artists:
            song = listening_information.top_songs[tsongs_and_artists.index((song.lower(), artist.lower()))][0]
            song[1] = track
            song[0] = ", ".join([artist['name'] for artist in track['artists']])

        # Increase progress
        counter += 1
        async_to_sync(closing_send)(channel_layer, task_id, {
            'type': 'progress_update',
            'details': {
                'status': 'Progress',
                'percentage': counter / total
            }
        })

    # Determine the total and top albums
    listening_information.albums = len(albums)
    listening_information.top_albums = tuple((key[0], albums[key]) for key in
                                             sorted(albums, key=lambda a: albums.get(a)[0], reverse=True)[:10])

    # Determine the success of the heavy task and save the listening information to the database
    listening_information.api_success()
    listening.args[1] = listening_information
    listening.save()

    async_to_sync(closing_send)(channel_layer, task_id, {
        'type': 'progress_update',
        'details': {
            'status': 'Completed',
            'percentage': 1
        }
    })
