from django.shortcuts import render
import spotipy, random

# Create your views here.
client_secret = '843c797b4a534deeaa1d6274e6697dca'
client_id = 'ecc3ee32f1254bd3b0f405cfc120f40f'


def home_view(request):
    ccm = spotipy.SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    sp = spotipy.Spotify(client_credentials_manager=ccm)

    covers = set()

    while len(covers) != 6:
        i = random.randint(0, 49)

        covers.add((sp.playlist(playlist_id="37i9dQZF1DXcBWIGoYBM5M")['tracks']['items'][i]['track']['album']
                   ['images'][0]['url'], sp.playlist(playlist_id="37i9dQZF1DXcBWIGoYBM5M")['tracks']['items'][i]
                                                     ['track']['album']['external_urls']['spotify']))

    context = {
        'covers': covers
    }

    return render(request, 'pages/home_view.html', context)


def start_view(request):
    if request.method == "POST":
        print("wow")
        print(request.FILES)
    return render(request, 'pages/start_view.html', {})
