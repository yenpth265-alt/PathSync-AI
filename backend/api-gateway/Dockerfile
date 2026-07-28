FROM golang:alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod go.sum ./
RUN go mod download
COPY api-gateway/ ./api-gateway/
WORKDIR /app/api-gateway
RUN go build -o /api-gateway .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /api-gateway .
EXPOSE 8000
CMD ["./api-gateway"]
