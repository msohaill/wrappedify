web: gunicorn wrappedify.wsgi --log-file -
worker: celery worker --app=tasks.app