echo "Waiting for database at ${DATABUS_DATABASE_URL}..."
bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' ${DATABUS_DATABASE_URL}/sparql)" != "200" ]]; do sleep 5; done'

# Is the proxy server enabled?
if [ "$DATABUS_PROXY_SERVER_ENABLE" = "true" ]; then
	
    # Remove the previous Caddyfile:
    rm -f /etc/caddy/Caddyfile

    # Should we use ACME?
    if [ "$DATABUS_PROXY_SERVER_USE_ACME" = "true" ]; then
        
        # Re-create the Caddyfile using the user's configuration:
        cat <<EOF > /etc/caddy/Caddyfile
$DATABUS_PROXY_SERVER_HOSTNAME:4000 {
    reverse_proxy 127.0.0.1:3000
}

$DATABUS_PROXY_SERVER_HOSTNAME:4001 {
    reverse_proxy 127.0.0.1:8080
}
EOF

    # No, instead we should use the user's certificate:
    else

        # Re-create the Caddyfile using the user's configuration:
        cat <<EOF > /etc/caddy/Caddyfile
$DATABUS_PROXY_SERVER_HOSTNAME:4000 {
    tls /tls/$DATABUS_PROXY_SERVER_OWN_CERT /tls/$DATABUS_PROXY_SERVER_OWN_CERT_KEY
    reverse_proxy 127.0.0.1:3000
}

$DATABUS_PROXY_SERVER_HOSTNAME:4001 {
    tls /tls/$DATABUS_PROXY_SERVER_OWN_CERT /tls/$DATABUS_PROXY_SERVER_OWN_CERT_KEY
    reverse_proxy 127.0.0.1:8080
}
EOF

    fi
    caddy start --config /etc/caddy/Caddyfile
    echo "The proxy server is enabled."

# The proxy server is disabled:
else
	echo "The proxy server is disabled."
fi

cd /databus/server
npm start