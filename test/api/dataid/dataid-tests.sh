echo "Testing Dataids..."

publisher="azureman"
group="test"
artifact="success"
version="2021-08-03"
apiKey="28e6c598-cf90-46e6-9783-f9c2b1abfe36"

echo "========== PARAMS ==========="
echo "/${publisher}/${group}/${artifact}/${version}"
echo $apiKey

echo "========== TEST: Wrong API Key =========="
curl -H "X-Api-Key: f4c49b46707e" -X PUT -H "Content-Type: application/json" -d "@./dataid.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: No API Key =========="
curl -X PUT -H "Content-Type: application/json" -d "@./dataid.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Wrong namespace =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./dataid.jsonld" "localhost:3000/wrong/${group}/${artifact}/${version}"

echo "========== TEST: Wrong Data 01 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-dataid-01.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Wrong Data 02 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-dataid-02.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Wrong Data 03 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-dataid-03.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Wrong Data 04 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-dataid-04.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Wrong Data 05 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-dataid-05.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Wrong Data 06 =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./bad-dataid-06.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"

echo "========== TEST: Correct data =========="
curl -H "X-Api-Key: ${apiKey}" -X PUT -H "Content-Type: application/json" -d "@./dataid.jsonld" "localhost:3000/${publisher}/${group}/${artifact}/${version}"
