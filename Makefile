build:
	docker build -t node-bot-karelin .

run:
	docker run -d -p 3000:3000 --name node-bot-karelin --rm node-bot-karelin