FROM golang:1.24-alpine AS server-builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev sqlite-dev

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./

RUN CGO_ENABLED=1 go build -o nexa .

FROM node:22-alpine AS frontend-builder

WORKDIR /app

RUN npm install -g pnpm

COPY web/package.json web/pnpm-lock.yaml ./

RUN pnpm install

COPY web/ ./

ENV NODE_ENV=production
ENV REACT_APP_BACKEND_URL=""

RUN pnpm build

FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache sqlite-libs ca-certificates

COPY --from=server-builder /app/nexa /app/nexa

COPY --from=frontend-builder /app/build /app/web/build

RUN mkdir -p /app/data

ENV NEXA_PASSWORD=nexa

EXPOSE 7766

CMD ["/app/nexa"] 