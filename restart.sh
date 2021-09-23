git pull
docker build -t databus . 
docker stop databus-app_databus_1;
docker rm databus-app_databus_1;
docker-compose up -d databus;