#!/usr/bin/env bash
# Build and push to Docker Hub
# Usage: ./scripts/docker-publish.sh [dockerhub-username] [tag]
# Default: alifahmaddev/office-energy-monitor:latest
set -euo pipefail

DOCKER_USER="${1:-alifahmaddev}"
TAG="${2:-latest}"
IMAGE="${DOCKER_USER}/office-energy-monitor:${TAG}"

echo "Building ${IMAGE}..."
docker build -t "${IMAGE}" .

echo "Pushing ${IMAGE}..."
docker push "${IMAGE}"

echo ""
echo "Done! Users can run:"
echo ""
echo "  docker pull ${IMAGE}"
echo "  docker run -d --name office-energy -p 3000:3000 --env-file .env ${IMAGE}"
echo ""
