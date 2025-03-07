build:
	cd web && pnpm build

server:
	CGO_ENABLED=1 NEXA_PASSWORD=nexa NEXA_SECRET=sosecretaf go run .

webui:
	cd web && pnpm dev

reset-db:
	@echo "Cleaning up..."
	@if [ -f nexa.db ]; then \
		echo "Deleting items from database..."; \
		sqlite3 nexa.db "DELETE FROM items;"; \
		echo "Items table cleared."; \
	else \
		echo "Database file nexa.db not found. Nothing to clean."; \
	fi