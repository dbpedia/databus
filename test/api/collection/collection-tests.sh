echo "Testing Collections..."

publisher="azureman"
collection="something"
apiKey="28e6c598-cf90-46e6-9783-f9c2b1abfe36"

echo "========== PARAMS ==========="
echo "/${publisher}"
echo $apiKey

echo "========== TEST: Insert with Wrong API Key =========="
curl -H "X-Api-Key: f4c49b46707e" -X PUT -H "Content-Type: application/json" -d "@./collection.jsonld" "localhost:3000/${publisher}/collections/${collection}"

echo "========== TEST: Insert with Wrong namespace =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./collection.jsonld" "localhost:3000/wrong/collections/${collection}"

echo "========== TEST: Correct data =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./collection.jsonld" "localhost:3000/${publisher}/collections/${collection}"

echo "========== TEST: Delete with Wrong API Key =========="
curl -H "X-Api-Key: f4c49b46707e" -X DELETE "localhost:3000/${publisher}/collections/${collection}"

echo "========== TEST: Delete with Wrong namespace =========="
curl -H "X-Api-Key: ${apiKey}" -X DELETE "localhost:3000/wrong/collections/${collection}"

echo "========== TEST: Delete data =========="
curl -H "X-Api-Key: ${apiKey}" -X DELETE "localhost:3000/${publisher}/collections/${collection}"

echo "========== TEST: Correct data =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./collection.jsonld" "localhost:3000/${publisher}/collections/${collection}"
