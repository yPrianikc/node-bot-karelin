build:
	docker build -t karelin .

run:
	docker run -d -p 3030:3030 --name karelin --rm karelin