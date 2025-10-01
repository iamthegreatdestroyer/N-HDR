@echo off
REM HDR Empire Framework - Windows Deployment Script
REM Copyright (c) 2025 Stephen Bilodeau - Patent Pending

setlocal enabledelayedexpansion

REM Configuration
set NAMESPACE=hdr-system
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo [INFO] Starting HDR Empire deployment to %ENVIRONMENT%

REM Check prerequisites
echo [INFO] Checking prerequisites...
kubectl version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] kubectl is not installed
    exit /b 1
)

docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker is not installed
    exit /b 1
)

REM Deploy to Kubernetes
echo [INFO] Creating namespace...
kubectl apply -f k8s/namespace.yaml

echo [INFO] Deploying secrets...
kubectl apply -f k8s/secrets.yaml

echo [INFO] Deploying ConfigMap...
kubectl apply -f k8s/configmap.yaml

echo [INFO] Deploying PVCs...
kubectl apply -f k8s/pvc.yaml

echo [INFO] Deploying application...
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

echo [INFO] Waiting for deployment...
kubectl rollout status deployment/hdr-empire -n %NAMESPACE% --timeout=5m

echo [INFO] Verifying deployment...
kubectl get pods -n %NAMESPACE% -l app=hdr-empire

echo [INFO] Deployment completed successfully!

endlocal
