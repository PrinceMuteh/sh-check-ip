# Safe Haven IP checker

A Next.js application for testing authenticated HTTP requests **from the deployed server**. It supports Bearer tokens and full Authorization values, request bodies, request previews, response status/headers/body, timing, and public IP checks.

## Local development

Use Node.js 22 or newer:

```sh
npm install
npm run dev
```

No `.env` file is required. Open http://localhost:3000 and leave the tool password blank. Optionally copy `.env.example` to `.env.local` to configure access restrictions. No tokens or results are written to disk, browser storage, or application logs.

## Deploy on Render

1. Push this directory to a GitHub repository.
2. In Render, create a **Blueprint** from that repository to use `render.yaml`, or create a **Node Web Service** with build command `npm ci && npm run build` and start command `npm start`.
3. Deploy and open the service URL. Leave the tool password blank, click **Check IPs**, then enter the endpoint and token and send your request. No environment variables are required.

Optional settings in Render’s Environment panel:
- `TOOL_PASSWORD`: a password you choose. Default: empty (no password required). If set, enter it in the page’s tool password field.
- `ALLOWED_HOSTS`: comma-separated exact endpoint hostnames, e.g. `api.example.com,other.example.com`. Default: empty (any public HTTP(S) hostname). Do not include protocols or paths.

With the defaults, anyone who can reach the app can use it to make requests to public endpoints. Your API Bearer token is still supplied separately in the form.

Deploy as a web service because the endpoint calls require a server. Reference: https://render.com/docs/deploy-nextjs-app

## Understanding the IP results

- **Server outbound IP** is observed by `https://api.ipify.org`. This is the relevant side of the connection for server-side allowlisting.
- **Browser IP** is the first value reported by the hosting proxy's forwarded headers. It is informational and is not used for security decisions; direct clients can spoof those headers.
- A server may use multiple outbound addresses. The address observed by the IP lookup service is not proof of the exact IP used for a different destination. Consult Render's service outbound IP ranges and the destination's logs when configuring an allowlist. Reference: https://render.com/docs/outbound-ip-addresses
- A 401/403 response alone does not prove an IP block; it may also indicate an invalid token or insufficient permissions.

## Request behavior

Only public HTTP(S) destinations are supported. Private, loopback, reserved, and link-local IPs are rejected. DNS addresses are validated and the connection is pinned to a validated address. Requests are restricted by `ALLOWED_HOSTS` when it is configured. Redirects are returned without following them so credentials are not forwarded to a different destination.

Each outbound connection has a 20-second timeout. Response bodies are limited to 1 MB; request input is limited to 64 KB. Response bodies are displayed as text, with JSON formatted when possible. Binary downloads and streaming are not supported. Request bodies use `Content-Type: application/json` when present. GET and HEAD requests have no body.

Authorization is redacted in request previews, but the destination may echo it in the response. Do not share response screenshots containing secrets. HTTP destinations transmit credentials without encryption; use HTTPS for real tokens.

Run `npm test` for security boundary checks and `npm run build` for production validation.
