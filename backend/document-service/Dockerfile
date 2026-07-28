FROM golang:alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod go.sum ./
RUN go mod download
COPY document-service/ ./document-service/
WORKDIR /app/document-service
RUN go build -o /document-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /document-service .
RUN mkdir -p uploads
EXPOSE 8003
CMD ["./document-service"]
