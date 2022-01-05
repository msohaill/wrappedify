from django.shortcuts import render
from django.http import HttpResponseRedirect, HttpResponse
import spotipy, os, json, random, base64, datetime
from .tasks import top_albums_genres_songs
from celery.result import AsyncResult
from src.analysis import StreamingHistory, ListeningInformation, analyse_listening
from .models import Listening
from wrappedify.settings import BASE_DIR

from django.views.decorators.csrf import ensure_csrf_cookie

client_id = os.environ.get('client_id')
client_secret = os.environ.get('client_secret')
redirect_uri = os.environ.get('redirect_uri')


@ensure_csrf_cookie
def home_view(request):
    ccm = spotipy.SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    sp = spotipy.Spotify(client_credentials_manager=ccm)

    covers = set()

    while len(covers) != 6:
        album = sp.playlist(playlist_id="37i9dQZF1DXcBWIGoYBM5M")['tracks']['items'][random.randint(0, 49)]['track'][
            'album']
        covers.add((album['images'][0]['url'], album['external_urls']['spotify']))

    if request.session.get('data_state'):
        if request.session.get('data_state') == "Processing":
            button_link = "/processing/"
        else:
            button_link = "/your-data/"
    else:
        button_link = "/get-started/"

    context = {
        'covers': covers,
        'button_link': button_link
    }

    return render(request, 'pages/home_view.html', context)


@ensure_csrf_cookie
def start_view(request):
    if request.session.get('data_state') == "Processing":
        return HttpResponseRedirect('/processing/')
    elif request.session.get('data_state') == "Processed":
        return HttpResponseRedirect('/your-data/')

    if request.method == "POST":
        files = request.FILES.getlist('listening-files')
        files.sort(key=lambda a: int(a.name[16:-5]))

        sh = StreamingHistory(files, request.session.get("timezone"))
        li = ListeningInformation(sh)
        analyse_listening(li, sh)

        listening = Listening()
        listening.args = [sh, li]
        listening.save()
        request.session['listening_id'] = listening.id
        request.session['data_state'] = "Unprocessed"

        return HttpResponseRedirect('/processing/')

    return render(request, 'pages/start_view.html', {})


def processing_view(request):
    if not request.session.get('data_state'):
        return HttpResponseRedirect('/')

    if request.session.get('data_state') == "Unprocessed":
        r = top_albums_genres_songs.delay(request.session.get('listening_id'))
        request.session['data_state'] = "Processing"
        request.session['task_id'] = r.task_id

    return render(request, 'pages/processing_view.html', {})


def set_timezone(request):
    if request.META.get('HTTP_X_REQUESTED_WITH') != 'XMLHttpRequest' or request.method != "POST":
        return HttpResponseRedirect('/')

    request.session['timezone'] = request.POST.get('timezone')
    request.session.modified = True
    return HttpResponse("Okay")


def get_progress(request):
    if not request.session.get('task_id') or request.method != "GET":
        return HttpResponseRedirect('/')

    r = AsyncResult(request.session.get('task_id'))
    response = {'state': r.state, 'details': r.info, 'success': False}

    if r.successful():
        r.forget()
        response['success'] = True
        request.session['data_state'] = "Processed"

    return HttpResponse(json.dumps(response), content_type="application/json")


def data_view(request):
    if not request.session.get('data_state'):
        return HttpResponseRedirect('/')

    sh = Listening.objects.get(id__exact=request.session.get('listening_id')).args[0]
    li = Listening.objects.get(id__exact=request.session.get('listening_id')).args[1]
    spauth = spotipy.SpotifyOAuth(client_id=client_id, client_secret=client_secret, redirect_uri=redirect_uri,
                                  scope="playlist-modify-public ugc-image-upload")

    auth_url = spauth.get_authorize_url()

    request.session['top_uris'] = [song[0][1]['uri'] for song in li.top_songs if type(song[0][1]) != str]

    songA = li.top_songs[random.randint(0, len(li.top_songs) - 1)][0]
    songB = li.top_songs[random.randint(0, len(li.top_songs) - 1)][0]

    abt = sh.activity_by_time()
    t_hour = datetime.time(max(abt, key=abt.get), 0)
    abm = sh.activity_by_month()
    t_month = max(abm, key=abm.get)
    t_month_str = datetime.date(2000, t_month, 1).strftime("%B")
    t_month_listening = (round(abm.get(t_month) / (1000 * 60)), 'minutes') \
        if round(abm.get(t_month) / (1000 * 60 * 60)) == 0 \
        else (round(abm.get(t_month) / (1000 * 60 * 60)), 'hours')

    context = {
        "endDate": sh.end,
        "hoursListened": f'{sh.hours_listened:,}',
        "minutesListened": f'{sh.minutes_listened:,}',
        "songA": songA,
        "songB": songB,
        'top5': li.top_songs[:5],
        "top_songs": li.top_songs[5:],
        "auth_url": auth_url,
        "total_songs": f'{len([(artist, song) for artist in li.data for song in li.data[artist][1]]):,}',
        "total_artists": f'{len(li.data):,}',
        "total_albums": f'{li.albums:,}',
        'total_genres': f'{li.genres:,}',
        'top_artists': li.top_artists,
        'top_albums': li.top_albums,
        'top_genres': [{"genre": genre} for genre in li.top_genres],
        'activity_bt': [{"time": f'{hour:02}', "value": abt.get(hour)} for hour in abt],
        'most_active_hour': (t_hour.strftime('%-I:%M'), t_hour.strftime('%p').lower()),
        'activity_bm': [{"month": f'{month:02}', "value": abm.get(month)} for month in abm],
        'most_active_month': (t_month_str, t_month_listening),
        'year': sh.year,
        'timezone': request.session.get('timezone').replace("_", " ")
    }

    return render(request, 'pages/data_view.html', context)


def sign_in(request):
    if request.method != "GET" or not request.GET.get('code'):
        HttpResponseRedirect('/')

    spauth = spotipy.SpotifyOAuth(client_id=client_id, client_secret=client_secret, redirect_uri=redirect_uri,
                                  scope="playlist-modify-public ugc-image-upload")
    token = spauth.get_access_token(code=request.GET.get('code'), check_cache=False)
    sp = spotipy.Spotify(auth=token['access_token'])

    playlist = sp.user_playlist_create(sp.me()['id'], "Your Top Songs of the Year",
                                       description="Your top songs this year, courtesy of Wrappedify.")
    sp.playlist_add_items(playlist_id=playlist['id'], items=request.session.get('top_uris'))

    with open(os.path.join(BASE_DIR, 'assets/images/playlistcover.jpg'), "rb") as img:
        im64 = base64.b64encode(img.read())
        sp.playlist_upload_cover_image(playlist_id=playlist['id'], image_b64=im64)

    return HttpResponseRedirect('/your-data/')
