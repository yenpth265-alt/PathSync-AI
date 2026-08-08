FROM golang:alpine AS builder

WORKDIR /app
# Enable CGO for sqlite support (fallback)
ENV CGO_ENABLED=1
RUN apk add --no-cache gcc musl-dev

# Copy everything in backend
COPY . .

# Build all services (we can just build main.go and it will use `go run` or we can pre-build)
# Actually, since main.go uses `exec.Command("go", "run", ".")`, we MUST have the Go SDK installed at runtime!
# So we don't do a multi-stage alpine build, we just use the golang image for runtime!

FROM golang:alpine
WORKDIR /app
ENV CGO_ENABLED=1
RUN apk add --no-cache gcc musl-dev libc6-compat sqlite-dev

COPY --from=builder /app /app

# The orchestrator will start api-gateway on port 8000
EXPOSE 8000

CMD ["go", "run", "main.go"]
