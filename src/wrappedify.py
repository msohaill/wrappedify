from analysis import SpotifyAPI, ListeningInformation, StreamingHistory, analyse_listening


def write_stats(sAPI: SpotifyAPI, li: ListeningInformation, sh: StreamingHistory) -> None:
    analyse_listening(sAPI, li, sh)

    wrapped_str = f"Here is your Spotify listening information for the year (up to " \
                  f"{sh.data[-1]['endTime'].strftime('%b %-d')})\n\n"
    wrapped_str += f"• You've listened to {sh.minutes_listened:,} minutes of music ({sh.hours_listened:,} hours)\n\n"
    wrapped_str += f"• You listened to {len(li.data):,} different artists this year! Here are some of your favorites\n\n"

    for i, (artist, time) in enumerate(li.top_artists):
        wrapped_str += f"\t{i + 1}.\t{artist}, {round(time / (1000 * 60 * 60)):,} hours\n"

    wrapped_str += f"\n• You jammed to {len([(artist, song) for artist in li.data for song in li.data[artist][1]]):,} " \
                   f"unique tracks this year. We've created a playlist of your favorites\n\n"

    for i, ((artist, song), plays) in enumerate(li.top_songs):
        wrapped_str += f"\t{i + 1}.\t{song} - {artist}, {plays:,} plays\n"

    wrapped_str += f"\n• Of the {li.albums:,} different albums you've come across this year, " \
                   f"here are your own top 10\n\n"

    for i, (album, artists, plays) in enumerate(li.top_albums):
        wrapped_str += f"\t{i + 1}.\t{album} - {', '.join(artists)}, {plays:,} plays\n"

    wrapped_str += f"\n• Nice taste! You explored {li.genres:,} genres this year. " \
                   f"Here are the ones you loved the most\n\n"

    for i, genre in enumerate(li.top_genres):
        wrapped_str += f"\t{i + 1}.\t{genre}\n"

    wrapped_file = open("wrappedifyOut/Wrapped Information.txt", "w", encoding="utf-8")
    wrapped_file.write(wrapped_str)
    wrapped_file.close()


def wrapped(files: list, tz: str) -> None:

    sh = StreamingHistory(files, tz)
    li = ListeningInformation(sh)
    sAPI = SpotifyAPI()

