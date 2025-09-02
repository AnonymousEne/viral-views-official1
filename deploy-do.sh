#!/bin/bash
# Deploy to DigitalOcean App Platform (example)
# Prerequisites: doctl CLI installed and authenticated

APP_NAME=viral-views-app
REGION=nyc

# Build Docker image
docker build -t $APP_NAME .

doctl apps create --spec .do/app.yaml
