#!/bin/bash

echo "Validating HDR Empire Helm Chart..."
helm lint ./hdr-empire
helm template ./hdr-empire > template-output.yaml

# Validate template output
kubectl create --dry-run=client -f template-output.yaml
if [ $? -eq 0 ]; then
  echo "✅ Helm chart templates are valid"
else
  echo "❌ Helm chart templates contain errors"
  exit 1
fi

rm template-output.yaml
echo "Helm chart validation complete!"
