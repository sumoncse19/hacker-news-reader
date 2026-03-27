.PHONY: up down build restart logs logs-backend logs-frontend logs-db dev db dev-backend dev-frontend clean install

# === Docker Compose (Production) ===

up:
	docker compose up

up-build:
	docker compose up --build

up-detach:
	docker compose up -d --build

down:
	docker compose down

down-clean:
	docker compose down -v --rmi local

restart:
	docker compose down && docker compose up --build

# === Logs ===

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f postgres

# === Local Development (DB in Docker, app on host) ===

db:
	docker compose up -d postgres

dev: db
	@echo "Starting backend and frontend dev servers..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 5000

dev-frontend:
	cd frontend && npm run dev

install:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && cd ../frontend && npm install

# === Cleanup ===

clean:
	rm -rf backend/__pycache__ backend/app/__pycache__ frontend/dist frontend/node_modules
