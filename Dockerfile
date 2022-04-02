FROM tiangolo/uwsgi-nginx-flask:python3.10
EXPOSE 80/tcp

COPY ./requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt

COPY app/ /app/app/
COPY log_config.json uwsgi.ini main.py /app

HEALTHCHECK --start-period=15s --interval=15m CMD curl --fail http://localhost:80/v1/HealthCheck || exit 1

ENV STATIC_URL /static
ENV STATIC_PATH /app/app/static
