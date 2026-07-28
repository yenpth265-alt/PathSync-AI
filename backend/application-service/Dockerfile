FROM golang:alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod go.sum ./
RUN go mod download
COPY application-service/ ./application-service/
WORKDIR /app/application-service
RUN go build -o /application-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /application-service .
EXPOSE 8002
CMD ["./application-service"]
