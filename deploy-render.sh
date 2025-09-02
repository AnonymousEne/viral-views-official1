#!/bin/bash
# Deploy to Render.com (example)
# Prerequisites: render.yaml configured and render CLI installed

render services create --name viral-views-app --type web --env production --plan starter --region oregon --branch main --repo https://github.com/AnonymousEne/viral-views-official1 --dockerfile ./Dockerfile
