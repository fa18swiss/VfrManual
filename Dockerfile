FROM python:3.10.5-alpine
EXPOSE 80/tcp

RUN apk --no-cache add curl

COPY ./requirements.txt /tmp/
RUN pip install --no-cache-dir --upgrade -r /tmp/requirements.txt

COPY app/ /app/app/
COPY log_config.json /app/

HEALTHCHECK --start-period=15s --interval=15m CMD curl --fail http://localhost:80/v1/HealthCheck || exit 1

WORKDIR /app

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80"]
