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
from pages.views import home_view, start_view, processing_view, set_timezone, get_progress, data_view, sign_in, \
    insufficient_view

handler404 = 'pages.views.not_found_view'

urlpatterns = [
    path('', home_view),
    path('get-started/', start_view),
    path('processing/', processing_view),
    path('your-data/', data_view),
    path('ajax/timezone/', set_timezone),
    path('ajax/progress/', get_progress),
    path('sign-in/', sign_in),
    path('insufficient-data/', insufficient_view),
    path('admin/', admin.site.urls),
]
