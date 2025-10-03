# HDR Empire Framework - Makefile
# Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved

# Color definitions
GREEN  := \033[0;32m
BLUE   := \033[0;34m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Project variables
PROJECT_NAME := hdr-empire
REGISTRY := ghcr.io/sgbilod
VERSION := $(shell git rev-parse --short HEAD 2>/dev/null || echo "dev")
NAMESPACE_STAGING := hdr-staging
NAMESPACE_PRODUCTION := hdr-production

# Docker variables
DOCKER_IMAGE := $(REGISTRY)/$(PROJECT_NAME)
DOCKER_TAG := $(VERSION)

.DEFAULT_GOAL := help

#============================================================================
# GENERAL
#============================================================================

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║         HDR Empire Framework - Automation Commands            ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)General Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "  $(BLUE)%-30s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Quick Shortcuts:$(NC)"
	@echo "  $(BLUE)make d$(NC)              Deploy to staging"
	@echo "  $(BLUE)make t$(NC)              Run tests"
	@echo "  $(BLUE)make m$(NC)              Monitor system"
	@echo "  $(BLUE)make s$(NC)              Check status"
	@echo "  $(BLUE)make l$(NC)              View logs"
	@echo ""

.PHONY: version
version: ## Show version information
	@echo "$(GREEN)HDR Empire Framework$(NC)"
	@echo "Version: $(VERSION)"
	@echo "Registry: $(REGISTRY)"
	@echo "Image: $(DOCKER_IMAGE):$(DOCKER_TAG)"

.PHONY: info
info: ## Display project information
	@echo "$(BLUE)Project Information:$(NC)"
	@echo "  Name: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Staging Namespace: $(NAMESPACE_STAGING)"
	@echo "  Production Namespace: $(NAMESPACE_PRODUCTION)"
	@echo "  Docker Image: $(DOCKER_IMAGE):$(DOCKER_TAG)"

#============================================================================
# SETUP
#============================================================================

.PHONY: install
install: ## Install dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)Dependencies installed successfully!$(NC)"

.PHONY: setup-staging
setup-staging: ## Setup staging environment
	@echo "$(GREEN)Setting up staging environment...$(NC)"
	kubectl create namespace $(NAMESPACE_STAGING) --dry-run=client -o yaml | kubectl apply -f -
	kubectl label namespace $(NAMESPACE_STAGING) environment=staging --overwrite
	@echo "$(GREEN)Staging environment ready!$(NC)"

.PHONY: setup-production
setup-production: ## Setup production environment
	@echo "$(YELLOW)Setting up production environment...$(NC)"
	@read -p "Are you sure you want to setup production? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	kubectl create namespace $(NAMESPACE_PRODUCTION) --dry-run=client -o yaml | kubectl apply -f -
	kubectl label namespace $(NAMESPACE_PRODUCTION) environment=production --overwrite
	@echo "$(GREEN)Production environment ready!$(NC)"

.PHONY: setup-monitoring
setup-monitoring: ## Setup monitoring namespace
	@echo "$(GREEN)Setting up monitoring namespace...$(NC)"
	kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f k8s/monitoring/
	@echo "$(GREEN)Monitoring stack deployed!$(NC)"

#============================================================================
# DEPLOYMENT
#============================================================================

.PHONY: deploy-staging
deploy-staging: ## Deploy to staging environment
	@echo "$(GREEN)Deploying to staging...$(NC)"
	helm upgrade --install $(PROJECT_NAME) ./helm/hdr-empire \
		--namespace $(NAMESPACE_STAGING) \
		--create-namespace \
		--set image.tag=$(DOCKER_TAG) \
		--set environment=staging \
		--wait --timeout=5m
	@echo "$(GREEN)Staging deployment complete!$(NC)"

.PHONY: deploy-production
deploy-production: ## Deploy to production environment
	@echo "$(YELLOW)⚠️  WARNING: Deploying to PRODUCTION$(NC)"
	@read -p "Enter 'DEPLOY' to confirm: " confirm && [ "$$confirm" = "DEPLOY" ]
	@echo "$(GREEN)Deploying to production...$(NC)"
	helm upgrade --install $(PROJECT_NAME) ./helm/hdr-empire \
		--namespace $(NAMESPACE_PRODUCTION) \
		--create-namespace \
		--set image.tag=$(DOCKER_TAG) \
		--set environment=production \
		--wait --timeout=10m
	@echo "$(GREEN)Production deployment complete!$(NC)"

.PHONY: rollback-staging
rollback-staging: ## Rollback staging deployment
	@echo "$(YELLOW)Rolling back staging...$(NC)"
	helm rollback $(PROJECT_NAME) --namespace $(NAMESPACE_STAGING)
	@echo "$(GREEN)Staging rollback complete!$(NC)"

.PHONY: rollback-production
rollback-production: ## Rollback production deployment
	@echo "$(RED)⚠️  WARNING: Rolling back PRODUCTION$(NC)"
	@read -p "Enter 'ROLLBACK' to confirm: " confirm && [ "$$confirm" = "ROLLBACK" ]
	helm rollback $(PROJECT_NAME) --namespace $(NAMESPACE_PRODUCTION)
	@echo "$(GREEN)Production rollback complete!$(NC)"

.PHONY: undeploy-staging
undeploy-staging: ## Remove staging deployment
	@echo "$(YELLOW)Removing staging deployment...$(NC)"
	helm uninstall $(PROJECT_NAME) --namespace $(NAMESPACE_STAGING)
	@echo "$(GREEN)Staging deployment removed!$(NC)"

.PHONY: undeploy-production
undeploy-production: ## Remove production deployment
	@echo "$(RED)⚠️  WARNING: Removing PRODUCTION deployment$(NC)"
	@read -p "Enter 'DELETE' to confirm: " confirm && [ "$$confirm" = "DELETE" ]
	helm uninstall $(PROJECT_NAME) --namespace $(NAMESPACE_PRODUCTION)
	@echo "$(GREEN)Production deployment removed!$(NC)"

#============================================================================
# TESTING
#============================================================================

.PHONY: test
test: ## Run all tests
	@echo "$(GREEN)Running all tests...$(NC)"
	npm test
	@echo "$(GREEN)All tests complete!$(NC)"

.PHONY: test-unit
test-unit: ## Run unit tests
	@echo "$(GREEN)Running unit tests...$(NC)"
	npm run test:unit
	@echo "$(GREEN)Unit tests complete!$(NC)"

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "$(GREEN)Running integration tests...$(NC)"
	npm run test:integration
	@echo "$(GREEN)Integration tests complete!$(NC)"

.PHONY: test-performance
test-performance: ## Run performance tests
	@echo "$(GREEN)Running performance tests...$(NC)"
	npm run test:performance
	@echo "$(GREEN)Performance tests complete!$(NC)"

.PHONY: test-api
test-api: ## Run API tests
	@echo "$(GREEN)Running API tests...$(NC)"
	npm run test:api
	@echo "$(GREEN)API tests complete!$(NC)"

.PHONY: test-coverage
test-coverage: ## Generate test coverage report
	@echo "$(GREEN)Generating coverage report...$(NC)"
	npm test -- --coverage
	@echo "$(GREEN)Coverage report generated in coverage/$(NC)"

.PHONY: smoke-test-staging
smoke-test-staging: ## Run smoke tests on staging
	@echo "$(GREEN)Running smoke tests on staging...$(NC)"
	NAMESPACE=$(NAMESPACE_STAGING) ENVIRONMENT=staging ./scripts/smoke-tests.sh
	@echo "$(GREEN)Smoke tests complete!$(NC)"

.PHONY: smoke-test-production
smoke-test-production: ## Run smoke tests on production
	@echo "$(GREEN)Running smoke tests on production...$(NC)"
	NAMESPACE=$(NAMESPACE_PRODUCTION) ENVIRONMENT=production ./scripts/smoke-tests.sh
	@echo "$(GREEN)Smoke tests complete!$(NC)"

#============================================================================
# VALIDATION
#============================================================================

.PHONY: validate
validate: validate-k8s validate-helm validate-istio ## Validate all configurations

.PHONY: validate-k8s
validate-k8s: ## Validate Kubernetes manifests
	@echo "$(GREEN)Validating Kubernetes manifests...$(NC)"
	@cd k8s && ./validate.sh
	@echo "$(GREEN)Kubernetes manifests validated!$(NC)"

.PHONY: validate-helm
validate-helm: ## Validate Helm chart
	@echo "$(GREEN)Validating Helm chart...$(NC)"
	@cd helm && ./validate.sh
	@echo "$(GREEN)Helm chart validated!$(NC)"

.PHONY: validate-istio
validate-istio: ## Validate Istio configuration
	@echo "$(GREEN)Validating Istio configuration...$(NC)"
	@cd k8s/istio && ./validate.sh
	@echo "$(GREEN)Istio configuration validated!$(NC)"

.PHONY: lint
lint: ## Run linters
	@echo "$(GREEN)Running linters...$(NC)"
	npm run lint
	@echo "$(GREEN)Linting complete!$(NC)"

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	@echo "$(GREEN)Fixing linting issues...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)Linting fixes applied!$(NC)"

#============================================================================
# MONITORING
#============================================================================

.PHONY: monitor
monitor: ## Open monitoring dashboard
	@echo "$(GREEN)Opening monitoring dashboard...$(NC)"
	@echo "Grafana: http://localhost:3000"
	@echo "Prometheus: http://localhost:9090"
	@echo "Jaeger: http://localhost:16686"
	kubectl port-forward -n monitoring svc/grafana 3000:80 &
	kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
	kubectl port-forward -n monitoring svc/jaeger-query 16686:16686 &

.PHONY: logs-staging
logs-staging: ## View staging logs
	@echo "$(GREEN)Viewing staging logs...$(NC)"
	kubectl logs -n $(NAMESPACE_STAGING) -l app=$(PROJECT_NAME) --tail=100 -f

.PHONY: logs-production
logs-production: ## View production logs
	@echo "$(GREEN)Viewing production logs...$(NC)"
	kubectl logs -n $(NAMESPACE_PRODUCTION) -l app=$(PROJECT_NAME) --tail=100 -f

.PHONY: events-staging
events-staging: ## View staging events
	@echo "$(GREEN)Viewing staging events...$(NC)"
	kubectl get events -n $(NAMESPACE_STAGING) --sort-by='.lastTimestamp'

.PHONY: events-production
events-production: ## View production events
	@echo "$(GREEN)Viewing production events...$(NC)"
	kubectl get events -n $(NAMESPACE_PRODUCTION) --sort-by='.lastTimestamp'

.PHONY: metrics-staging
metrics-staging: ## View staging metrics
	@echo "$(GREEN)Staging resource usage:$(NC)"
	kubectl top pods -n $(NAMESPACE_STAGING)
	kubectl top nodes

.PHONY: metrics-production
metrics-production: ## View production metrics
	@echo "$(GREEN)Production resource usage:$(NC)"
	kubectl top pods -n $(NAMESPACE_PRODUCTION)
	kubectl top nodes

#============================================================================
# STATUS
#============================================================================

.PHONY: status-staging
status-staging: ## Show staging status
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    Staging Environment Status                 ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Pods:$(NC)"
	@kubectl get pods -n $(NAMESPACE_STAGING)
	@echo ""
	@echo "$(GREEN)Services:$(NC)"
	@kubectl get svc -n $(NAMESPACE_STAGING)
	@echo ""
	@echo "$(GREEN)Ingress:$(NC)"
	@kubectl get ingress -n $(NAMESPACE_STAGING)
	@echo ""
	@echo "$(GREEN)HPA:$(NC)"
	@kubectl get hpa -n $(NAMESPACE_STAGING)

.PHONY: status-production
status-production: ## Show production status
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                   Production Environment Status               ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Pods:$(NC)"
	@kubectl get pods -n $(NAMESPACE_PRODUCTION)
	@echo ""
	@echo "$(GREEN)Services:$(NC)"
	@kubectl get svc -n $(NAMESPACE_PRODUCTION)
	@echo ""
	@echo "$(GREEN)Ingress:$(NC)"
	@kubectl get ingress -n $(NAMESPACE_PRODUCTION)
	@echo ""
	@echo "$(GREEN)HPA:$(NC)"
	@kubectl get hpa -n $(NAMESPACE_PRODUCTION)

.PHONY: describe-staging
describe-staging: ## Describe staging deployment
	@echo "$(GREEN)Describing staging deployment...$(NC)"
	kubectl describe deployment $(PROJECT_NAME) -n $(NAMESPACE_STAGING)

.PHONY: describe-production
describe-production: ## Describe production deployment
	@echo "$(GREEN)Describing production deployment...$(NC)"
	kubectl describe deployment $(PROJECT_NAME) -n $(NAMESPACE_PRODUCTION)

#============================================================================
# COST OPTIMIZATION
#============================================================================

.PHONY: cost-analysis
cost-analysis: ## Analyze resource costs
	@echo "$(GREEN)Running cost analysis...$(NC)"
	./scripts/cost-optimization.sh --analyze
	@echo "$(GREEN)Cost analysis complete! Check reports/cost-optimization/$(NC)"

.PHONY: cost-optimize
cost-optimize: ## Apply cost optimizations
	@echo "$(YELLOW)Applying cost optimizations...$(NC)"
	@read -p "This will modify resources. Continue? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	./scripts/cost-optimization.sh --auto-apply
	@echo "$(GREEN)Cost optimizations applied!$(NC)"

#============================================================================
# RELIABILITY & RECOVERY
#============================================================================

.PHONY: self-heal
self-heal: ## Run self-healing check
	@echo "$(GREEN)Running self-healing check...$(NC)"
	./scripts/self-healing.sh --once
	@echo "$(GREEN)Self-healing check complete!$(NC)"

.PHONY: backup
backup: ## Create backup
	@echo "$(GREEN)Creating backup...$(NC)"
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d-%H%M%S) && \
	kubectl get all -n $(NAMESPACE_PRODUCTION) -o yaml > backups/production-$$TIMESTAMP.yaml && \
	helm get values $(PROJECT_NAME) -n $(NAMESPACE_PRODUCTION) > backups/values-$$TIMESTAMP.yaml && \
	echo "$(GREEN)Backup created: backups/production-$$TIMESTAMP.yaml$(NC)"

.PHONY: restore
restore: ## Restore from backup
	@echo "$(RED)⚠️  WARNING: Restoring from backup$(NC)"
	@read -p "Enter backup filename (e.g., production-20250103-120000.yaml): " file && \
	kubectl apply -f backups/$$file
	@echo "$(GREEN)Restore complete!$(NC)"

.PHONY: health-check
health-check: ## Run health check
	@echo "$(GREEN)Running health check...$(NC)"
	@kubectl get pods -n $(NAMESPACE_PRODUCTION) --field-selector=status.phase!=Running
	@echo "$(GREEN)Health check complete!$(NC)"

#============================================================================
# SECURITY
#============================================================================

.PHONY: secrets-staging
secrets-staging: ## Manage staging secrets
	@echo "$(GREEN)Managing staging secrets...$(NC)"
	@read -p "Enter Redis password: " redis_pass && \
	read -p "Enter JWT secret: " jwt_secret && \
	read -p "Enter encryption key: " enc_key && \
	kubectl create secret generic hdr-secrets \
		--from-literal=redis-password=$$redis_pass \
		--from-literal=jwt-secret=$$jwt_secret \
		--from-literal=encryption-key=$$enc_key \
		--namespace=$(NAMESPACE_STAGING) \
		--dry-run=client -o yaml | kubectl apply -f -
	@echo "$(GREEN)Staging secrets updated!$(NC)"

.PHONY: secrets-production
secrets-production: ## Manage production secrets
	@echo "$(YELLOW)⚠️  WARNING: Managing PRODUCTION secrets$(NC)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	@read -p "Enter Redis password: " redis_pass && \
	read -p "Enter JWT secret: " jwt_secret && \
	read -p "Enter encryption key: " enc_key && \
	kubectl create secret generic hdr-secrets \
		--from-literal=redis-password=$$redis_pass \
		--from-literal=jwt-secret=$$jwt_secret \
		--from-literal=encryption-key=$$enc_key \
		--namespace=$(NAMESPACE_PRODUCTION) \
		--dry-run=client -o yaml | kubectl apply -f -
	@echo "$(GREEN)Production secrets updated!$(NC)"

.PHONY: security-scan
security-scan: ## Run security scan
	@echo "$(GREEN)Running security scan...$(NC)"
	npm audit
	@echo "$(GREEN)Security scan complete!$(NC)"

.PHONY: security-fix
security-fix: ## Fix security vulnerabilities
	@echo "$(GREEN)Fixing security vulnerabilities...$(NC)"
	npm audit fix
	@echo "$(GREEN)Security fixes applied!$(NC)"

#============================================================================
# DOCKER
#============================================================================

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(DOCKER_IMAGE):latest
	@echo "$(GREEN)Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)$(NC)"

.PHONY: docker-push
docker-push: ## Push Docker image to registry
	@echo "$(GREEN)Pushing Docker image...$(NC)"
	docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	docker push $(DOCKER_IMAGE):latest
	@echo "$(GREEN)Docker image pushed!$(NC)"

.PHONY: docker-run
docker-run: ## Run Docker container locally
	@echo "$(GREEN)Running Docker container...$(NC)"
	docker run -p 3000:3000 --rm $(DOCKER_IMAGE):$(DOCKER_TAG)

#============================================================================
# DEVELOPMENT
#============================================================================

.PHONY: dev
dev: ## Start development server
	@echo "$(GREEN)Starting development server...$(NC)"
	npm run dev

.PHONY: port-forward
port-forward: ## Port-forward to staging pod
	@echo "$(GREEN)Port-forwarding to staging pod...$(NC)"
	kubectl port-forward -n $(NAMESPACE_STAGING) svc/$(PROJECT_NAME) 3000:80

.PHONY: shell-staging
shell-staging: ## Open shell in staging pod
	@echo "$(GREEN)Opening shell in staging pod...$(NC)"
	kubectl exec -it -n $(NAMESPACE_STAGING) $$(kubectl get pod -n $(NAMESPACE_STAGING) -l app=$(PROJECT_NAME) -o jsonpath='{.items[0].metadata.name}') -- /bin/sh

.PHONY: shell-production
shell-production: ## Open shell in production pod
	@echo "$(YELLOW)⚠️  Opening shell in PRODUCTION pod$(NC)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	kubectl exec -it -n $(NAMESPACE_PRODUCTION) $$(kubectl get pod -n $(NAMESPACE_PRODUCTION) -l app=$(PROJECT_NAME) -o jsonpath='{.items[0].metadata.name}') -- /bin/sh

#============================================================================
# UTILITIES
#============================================================================

.PHONY: clean
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf node_modules coverage dist reports test-results
	@echo "$(GREEN)Clean complete!$(NC)"

.PHONY: clean-docker
clean-docker: ## Clean Docker images
	@echo "$(GREEN)Cleaning Docker images...$(NC)"
	docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) || true
	docker rmi $(DOCKER_IMAGE):latest || true
	@echo "$(GREEN)Docker images cleaned!$(NC)"

.PHONY: automation-center
automation-center: ## Open automation command center
	@./scripts/automation-center.sh

#============================================================================
# CI/CD
#============================================================================

.PHONY: ci-test
ci-test: ## Run CI tests
	@echo "$(GREEN)Running CI tests...$(NC)"
	npm ci
	npm test
	@echo "$(GREEN)CI tests complete!$(NC)"

.PHONY: ci-build
ci-build: ## Build for CI
	@echo "$(GREEN)Building for CI...$(NC)"
	npm ci
	npm run build
	@echo "$(GREEN)CI build complete!$(NC)"

#============================================================================
# SHORTCUTS
#============================================================================

.PHONY: d
d: deploy-staging ## Shortcut for deploy-staging

.PHONY: t
t: test ## Shortcut for test

.PHONY: m
m: monitor ## Shortcut for monitor

.PHONY: s
s: status-staging ## Shortcut for status-staging

.PHONY: l
l: logs-staging ## Shortcut for logs-staging
