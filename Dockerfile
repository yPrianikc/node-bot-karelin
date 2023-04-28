# Используем официальный образ Node.js версии 12
FROM node:16-alpine

# Создаем директорию приложения в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

RUN apk add git && \ git pull
# Устанавливаем зависимости приложения
RUN npm ci

# Копируем исходный код приложения в контейнер
COPY . .

ENV PORT=3030
# Открываем порт, который будет использоваться приложением
EXPOSE $PORT

# Запускаем приложение
CMD [ "npm", "start" ]