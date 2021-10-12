# Examples

## Deploy Group and Artifact Version

1) Generate example metadata with
```
bash generate-example.sh $DATABUS_BASE_URL $ACCOUNT
```
(Example: `bash generate-example.sh http://localhost:3000 jan`)


2) Deploy with
```
bash deploy.sh $DATABUS_BASE_URL example-metadata.jsonld $API_KEY
```
(Example: `bash deploy.sh http://localhost:3000 example-metadata.jsonld d87627e4-41c6-41e2-bd20-37b0048374e0`)
