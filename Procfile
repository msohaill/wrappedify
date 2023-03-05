web: python manage.py collectstatic --noinput && python manage.py migrate && gunicorn wrappedify.asgi:application -k uvicorn.workers.UvicornWorker
