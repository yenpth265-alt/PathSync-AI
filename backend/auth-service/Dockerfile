FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY auth-service/ ./auth-service/
WORKDIR /app/auth-service
RUN go build -o /auth-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /auth-service .
EXPOSE 8001
CMD ["./auth-service"]
