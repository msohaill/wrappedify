"""wrappedify URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from pages.views import home_view, start_view, processing_view, set_timezone, data_view, sign_in, \
    insufficient_view, about_view, sample_data

from wrappedify.consumers import TaskProgressConsumer

# Customising the 404 view
handler404 = 'pages.views.not_found_view'

urlpatterns = [
    # Main user-interactive views
    path('', home_view),
    path('get-started/', start_view),
    path('processing/', processing_view),
    path('your-data/', data_view),
    path('about/', about_view),

    # Other views that are just called
    path('ajax/timezone/', set_timezone),
    path('sign-in/', sign_in),
    path('sample-data/', sample_data),

    # Error and admin views
    path('insufficient-data/', insufficient_view),
    path('admin/', admin.site.urls),
]

websocket_urlpatterns = [
    path("task/progress/<str:taskID>/", TaskProgressConsumer.as_asgi()),
]
