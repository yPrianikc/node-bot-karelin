build:
	docker build -t node-bot-karelin .

run:
	docker run -d -p 3030:3030 --name node-bot-karelin --rm node-bot-karelin