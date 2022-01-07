from django.core.management.base import BaseCommand
from pages.models import Listening
import time


# Command to help with clearing unnecessary Listening objects in the database
class Command(BaseCommand):

    def handle(self, *args, **options):
        listening_objects = Listening.objects.all()

        # If the object is more than 2 weeks old, delete it
        for listening in listening_objects:
            if time.time() - listening.args[2] > 1209600:
                listening.delete()
