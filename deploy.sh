#!/bin/bash

git checkout ds1
docker build -t us-central1-docker.pkg.dev/$(gcloud config get-value project)/my-docker-repo/nextjs-app:stable-1 .
docker run -p 3000:3000 us-central1-docker.pkg.dev/$(gcloud config get-value project)/my-docker-repo/nextjs-app:stable-1
