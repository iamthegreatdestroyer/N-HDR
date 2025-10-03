#!/bin/bash

echo "Validating HDR Empire Kubernetes manifests..."

for file in *.yaml; do
  echo "Validating $file..."
  kubectl apply -f $file --dry-run=client -o yaml > /dev/null
  if [ $? -eq 0 ]; then
    echo "✅ $file is valid"
  else
    echo "❌ $file is invalid"
    exit 1
  fi
done

echo "All manifests validated successfully!"
