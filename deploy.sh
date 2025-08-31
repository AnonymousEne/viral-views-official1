#!/bin/bash
# Build and run the Docker container for production
set -e

IMAGE_NAME=viral-views-prod
CONTAINER_NAME=viral-views-app
PORT=3000

# Build the Docker image
docker build -t $IMAGE_NAME .

# Stop and remove any existing container with the same name
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Run the container
docker run -d --name $CONTAINER_NAME -p $PORT:3000 $IMAGE_NAME
