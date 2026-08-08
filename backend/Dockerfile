FROM golang:1.22-alpine AS builder

ARG SERVICE_NAME
WORKDIR /app

# Enable CGO for sqlite support (since we fallback to sqlite)
ENV CGO_ENABLED=1

RUN apk add --no-cache gcc musl-dev

# Copy only the specific service folder
COPY ${SERVICE_NAME}/ .

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
# Need libc for sqlite support
RUN apk add --no-cache libc6-compat sqlite-dev

COPY --from=builder /app/main .

CMD ["./main"]
