FROM golang:alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod go.sum ./
RUN go mod download
COPY university-service/ ./university-service/
WORKDIR /app/university-service
RUN go build -o /university-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /university-service .
EXPOSE 8004
CMD ["./university-service"]
