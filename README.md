<h1 align="center">
  PayPal IPN Listener
</h1>

A Node.js and MongoDB based listener for PayPal IPN events.

![Docker Cloud Automated build](https://img.shields.io/docker/cloud/automated/Fairbanks-io/PayPal-IPN-Listener.svg)
![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/Fairbanks-io/PayPal-IPN-Listener.svg)
![GitHub top language](https://img.shields.io/github/languages/top/Fairbanks-io/PayPal-IPN-Listener.svg)
![Docker Pulls](https://img.shields.io/docker/pulls/jonfairbanks/yo-client.svg)
![GitHub](https://img.shields.io/github/license/Fairbanks-io/PayPal-IPN-Listener.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/Fairbanks-io/PayPal-IPN-Listener.svg)

## Getting Started

#### Prerequisites

The following will need to be installed before proceeding:

- Node v8+
- Mongo DB
- Nginx

#### Clone the Project

```sh
# Clone it
git clone https://github.com/Fairbanks-io/PayPal-IPN-Listener.git
cd PayPal-IPN-Listener/
```

#### Run the Listener

```
# Install Dependencies
npm install

# Start Server
npm start
```

The IPN listener should now be running on http://localhost:8888

## Configure Nginx
```
server {
    if ($host = ipn.mysite.io) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name ipn.mysite.io;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    ssl on;
    ssl_certificate fullchain.pem;
    ssl_certificate_key privkey.pem;
    server_name ipn.mysite.io;
    add_header X-Frame-Options "SAMEORIGIN";
    large_client_header_buffers 4 8k;
    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The IPN listener should now be available on the URL configured when setting up Nginx. To complete setup, [update your IPN url](https://developer.paypal.com/docs/classic/ipn/integration-guide/IPNSetup/) with PayPal and run a test payment.

## Set Environment Variables

| ENV | Required? | Details | Example |
|----------------|-----------|------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `MONGO_URI` | No | What Mongo instance to use. If the ENV is not provided,  `mongodb://localhost/paypal` is used. | `mongodb://user:password@localhost:27018/paypal` |
| `LOG_LOCATION` | No | Override where the IPN log is written. By default the log is written into the app directory. | `/Logs/ipn.log` |
| `PORT` | No | Override the application port. Defaults to 8888. | `8889` |

## Docker

This IPN Listener is also available on [Dockerhub](https://hub.docker.com/r/fairbanksio/paypal-ipn-listener).
```sh
docker run -d -p 8888:8888 --name 'paypal-ipn' fairbanksio/paypal-ipn-listener
```