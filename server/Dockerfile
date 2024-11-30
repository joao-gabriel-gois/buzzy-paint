FROM denoland/deno:alpine-1.13.0

WORKDIR /app

COPY . .

RUN apk add --no-cache g++ libstdc++ postgresql-client \
  && deno upgrade \
  && deno cache src/shared/infra/http/server.ts

EXPOSE 3333

ARG PGUSER
ARG PGPASSWORD
ARG PGHOST
ARG PGPORT
ARG PGDATABASE
ARG PORT
ARG MONGO_ROOT_USER
ARG MONGO_ROOT_PASSWORD

ENV PORT=$PORT
ENV PGUSER=$PGUSER
ENV PGPASSWORD=$PGPASSWORD
ENV PGHOST=$PGHOST
ENV PGPORT=$PGPORT
ENV PGDATABASE=$PGDATABASE
ENV MONGO_ROOT_USER=$MONGO_ROOT_USER
ENV MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]

# CMD ["sh", "-c", "deno task migrate && deno task prod"]
# CMD ["sh", "-c", "until pg_isready -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER; do sleep 1; done && deno task migrate && deno task prod"]