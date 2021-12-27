from django.shortcuts import render
from .forms import UploadFileForm
import spotipy, random, os

# Create your views here.

client_id = os.environ.get('client_id')
client_secret = os.environ.get('client_secret')


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
    file_form = UploadFileForm()

    if request.method == "POST":
        file_form = UploadFileForm(request.POST, request.FILES)

        if file_form.is_valid():
            print(request.FILES)

    context = {'form': file_form}

    return render(request, 'pages/start_view.html', context)
