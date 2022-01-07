from django.db import models
from picklefield.fields import PickledObjectField


# Using a PickleObjectField to be able to save my own Python objects to the database
class Listening(models.Model):
    args = PickledObjectField()
