from django.db import models
from picklefield.fields import PickledObjectField


# Create your models here.
class Listening(models.Model):
    args = PickledObjectField()