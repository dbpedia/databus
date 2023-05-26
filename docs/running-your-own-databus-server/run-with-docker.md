# Run with Docker

Databus is a complex application consisting of several microservices and
a Virtuoso database server. For the ease of deployment
we recommend running it using Docker.

To run the application using Docker, clone the repository or 
download the `docker-compose.yml` and `.env` files.
Both files need to exist in the same directory. Navigate to
the directory with the files (or root of the repo).

&#x20;run:
```
docker-compose up  # optionally with -d parameter to run the containers in background
```
The Databus will be available at `http://localhost:3000`.&#x20;