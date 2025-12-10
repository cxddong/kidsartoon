# deploy.ps1

# Exit immediately if a command exits with a non-zero status.
$ErrorActionPreference = "Stop"

Write-Host "Starting deployment process..."

# 1. Build and submit container image to Google Container Registry
Write-Host "Building and submitting container image..."
gcloud builds submit --tag gcr.io/kat-antigravity/kidsartoon

# 2. Deploy the container to Cloud Run
Write-Host "Deploying service to Cloud Run..."
gcloud run deploy kidsartoon `
    --image gcr.io/kat-antigravity/kidsartoon `
    --platform=managed `
    --region=us-east1 `
    --allow-unauthenticated

Write-Host "Deployment completed successfully!"
