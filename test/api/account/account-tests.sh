echo "Testing Accounts..."

publisher="azureman"
apiKey="28e6c598-cf90-46e6-9783-f9c2b1abfe36"

echo "========== PARAMS ==========="
echo "/${publisher}"
echo $apiKey

echo "========== TEST: Wrong API Key =========="
curl -H "X-Api-Key: f4c49b46707e" -X PUT -H "Content-Type: application/json" -d "@./account.jsonld" "localhost:3000/${publisher}"

echo "========== TEST: Wrong namespace =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./account.jsonld" "localhost:3000/wrong"

echo "========== TEST: Wrong data 01 - SHACL =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-account-01.jsonld" "localhost:3000/${publisher}"

echo "========== TEST: Wrong data 02 - Identifier =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-account-02.jsonld" "localhost:3000/${publisher}"

echo "========== TEST: Correct data 01 - Custom Key/Cert =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-account-03.jsonld" "localhost:3000/${publisher}"

echo "========== TEST: Correct data 02 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./account.jsonld" "localhost:3000/${publisher}"
