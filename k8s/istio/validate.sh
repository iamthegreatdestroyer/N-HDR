#!/bin/bash

echo "Validating Istio configuration..."

for file in *.yaml; do
  echo "Validating $file..."
  istioctl analyze -f $file
  if [ $? -eq 0 ]; then
    echo "✅ $file is valid"
  else
    echo "❌ $file contains errors"
    exit 1
  fi
done

echo "All Istio configurations validated successfully!"
