import base64
import datetime
import json
import os
import random
import time

import spotipy
from celery.result import AsyncResult
from django.http import (HttpResponse, HttpResponseNotFound,
                         HttpResponseRedirect)
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

from pages.models import Listening
from pages.tasks import top_albums_genres_songs
from src.analysis import (ListeningInformation, StreamingHistory,
                          analyse_listening)
from wrappedify.settings import BASE_DIR

# Initialising Spotipy variables
client_id = os.environ.get('client_id')
client_secret = os.environ.get('client_secret')


# Homepage
@ensure_csrf_cookie  # To set timezone
def home_view(request):
    # Creating a Spotify client to generate random album artwork
    ccm = spotipy.SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    sp = spotipy.Spotify(client_credentials_manager=ccm)

    covers = set()

    # while loop to avoid duplicate covers
    while len(covers) != 6:
        # Retrieve an arbitrary album from the "Today's Top Hits" playlist
        album = sp.playlist(
            playlist_id="37i9dQZF1DXcBWIGoYBM5M"
        )['tracks']['items'][random.randint(0, 49)]['track']['album']

        covers.add((album['images'][0]['url'], album['external_urls']['spotify']))

    # If the user has already uploaded data for processing, then redirect accordingly, else go the get started page
    if request.session.get('data'):
        if request.session.get('data').get('state') == "Processing":
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


# Get Started page detailing steps to retrieve Spotify data
@ensure_csrf_cookie  # To set timezone
def start_view(request):
    # As above, redirect accordingly if the user has already uploaded data
    if request.session.get('data') and request.session.get('data').get('state') == "Processing":
        return HttpResponseRedirect('/processing/')
    elif request.session.get('data') and request.session.get('data').get('state') == "Processed":
        return HttpResponseRedirect('/your-data/')

    # Do light analysis once user uploads appropriate files
    if request.method == "POST":
        files = request.FILES.getlist('listening-files')

        # Sorting the files by their number
        files.sort(key=lambda a: int(a.name[16:-5]))

        sh = StreamingHistory(files, request.session.get("timezone"))
        li = ListeningInformation(sh)

        if len(li.data) < 5 or len([song for artist in li.data for song in li.data[artist][1]]) < 20:
            return HttpResponseRedirect('/insufficient-data/')

        analyse_listening(li, sh)

        # Saving listening objects to the database so they can be accessed in other views
        listening = Listening()

        # Last argument to help facilitate model cleanup from database
        listening.args = [sh, li, time.time()]
        listening.save()
        request.session['listening_id'] = listening.id
        request.session['data'] = { 'state': 'Unprocessed', 'id': '' }

        return HttpResponseRedirect('/processing/')

    return render(request, 'pages/start_view.html', {})


# Loading page as heavy analysis is run
def processing_view(request):
    # Redirect to the homepage if data has not been uploaded
    if not request.session.get('data'):
        return HttpResponseRedirect('/')

    if request.session.get('data').get('state') == "Processed":
        return HttpResponseRedirect('/your-data')

    # ONLY if data has been uploaded AND is unprocessed, begin heavy analysis, and set data state to 'Processing'
    if request.session.get('data').get('state') == "Unprocessed":
        r = top_albums_genres_songs.delay(request.session.get('listening_id'))
        request.session['data'].update({ 'state': 'Processing'})
        request.session['data'].update({ 'id': r.task_id })
        request.session.modified = True

    r = AsyncResult(request.session.get('data').get('id'))

    if r.successful():
        r.forget()
        request.session['data'].update({'state': 'Processed'})
        request.session.modified = True
        return HttpResponseRedirect('/your-data')

    return render(request, 'pages/processing_view.html', {
        'socket': f"{os.environ.get('SOCKET_URL', 'ws://localhost:8000/')}task/progress/{request.session.get('data').get('id')}/"
        })


# Ajax view for setting the user's timezone
def set_timezone(request):
    # If it's not an AJAX POST request, redirect
    if request.META.get('HTTP_X_REQUESTED_WITH') != 'XMLHttpRequest' or request.method != "POST":
        return HttpResponseRedirect('/')

    # Only set the timezone once (to avoid updates in data display view)
    if not request.session.get('timezone'):
        request.session['timezone'] = request.POST.get('timezone')

    return HttpResponse("Okay")


# Page displaying all the analysed data
def data_view(request):
    # If data has not been processed, redirect to the homepage
    if not request.session.get('data'):
        return HttpResponseRedirect('/')

    if request.session.get('data').get('state') != 'Processed':
        r = AsyncResult(request.session.get('data').get('id'))

        if r.successful():
            r.forget()
            request.session['data'].update({'state': 'Processed'})
            request.session.modified = True
        else:
            return HttpResponseRedirect('/')

    # Retrieving listening information from the database and creating a OAuth object
    sh = Listening.objects.get(id__exact=request.session.get('listening_id')).args[0]
    li = Listening.objects.get(id__exact=request.session.get('listening_id')).args[1]
    spauth = spotipy.SpotifyOAuth(client_id=client_id, client_secret=client_secret, redirect_uri=f"https://{request.get_host()}/sign-in/",
                                  scope="playlist-modify-public ugc-image-upload")

    auth_url = spauth.get_authorize_url()

    # If the top song's uris have not been retrieved, do so
    if not request.session.get('top_uris'):
        request.session['top_uris'] = [song[0][1]['uri'] for song in li.top_songs if type(song[0][1]) != str]

    # Pick two arbitrary songs from user's top songs
    songA = li.top_songs[random.randint(0, len(li.top_songs) - 1)][0]
    songB = li.top_songs[random.randint(0, len(li.top_songs) - 1)][0]

    # Initialise the activity data
    abt = sh.activity_by_time()  # Dictionary mapping hours to plays
    t_hour = datetime.time(max(abt, key=abt.get), 0)  # The most active hour, in 24HR format
    abm = sh.activity_by_month()  # Dictionary mapping months to listening time
    t_month = max(abm, key=abm.get) # The most active month
    t_month_str = datetime.date(2000, t_month, 1).strftime("%B")  # Nam of the most active month
    t_month_listening = (round(abm.get(t_month) / (1000 * 60)), 'minutes') \
        if round(abm.get(t_month) / (1000 * 60 * 60)) == 0 \
        else (round(abm.get(t_month) / (1000 * 60 * 60)), 'hours')  # Determining the listening time during the most
    # active month and appropriate time

    # Sending in all the necessary context (data)
    context = {
        "endDate": sh.end,
        "hoursListened": f'{sh.hours_listened:,}',
        "minutesListened": f'{sh.minutes_listened:,}',
        "songA": songA,
        "songB": songB,
        'top5': li.top_songs[:5],
        "top_songs": li.top_songs[5:],
        "auth_url": auth_url,
        "total_songs": f'{len([song for artist in li.data for song in li.data[artist][1]]):,}',
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


# Sign in view for adding playlist to user library
def sign_in(request):
    # If no code is provided (i.e., not an authorization redirect), redirect
    if request.method != "GET" or not request.GET.get('code'):
        return HttpResponseRedirect('/')

    # Create an OAuth object and retrieve token
    # Note, check_cache is set to false to allow for multiple users
    spauth = spotipy.SpotifyOAuth(client_id=client_id, client_secret=client_secret, redirect_uri=f"https://{request.get_host()}/sign-in/",
                                  scope="playlist-modify-public ugc-image-upload")
    token = spauth.get_access_token(code=request.GET.get('code'), check_cache=False)
    sp = spotipy.Spotify(auth=token['access_token'])

    # Create a playlist and add top songs
    playlist = sp.user_playlist_create(sp.me()['id'], "Your Top Songs of the Year",
                                       description="Your top songs this year, courtesy of Wrappedify.")
    sp.playlist_add_items(playlist_id=playlist['id'], items=request.session.get('top_uris'))

    # Encode standardized cover in base64 and set as user playlist cover
    with open(os.path.join(BASE_DIR, 'assets/images/playlistcover.jpg'), "rb") as img:
        im64 = base64.b64encode(img.read())
        sp.playlist_upload_cover_image(playlist_id=playlist['id'], image_b64=im64)

    return HttpResponseRedirect('/your-data/')


# View if insufficient listening information is provided
def insufficient_view(request):
    return render(request, 'pages/insufficient_view.html', {})


# 404 Handler
def not_found_view(request, exception):
    response = render(request, 'pages/not_found_view.html', {})
    response.status_code = 404
    return response


def about_view(request):
    return render(request, 'pages/about_view.html', {})


def sample_data(request):
    # As above, redirect accordingly if the user has already uploaded data
    if request.session.get('data') and request.session.get('data').get('state') == "Processing":
        return HttpResponseRedirect('/processing/')
    elif request.session.get('data') and request.session.get('data').get('state') == "Processed":
        return HttpResponseRedirect('/your-data/')

    # Opening sample files
    f = open(os.path.join(BASE_DIR, 'assets/sample/StreamingHistory0.json'), "r")
    files = [f]

    sh = StreamingHistory(files, request.session.get("timezone"))
    li = ListeningInformation(sh)
    analyse_listening(li, sh)

    # Saving listening objects to the database so they can be accessed in other views
    listening = Listening()

    # Last argument to help facilitate model cleanup from database
    listening.args = [sh, li, time.time()]
    listening.save()
    request.session['listening_id'] = listening.id
    request.session['data'] = { 'state': 'Unprocessed', 'id': '' }

    return HttpResponseRedirect('/processing/')
