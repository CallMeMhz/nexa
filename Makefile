clean:
	@echo "Cleaning up..."
	@if [ -f nexa.db ]; then \
		echo "Deleting items from database..."; \
		sqlite3 nexa.db "DELETE FROM items;"; \
		echo "Items table cleared."; \
	else \
		echo "Database file nexa.db not found. Nothing to clean."; \
	fi

run:
	CGO_ENABLED=1 go run .

