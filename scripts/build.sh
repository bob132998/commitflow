git pull
git branch -v
docker compose -f docker-compose.yml build --no-cache
docker compose -f docker-compose.yml up -d
docker exec -it commitflow-api npx prisma db push