echo "Testing Groups..."

publisher="jannsen"
group="test"
apiKey="47495368-c248-49a5-92b1-6ebe127544b7"

echo "========== PARAMS ==========="
echo "/${publisher}/${group}"
echo $apiKey

echo "========== TEST: Wrong API Key =========="
curl -H "X-Api-Key: f4c49b46707e" -X PUT -H "Content-Type: application/json" -d "@./group.jsonld" "localhost:3000/${publisher}/${group}"

echo "========== TEST: No API Key =========="
curl -X PUT -H "Content-Type: application/json" -d "@./group.jsonld" "localhost:3000/${publisher}/${group}"

echo "========== TEST: Using POST =========="
curl -X POST -H "Content-Type: application/json" -d "@./group.jsonld" "localhost:3000/${publisher}/${group}"

echo "========== TEST: Wrong namespace =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./group.jsonld" "localhost:3000/wrong/${group}"

echo "========== TEST: Id mismatch =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./group.jsonld" "localhost:3000/${publisher}/wrong"

echo "========== TEST: Bad data =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-group.jsonld" "localhost:3000/${publisher}/${group}"

echo "========== TEST: Correct data =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./group.jsonld" "localhost:3000/${publisher}/${group}"
