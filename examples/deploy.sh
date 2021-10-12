echo "Deploying to: " $1
echo "Metadata file: " $2
echo "API key:" $3

echo "================================="
echo "Deploying..."
echo "curl -X POST -H \"x-api-key: ${3}\" -H \"Content-Type: application/json\" -d "@${2}" \"${1}/system/publish\""
curl -X POST -H "x-api-key: ${3}" -H "Content-Type: application/json" -d "@${2}" "${1}/system/publish"
echo "Done."