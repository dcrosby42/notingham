@help:
  just -l

test:
    go test ./...

# Install dependencies
setup:
    go install github.com/jessevdk/go-assets-builder@latest

# Embed web assets (html/js/css) into site/assets.go
assets:
    go-assets-builder -p site -o site/assets.go -s /public public

# Build and install notingham binary
install: assets
    go install

# Launch server with embedded assets
run: install
    notingham server --host 127.0.0.1 --port 9000 --data-dir notebooks

# Launch server using public/ directly instead of embedded assets
run-local: assets
    go run main.go server \
        --host 127.0.0.1 \
        --port 9000 \
        --data-dir notebooks \
        --site-dir public
