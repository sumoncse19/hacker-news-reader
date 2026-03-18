.PHONY: up down build restart logs logs-backend logs-frontend logs-db dev-backend dev-frontend db-migrate db-studio clean

# === Docker Compose ===

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

# === Local Development (without Docker) ===

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

install:
	cd backend && npm install && cd ../frontend && npm install

# === Database ===

db-migrate:
	cd backend && npx prisma migrate dev

db-studio:
	cd backend && npx prisma studio

db-generate:
	cd backend && npx prisma generate

# === Cleanup ===

clean:
	rm -rf backend/dist backend/node_modules frontend/dist frontend/node_modules
