# Grafana Dashboard Queries

## Downloads Over Time
> ceil(sum(increase(databus_downloads[1m])) or vector(0))

## TOP 5 Artifact

