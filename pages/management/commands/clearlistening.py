from django.core.management.base import BaseCommand
from pages.models import Listening
import time


class Command(BaseCommand):

    def handle(self, *args, **options):
        listening_objects = Listening.objects.all()

        for listening in listening_objects:
            if time.time() - listening.args[2] > 1209600:
                listening.delete()
