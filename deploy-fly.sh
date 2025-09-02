#!/bin/bash
# Deploy to Fly.io (example)
# Prerequisites: flyctl CLI installed and authenticated

APP_NAME=viral-views-app
REGION=ord

flyctl launch --name $APP_NAME --region $REGION --dockerfile ./Dockerfile --now
