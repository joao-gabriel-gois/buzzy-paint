FROM denoland/deno:alpine-1.13.0

WORKDIR /app

COPY . .

RUN apk add --no-cache g++ libstdc++ postgresql-client \
  && deno upgrade \
  && deno cache src/shared/infra/http/server.ts

EXPOSE 3333

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]

# CMD ["sh", "-c", "deno task migrate && deno task prod"]
# CMD ["sh", "-c", "until pg_isready -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER; do sleep 1; done && deno task migrate && deno task prod"]