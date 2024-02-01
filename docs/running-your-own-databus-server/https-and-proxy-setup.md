# HTTPS & Proxy Setup

For a production setup the Databus requires the use of a proxy with a TLS-encrypted connection (HTTPS). There are two options: activate the internal proxy with automatic HTTPS (certificate) provisioning or configure an external proxy of your choice.&#x20;

### Internal Proxy with Automatic HTTPS (certificate) provisioning

If no web server is running on the deployment machine, an integrated [Caddy server](https://caddyserver.com) can be activated by changing settings in the  `.env` and `docker-compose.yml`files. The only requirement is that the deployment host machine has a DNS A/AAAA/CNAME DNS record for its FQDN.

In the `.env` file the `DATABUS_PROXY_SERVER_ENABLE` needs to be set to `true` and  `DATABUS_PROXY_SERVER_HOSTNAME` must be set to the host's name (FQDN). As long as `DATABUS_PROXY_SERVER_USE_ACME` is set to `true`, which is the default, HTTP or TLS-ALPN [ACME challenges](https://caddyserver.com/docs/automatic-https#acme-challenges) can be used to request a free certificate. However, the compose setup must be accessible from the Internet on port 80 or 443 for this. In order to achieve this, the according lines in the `docker-compose.yml` have to be uncommented

```
services:
  databus:
    image: "docker.io/dbpedia/databus"
    ports:
  ... 
#      - 80:80       # ** uncomment if proxy enabled only** HTTP port of included proxy (caddy) necessary for Auto-HTTPS via ACME and HTTP->HTTPS redirect
#      - 443:4000    # ** uncomment if proxy enabled only** HTTPS: Databus web UI via caddy proxy
```

#### Custom Certificates

If an own certificate is to be used, the variable `DATABUS_PROXY_SERVER_USE_ACME` hast to be set to `false`. The file name (not path!) of the own certificate is then set by `DATABUS_PROXY_SERVER_OWN_CERT`, as well as its key file name by `DATABUS_PROXY_SERVER_OWN_CERT_KEY`. By default certificates are retrieved from `./data/tls/` , which is relative to the folder of the `docker-compose.yml` file.

The path to the certificate directory can be customized. For security reasons, it the certificate folder is mounted as read-only into the docker, so the Databus container cannot modify or delete your own certificates.

When using custom certificates the HTTP and HTTPS port bindings can be freely adjusted. The HTTP port is not mandatory, since it will return a permanent redirect to HTTPS.

### External Proxy Example

You can use an existing web server as a reverse proxy in front of the Databus container (by default port 3000). The reverse proxy must support HTTPS and it is recommended that HTTP requests are automatically redirected to HTTPS. In case Apache is used, the HTTPS configuration might look similar like this:

```
<IfModule mod_ssl.c>
<VirtualHost *:443>

        ServerName dev.databus.dbpedia.org
        ServerAlias www.dev.databus.dbpedia.org

        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html

        #LogLevel info ssl:warn

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        ProxyPreserveHost On
        SSLProxyEngine On
        SSLProxyCheckPeerCN on
        SSLProxyCheckPeerExpire on
        RequestHeader set X-Forwarded-Proto "https"
        RequestHeader set X-Forwarded-Port "443"
        
        ProxyPass / http://localhost:3000/
        ProxyPassReverse / http://localhost:3000/
        
       ### development debugging options, do not use on production systems ###
        #ProxyPassMatch ^/gstore/(.*) http://localhost:3002/$1
        #ProxyPassReverse ^/gstore/(.*) http://localhost:3002/$1
        #ProxyPass /file http://localhost:3002/file/
        #ProxyPassReverse /file http://localhost:3002/file/
        #ProxyPass /repo http://localhost:3002/repo/
        #ProxyPassReverse /repo http://localhost:3002/repo/

SSLCertificateFile /etc/letsencrypt/live/dev.databus.dbpedia.org/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/dev.databus.dbpedia.org/privkey.pem
Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
</IfModule>
```

###
