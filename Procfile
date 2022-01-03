release: python manage.py migrate
web: gunicorn wrappedify.wsgi --log-file -
worker: celery -A wrappedify worker -l info