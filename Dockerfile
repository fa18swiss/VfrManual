FROM tiangolo/uwsgi-nginx-flask:python3.8
EXPOSE 80/tcp
COPY ./requirements.txt /var/www/requirements.txt
RUN pip install -r /var/www/requirements.txt
ENV STATIC_URL /static
ENV STATIC_PATH /app/app/static
