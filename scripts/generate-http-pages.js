// Generates /http/<code> detail pages and /http/ index landing.
// Run via: node scripts/generate-http-pages.js
//
// Each page: unique 350-700 word content, FAQ schema, breadcrumbs,
// related-code links, real curl example. Output goes to public/http/.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/http');

// ---------- DATA ----------
// Each entry: { code, name, klass, summary, meaning, when, causes, fixes,
//               example, related, faqs, rfc }
// klass is one of '1xx','2xx','3xx','4xx','5xx'.
// causes/fixes empty for non-error codes; example optional.

const CODES = [
  // ===== 1xx Informational =====
  {
    code: 100, name: 'Continue', klass: '1xx',
    summary: 'The server has received the request headers and the client should proceed to send the request body.',
    meaning: `100 Continue is part of HTTP's expectation handshake. Before a client sends a large request body, it can include the header <code>Expect: 100-continue</code>. The server inspects the request headers and replies with 100 if it is willing to accept the body, or with a final status (like 401 or 413) if it is not. This avoids the client wasting bandwidth uploading a body that will be rejected.`,
    when: 'Servers return 100 in response to an Expect: 100-continue header on a request that will be accepted. If the server has no opinion or the request body is small, it can skip the dance entirely.',
    causes: [],
    fixes: [],
    example: `curl -v -H "Expect: 100-continue" -d @big.json https://api.example.com/upload`,
    related: [101, 200, 417],
    faqs: [
      { q: 'When does a client send Expect: 100-continue?', a: 'Most HTTP libraries set it automatically for requests with a body larger than ~1KB. Curl sets it for any -d or -T upload by default.' },
      { q: 'What if the server never sends 100?', a: 'Clients implement a short timeout (typically 1 second) and proceed to send the body anyway. The handshake is best-effort.' },
      { q: 'Should I disable Expect: 100-continue?', a: 'Sometimes. Some servers and proxies handle it poorly and stall. To disable in curl: -H "Expect:". To disable in requests/Python: set headers["Expect"] = "".' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 101, name: 'Switching Protocols', klass: '1xx',
    summary: 'The server is switching protocols as requested by the client, typically upgrading from HTTP/1.1 to WebSocket.',
    meaning: `101 Switching Protocols is the response that establishes a WebSocket connection. The client sends a normal HTTP/1.1 GET request with <code>Upgrade: websocket</code> and <code>Connection: Upgrade</code> headers; the server responds with 101 and the connection then becomes a WebSocket carrying its own framed protocol. You also see 101 used for HTTP/2 upgrades over cleartext (h2c), though most modern HTTP/2 uses TLS ALPN instead.`,
    when: 'Servers return 101 when they accept an Upgrade request and switch the connection to a different protocol. After 101, the connection is no longer HTTP.',
    causes: [],
    fixes: [],
    example: `curl --include --no-buffer \\
  --header "Connection: Upgrade" \\
  --header "Upgrade: websocket" \\
  --header "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \\
  --header "Sec-WebSocket-Version: 13" \\
  https://example.com/ws`,
    related: [100, 426, 200],
    faqs: [
      { q: 'Is 101 the same as a successful WebSocket connection?', a: 'Yes. After receiving 101, the client and server speak WebSocket over the same TCP connection.' },
      { q: 'Do HTTP/2 or HTTP/3 use 101?', a: 'HTTP/2 over TLS uses ALPN (no 101). HTTP/2 over cleartext (h2c) uses 101 to upgrade. HTTP/3 over QUIC has no upgrade dance.' },
      { q: 'Can I refuse an Upgrade?', a: 'Yes. The server can simply respond with a normal HTTP status (200, 400, etc.) and ignore the upgrade headers.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 103, name: 'Early Hints', klass: '1xx',
    summary: 'The server hints at resources the client can preload while the final response is still being prepared.',
    meaning: `103 Early Hints is a performance optimization. The server sends 103 with <code>Link: &lt;style.css&gt;; rel=preload; as=style</code> headers <em>before</em> the real response is ready. The browser uses those hints to start fetching critical resources (CSS, fonts, scripts) in parallel, shaving time off the perceived page load. Once the actual response is ready, the server sends the final status (usually 200) along with the full body.`,
    when: 'Servers return 103 when they know which subresources a page needs but cannot yet produce the page itself (e.g. waiting on a slow database query). Cloudflare, Fastly, and most modern Node frameworks support 103.',
    causes: [],
    fixes: [],
    example: `# Server-side (Express) usage:
res.writeEarlyHints({ link: '</css/main.css>; rel=preload; as=style' });
// ... later, after data is ready:
res.send(html);`,
    related: [200, 304, 425],
    faqs: [
      { q: 'Which browsers support 103?', a: 'Chrome 103+, Edge 103+, Safari 17+, and Firefox 120+. Older browsers ignore it safely.' },
      { q: 'Do I need server changes to use 103?', a: 'Yes. The server must send the early hints before the real response. Express, Fastify, Cloudflare Workers, and Nginx all support it; Apache support is limited.' },
      { q: 'When should I NOT use 103?', a: 'When the response is fast (under 100ms). The hint costs a round trip; if the body arrives before the browser finishes parsing the hint, you gain nothing.' },
    ],
    rfc: 'RFC 8297',
  },

  // ===== 2xx Success =====
  {
    code: 200, name: 'OK', klass: '2xx',
    summary: 'The request succeeded. The response body contains whatever the request was for.',
    meaning: `200 OK is the most common status code on the web. It means the request was understood, processed successfully, and the response body contains the requested representation. For GET requests, the body is the resource. For POST that returns a result, the body is the result. For HEAD requests, 200 is returned with no body, just the headers.`,
    when: 'Servers return 200 for any successful request that returns content. If you would otherwise return 200 with no body, consider 204 No Content instead, which is more semantically correct.',
    causes: [],
    fixes: [],
    example: `curl -i https://api.example.com/users/42

HTTP/2 200
content-type: application/json
{"id":42,"name":"Ada"}`,
    related: [201, 204, 206],
    faqs: [
      { q: 'Is 200 always JSON?', a: 'No. 200 is the status, the body type is whatever Content-Type says: HTML, JSON, image, plain text, or anything else.' },
      { q: 'Can a POST return 200?', a: 'Yes. 201 is preferred when a new resource was created at a specific URL. 200 is appropriate when the POST returns a result (a search query, an action result) without creating a new addressable resource.' },
      { q: 'What is the difference between 200 and 204?', a: '200 has a response body. 204 explicitly has no body. Use 204 for DELETE confirmations and PUT updates that do not return content.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 201, name: 'Created', klass: '2xx',
    summary: 'The request succeeded and a new resource was created as a result.',
    meaning: `201 Created indicates that a POST or PUT request resulted in the creation of a new resource. The response should include a <code>Location</code> header pointing at the new resource's URL, and typically includes the resource representation in the body. 201 is more informative than 200 for creation operations because it tells API consumers "this is a new thing" rather than just "your request worked".`,
    when: 'Servers should return 201 (not 200) when a POST or PUT request creates a new addressable resource. Always include a Location header with the new URL.',
    causes: [],
    fixes: [],
    example: `curl -i -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Ada"}'

HTTP/2 201
location: /users/42
content-type: application/json
{"id":42,"name":"Ada","created_at":"2026-05-05T14:00:00Z"}`,
    related: [200, 202, 204],
    faqs: [
      { q: 'Should the Location header be absolute or relative?', a: 'Either works. Absolute URLs are clearer for clients that follow redirects across hosts. Relative URLs are common in single-domain APIs.' },
      { q: 'Is 201 only for POST?', a: 'No. PUT can return 201 if it created a new resource (versus 200 if it replaced an existing one). PATCH usually returns 200.' },
      { q: 'Can 201 have an empty body?', a: 'Yes, technically. But returning the new resource representation is more useful so the client does not need to make a follow-up GET.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 202, name: 'Accepted', klass: '2xx',
    summary: 'The request has been accepted for processing but has not yet completed.',
    meaning: `202 Accepted is the async-job status code. The server has validated the request and queued it, but the work is not yet done. The response should include a way to check progress, typically a status URL in the <code>Location</code> header or a job ID in the body. 202 is appropriate for long-running operations like video transcoding, batch imports, or any work that exceeds reasonable HTTP response time.`,
    when: 'Servers return 202 when they will perform the work asynchronously. Always give the client a way to poll for completion or subscribe to a webhook.',
    causes: [],
    fixes: [],
    example: `curl -i -X POST https://api.example.com/exports

HTTP/2 202
location: /jobs/abc123
content-type: application/json
{"job_id":"abc123","status":"queued","poll_url":"/jobs/abc123"}`,
    related: [200, 201, 303],
    faqs: [
      { q: 'How does the client know when the job is done?', a: 'Two options: poll the URL given in Location until it returns a final status, or accept a webhook callback URL on the original request and have the server POST to it on completion.' },
      { q: 'Is 202 the same as 201?', a: 'No. 201 means the resource was created synchronously and is ready now. 202 means the work is still in progress.' },
      { q: 'Should 202 include progress data?', a: 'Often yes. Include a percentage, ETA, or status field so clients can show useful progress UI without polling more than necessary.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 204, name: 'No Content', klass: '2xx',
    summary: 'The request succeeded and there is intentionally no response body.',
    meaning: `204 No Content is a successful response with an empty body. It is most commonly used for DELETE requests (the resource is gone, there is nothing to return), PUT requests that update a resource without returning a representation, and POST requests that trigger an action without producing a result. The response must not include a body, and most clients will skip body-parsing entirely on 204.`,
    when: 'Return 204 when the request succeeded and there is genuinely no body to send. Do not return 204 if the body is just empty by accident; use 200 with an empty JSON object in that case to avoid client confusion.',
    causes: [],
    fixes: [],
    example: `curl -i -X DELETE https://api.example.com/users/42

HTTP/2 204
date: Tue, 05 May 2026 14:00:00 GMT`,
    related: [200, 205, 304],
    faqs: [
      { q: 'Can 204 have headers?', a: 'Yes. 204 forbids a body but allows any headers, including Cache-Control, ETag, and custom headers. Just no body bytes.' },
      { q: 'What if I want to return JSON?', a: 'Use 200, not 204. 204 is specifically the "no body" status code.' },
      { q: 'Do browsers handle 204 in fetch()?', a: 'Yes. response.body is null on 204. Calling response.json() on a 204 will throw, so check status before parsing.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 206, name: 'Partial Content', klass: '2xx',
    summary: 'The server is delivering only part of the resource, in response to a Range request from the client.',
    meaning: `206 Partial Content is what makes resumable downloads and video seeking work. When a client sends <code>Range: bytes=1024-2047</code>, the server responds with 206 and just those bytes, plus a <code>Content-Range</code> header describing what was sent and the full size. Browsers use 206 for video scrubbing; download managers use it to resume interrupted transfers; cloud storage clients use it to parallelize large file downloads.`,
    when: 'Return 206 only in response to a Range request, and only when you can satisfy the range. If the range is invalid, return 416 Range Not Satisfiable.',
    causes: [],
    fixes: [],
    example: `curl -i -H "Range: bytes=0-1023" https://example.com/video.mp4

HTTP/2 206
content-range: bytes 0-1023/5242880
content-length: 1024
[binary bytes]`,
    related: [200, 416, 304],
    faqs: [
      { q: 'How do I make my server support 206?', a: 'Most HTTP frameworks (Nginx, Apache, Express with the right middleware) support range requests on static files automatically. For dynamic content, you need to parse the Range header and seek into your data source.' },
      { q: 'Can I parallelize a download with multiple 206 requests?', a: 'Yes. This is how aria2 and many cloud-storage clients speed up large downloads: split the file into N ranges, request each one concurrently, stitch the bytes back together.' },
      { q: 'What about HEAD requests?', a: 'A HEAD response should include Accept-Ranges: bytes if the server supports range requests, so clients know they can use them.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 207, name: 'Multi-Status', klass: '2xx',
    summary: 'The response contains a result for multiple sub-operations, each with its own status.',
    meaning: `207 Multi-Status is a WebDAV extension. When a single request operates on multiple resources (like a batch update), the response body contains an XML or JSON document where each sub-operation has its own status code. Some non-WebDAV APIs adopt 207 for batch endpoints, though 200 with a JSON body of per-item results is more common.`,
    when: 'Return 207 from batch endpoints where individual items can succeed or fail independently. The response body must enumerate per-item statuses.',
    causes: [],
    fixes: [],
    example: `HTTP/2 207
content-type: application/xml
<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response><d:href>/a</d:href><d:status>HTTP/1.1 200 OK</d:status></d:response>
  <d:response><d:href>/b</d:href><d:status>HTTP/1.1 404 Not Found</d:status></d:response>
</d:multistatus>`,
    related: [200, 422, 424],
    faqs: [
      { q: 'Is 207 standard for REST APIs?', a: 'No. 207 is a WebDAV code. REST batch endpoints typically return 200 with a JSON array of per-item results.' },
      { q: 'Can I use 207 with JSON?', a: 'Yes, the status code does not require XML. But most clients do not understand 207 by default, so document carefully if you use it.' },
    ],
    rfc: 'RFC 4918',
  },

  // ===== 3xx Redirection =====
  {
    code: 301, name: 'Moved Permanently', klass: '3xx',
    summary: 'The resource has permanently moved to a new URL given in the Location header.',
    meaning: `301 Moved Permanently is the redirect that tells search engines and clients "this URL is dead, use the new one forever". Browsers update bookmarks. Search engines transfer most of the SEO ranking signal to the new URL. CDN edges and HTTP caches cache the redirect aggressively. Use 301 only when you are confident the change is permanent; if there is any chance of moving back, use 302 or 307 instead.`,
    when: 'Return 301 when a URL has permanently changed. Common cases: domain migration, restructuring URL paths, switching from www to apex (or vice versa), HTTP-to-HTTPS upgrades.',
    causes: [],
    fixes: [],
    example: `curl -i https://old.example.com/page

HTTP/2 301
location: https://new.example.com/page
cache-control: public, max-age=31536000`,
    related: [302, 307, 308],
    faqs: [
      { q: 'Does 301 transfer SEO ranking?', a: 'Yes. Google has confirmed 301 redirects pass the full ranking signal (or near-full) to the new URL. 302 does not.' },
      { q: 'Can I change a 301 later?', a: 'In theory yes, but browsers and proxies cache 301 aggressively. Users with the old redirect cached will keep going to the new URL until the cache expires (or they clear it). For non-permanent moves, use 302 or 307.' },
      { q: '301 vs 308?', a: '301 historically allows the client to change POST to GET on redirect. 308 forbids method change. For modern APIs, 308 is usually safer.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 302, name: 'Found', klass: '3xx',
    summary: 'The resource is temporarily at a different URL. Use the new URL for this request only.',
    meaning: `302 Found is a temporary redirect. The original URL is still the canonical one; the client should not update bookmarks, and search engines should not transfer ranking. 302 is commonly used for login redirects (after auth, redirect to the originally-requested page), A/B testing (redirect 50% of traffic to a variant), and feature flags. The historic ambiguity around method changes (some clients changed POST to GET, some did not) led to the introduction of 303 and 307 with explicit semantics.`,
    when: 'Return 302 for temporary redirects where the original URL stays canonical. For redirects after a POST that should become a GET, use 303 instead. For temporary redirects that must preserve the method, use 307.',
    causes: [],
    fixes: [],
    example: `curl -i https://example.com/admin

HTTP/2 302
location: /login?return=/admin`,
    related: [301, 303, 307],
    faqs: [
      { q: 'Why does 302 sometimes change POST to GET?', a: 'Historical browsers did this. The HTTP spec was ambiguous, so RFC introduced 303 (always GET) and 307 (preserve method) to disambiguate. Modern clients tend to preserve the method on 302, but you cannot rely on it.' },
      { q: 'Should I use 302 or 307?', a: 'For new APIs, 307. For browser-facing redirects where you do not care about method preservation, 302 still works.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 303, name: 'See Other', klass: '3xx',
    summary: 'The response to your request can be found at a different URL, and you should fetch it with GET.',
    meaning: `303 See Other is the "POST/Redirect/GET" status code. It is the canonical way to redirect after a form submission: the client POSTs to /submit, the server processes the data and responds with 303 pointing at /thanks; the browser does a GET on /thanks. This avoids the duplicate-submission problem (refresh the page after a POST and most browsers warn "do you want to resubmit?"). With 303, refresh just reloads /thanks, which is idempotent.`,
    when: 'Return 303 after a state-changing POST or PUT, when you want the client to GET a different URL to see the result. Always pair with a meaningful Location header.',
    causes: [],
    fixes: [],
    example: `curl -i -X POST -d "name=Ada" https://example.com/users

HTTP/2 303
location: /users/42`,
    related: [302, 307, 201],
    faqs: [
      { q: 'How is 303 different from 302?', a: '303 explicitly tells the client to use GET on the new URL, even if the original request was POST. 302 historically left this ambiguous.' },
      { q: 'Is 303 cached?', a: 'No, 303 responses are not cached by default. Use Cache-Control headers if you want different behavior.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 304, name: 'Not Modified', klass: '3xx',
    summary: 'The cached version of the resource is still valid; no body is sent.',
    meaning: `304 Not Modified is the cornerstone of HTTP conditional caching. The client sends a request with <code>If-None-Match: "etag-value"</code> or <code>If-Modified-Since: &lt;date&gt;</code>; if the resource has not changed, the server responds with 304 and an empty body. The client uses its cached copy. This saves bandwidth and latency on repeat requests for unchanged resources, especially images, CSS, JS, and API data that does not change between requests.`,
    when: 'Return 304 when a conditional request indicates the cached version matches the current resource. Always include the ETag (or Last-Modified) header so the client can re-validate later.',
    causes: [],
    fixes: [],
    example: `curl -i -H 'If-None-Match: "abc123"' https://example.com/style.css

HTTP/2 304
etag: "abc123"
cache-control: public, max-age=3600`,
    related: [200, 412, 416],
    faqs: [
      { q: 'Can 304 have a body?', a: 'No. 304 must have an empty body. Headers are allowed and encouraged (ETag, Cache-Control).' },
      { q: 'Difference between ETag and Last-Modified?', a: 'ETag is an opaque identifier (often a hash); Last-Modified is a timestamp. ETag is more reliable because timestamps have one-second resolution and clock-skew issues. Use ETag if you can.' },
      { q: 'Is 304 fast?', a: 'Yes. The server checks ETag/Last-Modified without generating the full response. CDNs handle 304 at the edge, often without ever hitting the origin.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 307, name: 'Temporary Redirect', klass: '3xx',
    summary: 'The resource is temporarily at a different URL. Use the same HTTP method to access it.',
    meaning: `307 Temporary Redirect is a stricter version of 302. The key difference: 307 forbids the client from changing the request method on the redirect. If the original request was POST, the redirect target also gets POST. This is the right code for redirecting state-changing requests where you cannot afford method ambiguity, like API endpoints behind a load balancer doing failover.`,
    when: 'Return 307 for temporary redirects that must preserve the HTTP method. Common cases: API failover, regional routing, redirecting POST/PUT/PATCH/DELETE without losing the body.',
    causes: [],
    fixes: [],
    example: `curl -i -X POST -d "x=1" https://api.example.com/v1/users

HTTP/2 307
location: https://api-east.example.com/v1/users`,
    related: [302, 308, 303],
    faqs: [
      { q: 'When should I use 307 instead of 302?', a: 'Whenever the request might be POST/PUT/PATCH and you cannot afford method ambiguity. For browser-facing GET redirects, 302 is still common.' },
      { q: '307 vs 308?', a: '307 is temporary, 308 is permanent. Both preserve the method. 308 is cached aggressively; 307 is not.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 308, name: 'Permanent Redirect', klass: '3xx',
    summary: 'The resource has permanently moved and the same HTTP method must be used at the new URL.',
    meaning: `308 Permanent Redirect is a method-preserving 301. The URL has moved forever, and the client must use the same method (POST stays POST, PUT stays PUT). For modern APIs, 308 is the right code for permanent moves of write endpoints because it eliminates the historical 301 method-change ambiguity. For static GET resources, 301 is still fine and more widely understood.`,
    when: 'Return 308 for permanent moves of API endpoints, especially write endpoints (POST/PUT/PATCH/DELETE) where you need to preserve the method.',
    causes: [],
    fixes: [],
    example: `curl -i -X POST https://api.example.com/v1/users

HTTP/2 308
location: https://api.example.com/v2/users`,
    related: [301, 307, 302],
    faqs: [
      { q: 'Do all clients support 308?', a: 'Modern ones do. Very old HTTP libraries may not understand 308 and treat it as an error; in that case, fall back to 301 for GET endpoints.' },
      { q: 'Does 308 transfer SEO ranking?', a: 'Yes. Google treats 308 the same as 301 for ranking purposes.' },
    ],
    rfc: 'RFC 9110',
  },

  // ===== 4xx Client Errors =====
  {
    code: 400, name: 'Bad Request', klass: '4xx',
    summary: 'The server cannot process the request because the client sent something invalid.',
    meaning: `400 Bad Request is the catch-all client-error code. It means the request is malformed in a way that prevents the server from processing it: invalid JSON, missing required fields, type mismatches, oversized parameters, or any syntactic problem with the request itself. 400 is about the client sending bad data, not about authentication, permissions, or missing resources (those are 401, 403, 404 respectively).`,
    when: 'Return 400 when the request is syntactically invalid or contains data the server cannot parse. Use 422 instead when the request is well-formed but semantically invalid (e.g. business rule violation).',
    causes: [
      'Malformed JSON body (missing comma, unclosed bracket)',
      'Required field missing from the request body',
      'Wrong data type (sending a string where a number is expected)',
      'Query parameter contains invalid characters',
      'Request size exceeds a server-side limit',
      'Content-Type header does not match the body format',
    ],
    fixes: [
      'Validate JSON locally before sending: <code>echo $BODY | jq .</code>',
      'Read the response body, most APIs include a specific error message',
      'Check the API documentation for required fields',
      'Verify Content-Type matches what you are sending',
      'For binary uploads, use --data-binary, not -d',
    ],
    example: `curl -i -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":}'

HTTP/2 400
content-type: application/json
{"error":"Invalid JSON","details":"Unexpected '}' at position 9"}`,
    related: [401, 422, 415],
    faqs: [
      { q: 'How is 400 different from 422?', a: '400 is for malformed requests (broken JSON, missing required fields). 422 is for well-formed requests that violate business rules (email already taken, age must be positive). The distinction is: can the server parse this at all?' },
      { q: 'How do I see the actual error?', a: 'Almost every API includes a JSON error body with details. Always read the body on 4xx, do not just look at the status code.' },
      { q: 'Can a 400 be retried?', a: 'No, not without changes. A 400 means the request itself is wrong. Retrying the same request will get the same 400.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 401, name: 'Unauthorized', klass: '4xx',
    summary: 'The request requires authentication that was not provided or was invalid.',
    meaning: `401 Unauthorized is the misnamed authentication-required code. Despite the name, 401 is about <em>authentication</em> (proving who you are), not <em>authorization</em> (whether you are allowed). The server is saying "I do not know who you are, log in and try again". Servers must include a <code>WWW-Authenticate</code> header on 401 responses to tell clients which auth method to use (Basic, Bearer, etc.).`,
    when: 'Return 401 when no credentials are provided, or the credentials are invalid (wrong password, expired token, malformed signature). For valid credentials but insufficient permissions, return 403 Forbidden instead.',
    causes: [
      'Missing Authorization header',
      'Bearer token expired (most common in 2026)',
      'Bearer token revoked or rotated',
      'Wrong API key for the environment (staging key on production)',
      'Basic auth password incorrect',
      'JWT signature does not validate',
      'OAuth token scope does not include the resource',
    ],
    fixes: [
      'Verify the Authorization header is present and correctly formatted',
      'Refresh the token if your auth provider supports refresh tokens',
      'Check token expiry: <code>echo $TOKEN | cut -d. -f2 | base64 -d | jq .exp</code> (for JWTs)',
      'Confirm you are using the right environment (prod vs staging)',
      'Re-issue the token if it was rotated',
      'For Basic auth: <code>curl -u user:pass URL</code>',
    ],
    example: `curl -i https://api.example.com/me

HTTP/2 401
www-authenticate: Bearer realm="api"
content-type: application/json
{"error":"missing or invalid token"}`,
    related: [403, 407, 419],
    faqs: [
      { q: 'What is the difference between 401 and 403?', a: '401 means "I do not know who you are". 403 means "I know who you are, but you cannot do this". 401 implies "log in and retry"; 403 means "no amount of retrying will help".' },
      { q: 'Should an API return 401 or 404 for non-existent resources when not authenticated?', a: 'Both are defensible. 401 is technically more correct (you have not authenticated). 404 leaks less information about resource existence. Pick one and apply consistently.' },
      { q: 'Can a 401 include a body?', a: 'Yes. Most JSON APIs do, with a brief error message. The WWW-Authenticate header is mandatory; the body is optional but useful.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 402, name: 'Payment Required', klass: '4xx',
    summary: 'Reserved for future use; in practice, used by some APIs to signal the caller has run out of credits.',
    meaning: `402 Payment Required was reserved decades ago for some envisioned digital-payment system that never materialized in mainstream HTTP. In 2026, with the rise of agent-payable APIs and credit-based pricing, 402 is finally seeing real usage: services like TerminalFeed return 402 when an authenticated caller has run out of credits or has not yet purchased any. The response should include details on how to add funds.`,
    when: 'Return 402 when authentication succeeded but the caller has insufficient credits, expired billing, or unpaid balance. Include a Link header or response body pointing to the top-up endpoint.',
    causes: [
      'Account balance is zero',
      'Subscription expired',
      'Trial period ended',
      'Per-call credit cost exceeds remaining balance',
    ],
    fixes: [
      'Top up credits via the payment endpoint',
      'Renew subscription',
      'Check current balance: <code>curl -H "Authorization: Bearer $TOKEN" /api/payment/balance</code>',
    ],
    example: `curl -i -H "Authorization: Bearer $TOKEN" https://api.example.com/expensive-call

HTTP/2 402
content-type: application/json
link: <https://api.example.com/payment/info>; rel="payment"
{"error":"insufficient_credits","balance":0,"required":2,"top_up":"/api/payment/buy-credits"}`,
    related: [401, 403, 429],
    faqs: [
      { q: 'Is 402 standard?', a: 'It is in the HTTP spec but was reserved for future use. Modern usage in agent-payable APIs is a recent convention, not a strict standard.' },
      { q: 'Should I use 403 instead?', a: '403 is also acceptable for billing failures. 402 is more specific and lets clients distinguish "fix billing" from "you do not have permission".' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 403, name: 'Forbidden', klass: '4xx',
    summary: 'The server understood the request and knows who you are, but refuses to authorize it.',
    meaning: `403 Forbidden is the authorization-failure code. Unlike 401, which means "we do not know who you are", 403 means "we know exactly who you are, and you are not allowed to do this". The classic 403 cases: trying to access another user's data, attempting an admin-only operation as a regular user, or hitting a resource that has been blocked at the firewall level (Cloudflare 403, AWS WAF 403, etc.).`,
    when: 'Return 403 when authentication succeeded but the user lacks the permission, scope, or role to perform the action. Do not return 403 for missing auth (that is 401) or missing resources (that is 404).',
    causes: [
      'User lacks the required role or permission',
      'OAuth token does not include the necessary scope',
      'IP address blocked by the WAF or firewall rule',
      'Cloudflare or another CDN blocked the request as suspicious',
      'CORS preflight failed (the OPTIONS response did not allow the origin)',
      'Resource is restricted to a specific tenant the caller does not belong to',
    ],
    fixes: [
      'Verify the token has the required scope or permission',
      'Check the response body for a specific reason (rate-limit, geo-block, etc.)',
      'For CORS errors, inspect the OPTIONS preflight response, not the actual request',
      'For WAF 403s, check Cloudflare / AWS logs for the rule that fired',
      'For permission errors, request elevation or use a token with broader scope',
    ],
    example: `curl -i -H "Authorization: Bearer $READ_ONLY_TOKEN" \\
  -X DELETE https://api.example.com/users/42

HTTP/2 403
content-type: application/json
{"error":"forbidden","reason":"token lacks 'users:write' scope"}`,
    related: [401, 404, 451],
    faqs: [
      { q: '401 vs 403?', a: '401 = unauthenticated (who are you?). 403 = unauthorized (we know you, you cannot do this).' },
      { q: 'Should 403 reveal why?', a: 'Sometimes yes (helps debugging), sometimes no (avoids leaking information). For internal APIs, be specific. For public APIs facing potential attackers, be vague.' },
      { q: 'Why am I getting 403 from Cloudflare?', a: 'Cloudflare returns 403 when its WAF, bot management, or firewall rules block your request. Check the Cloudflare event log for the specific rule that fired.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 404, name: 'Not Found', klass: '4xx',
    summary: 'The server cannot find the requested resource.',
    meaning: `404 Not Found is the most famous status code on the web. The URL does not match any resource the server knows about. This can mean the resource was deleted, the URL is misspelled, the resource never existed, or (deliberately) the resource exists but the server is hiding it from this caller for security reasons. 404 makes no statement about whether the resource ever existed; for "this used to exist and is permanently gone", 410 Gone is more accurate.`,
    when: 'Return 404 when the requested resource does not exist at the given URL. Do not return 404 for permission failures (use 403) or for malformed requests (use 400).',
    causes: [
      'URL typo (most common cause in browsers)',
      'Resource was deleted',
      'Resource never existed',
      'Wrong API version in the path (/v1 vs /v2)',
      'Trailing slash mismatch on a strict server',
      'Case sensitivity (some servers treat /Foo and /foo differently)',
      'Resource is hidden from the current caller for security reasons',
    ],
    fixes: [
      'Double-check the URL for typos',
      'Verify the API version path component',
      'Check the server logs for the exact request path received',
      'Confirm the resource still exists (was it deleted?)',
      'For static files, verify the file is in the build output and deployed',
      'For dynamic routes, check the route definition matches the URL pattern',
    ],
    example: `curl -i https://api.example.com/users/999999

HTTP/2 404
content-type: application/json
{"error":"user not found","id":"999999"}`,
    related: [410, 403, 301],
    faqs: [
      { q: '404 vs 410?', a: '404 means "not here" (might never have existed, might come back). 410 means "permanently gone, do not look for it again". 410 is rarely used; 404 is the catch-all.' },
      { q: 'Should I return 404 or 403 for resources the user lacks permission to see?', a: 'Either is defensible. 404 leaks less (does not confirm the resource exists). 403 is more honest. Pick one and apply consistently.' },
      { q: 'Why does Google sometimes show "soft 404"?', a: 'A soft 404 is a 200 response that looks like a 404 page (e.g. "page not found" content with a 200 status). Google penalizes soft 404s; always return a real 404 status for missing pages.' },
      { q: 'Do 404s hurt SEO?', a: 'A few are fine and expected. Mass 404s on previously-indexed URLs hurt rankings. Use 301 to redirect to a relevant replacement when possible.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 405, name: 'Method Not Allowed', klass: '4xx',
    summary: 'The HTTP method is not supported for this resource.',
    meaning: `405 Method Not Allowed means the URL exists but does not accept the method you used. Trying to POST to a read-only endpoint, DELETE on a resource that does not support deletion, or PATCH on something that only accepts PUT all yield 405. The response must include an <code>Allow</code> header listing the methods the resource <em>does</em> support, so the client can self-correct without trial-and-error.`,
    when: 'Return 405 when the resource exists but the method is not supported. Always include an Allow header.',
    causes: [
      'Sending POST to a GET-only endpoint',
      'Sending DELETE to a resource that does not support deletion',
      'API uses PUT but client sent PATCH (or vice versa)',
      'Method not implemented yet on the server side',
    ],
    fixes: [
      'Read the Allow response header to see what methods are supported',
      'Check the API documentation',
      'Verify the curl -X flag matches the documented method',
      'For frameworks that auto-generate routes, confirm the route definition includes the method you need',
    ],
    example: `curl -i -X DELETE https://api.example.com/health

HTTP/2 405
allow: GET, HEAD
content-type: application/json
{"error":"method not allowed"}`,
    related: [400, 501, 200],
    faqs: [
      { q: 'Is 405 the same as 501?', a: 'No. 405 means the server understands the method generally but does not allow it on this resource. 501 means the server does not implement the method at all.' },
      { q: 'Why is the Allow header required?', a: 'It tells clients which methods to use without requiring a separate OPTIONS request. Skipping it is a spec violation and makes debugging harder.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 406, name: 'Not Acceptable', klass: '4xx',
    summary: 'The server cannot produce a response matching the client\'s Accept headers.',
    meaning: `406 Not Acceptable is content negotiation rejection. The client said <code>Accept: application/xml</code> but the server only produces JSON, so the server returns 406 rather than send the wrong format. In practice, 406 is rare; most servers default to JSON regardless of Accept headers, or return whatever they have. The response body should ideally include a list of acceptable representations the client could ask for instead.`,
    when: 'Return 406 only when you genuinely cannot produce any of the requested content types and you do not want to fall back to a default.',
    causes: [
      'Accept header lists only types the server cannot produce',
      'Strict content-type negotiation enabled',
      'Client requested XML from a JSON-only API',
    ],
    fixes: [
      'Send <code>Accept: */*</code> or omit the header to accept anything',
      'Send <code>Accept: application/json</code> for most modern APIs',
      'Check API docs for supported Content-Type values',
    ],
    example: `curl -i -H "Accept: application/xml" https://api.example.com/users

HTTP/2 406
content-type: application/json
{"error":"only application/json supported"}`,
    related: [400, 415, 200],
    faqs: [
      { q: 'How is 406 different from 415?', a: '406 is about the response Content-Type the client will accept. 415 is about the request Content-Type the server can parse.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 408, name: 'Request Timeout', klass: '4xx',
    summary: 'The server gave up waiting for the client to finish sending the request.',
    meaning: `408 Request Timeout means the server timed out waiting for the request body. The client opened the connection, sent some headers, then went idle for too long before completing the request. This is different from a server-side processing timeout (504 Gateway Timeout). 408 is rare on modern HTTP/2 connections; it shows up most often on slow uploads, flaky mobile networks, or when keep-alive connections are reused after the server's idle timeout.`,
    when: 'Return 408 when a connection is idle past the server\'s read timeout while waiting for the request body or remaining headers.',
    causes: [
      'Slow or unstable network connection',
      'Client opened a connection but did not send the full request',
      'Keep-alive connection reused after server-side idle timeout',
      'Large file upload over a slow link',
    ],
    fixes: [
      'Retry the request',
      'For uploads, use a CDN or chunked transfer to avoid long single-stream uploads',
      'Configure HTTP client to respect server keep-alive timeout',
      'Check network connectivity (ping, traceroute)',
    ],
    example: `HTTP/2 408
content-type: text/plain
Request timed out`,
    related: [504, 503, 425],
    faqs: [
      { q: '408 vs 504?', a: '408 is the client failing to send the request in time. 504 is an upstream server failing to respond in time.' },
      { q: 'Should I retry on 408?', a: 'Yes, with exponential backoff. 408 is transient, retrying usually succeeds.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 409, name: 'Conflict', klass: '4xx',
    summary: 'The request conflicts with the current state of the resource.',
    meaning: `409 Conflict signals that the request cannot be completed because of a conflict with the resource's current state. Classic cases: trying to PUT a resource version that is older than the server's (lost-update protection), creating a resource that already exists with a unique-key collision, or DELETE-ing a resource that has dependents. 409 is not "permission denied" (that is 403) or "validation error" (that is 422); it is specifically about state-based conflicts.`,
    when: 'Return 409 when the request is well-formed and authorized but conflicts with current state. Always include a body explaining the conflict.',
    causes: [
      'Optimistic concurrency control: ETag/version mismatch on PUT',
      'Unique constraint violation on POST (email already exists)',
      'DELETE on a resource with dependents (foreign key constraint)',
      'Two clients writing to the same resource simultaneously',
    ],
    fixes: [
      'GET the latest version of the resource, merge changes, retry',
      'For unique-key collisions, use a different value or retrieve the existing resource',
      'For dependent-resource conflicts, delete the dependents first',
      'Implement client-side retry with conflict resolution (merge, prompt user, etc.)',
    ],
    example: `curl -i -X PUT -H 'If-Match: "v1"' -d '{"name":"Ada"}' https://api.example.com/users/42

HTTP/2 409
content-type: application/json
{"error":"version conflict","current_version":"v3","your_version":"v1"}`,
    related: [412, 422, 423],
    faqs: [
      { q: '409 vs 412?', a: '412 is specifically about precondition failure (If-Match, If-None-Match). 409 is the general state-conflict code, including unique-key collisions, foreign-key issues, and concurrent updates without explicit preconditions.' },
      { q: 'Should I retry on 409?', a: 'Only with new data. Retrying the same request with the same conflicting state will get the same 409.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 410, name: 'Gone', klass: '4xx',
    summary: 'The resource is permanently gone and will not return.',
    meaning: `410 Gone is the more honest version of 404. Where 404 means "not found" (with no statement about why), 410 specifically means "this resource existed, was intentionally removed, and will not come back". Search engines treat 410 differently than 404: a 410 page is removed from the index faster than a 404 (which Google retries for weeks before giving up). Use 410 when you delete something permanently and want it removed from search results promptly.`,
    when: 'Return 410 when a resource has been permanently deleted and you do not plan to bring it back. For unknown URLs, use 404.',
    causes: [],
    fixes: [],
    example: `curl -i https://example.com/old-page

HTTP/2 410
content-type: text/html
<html><body>This page is permanently gone.</body></html>`,
    related: [404, 301, 451],
    faqs: [
      { q: 'Why does 410 deindex faster than 404?', a: 'Google interprets 410 as a definitive signal. 404 is treated as possibly-temporary, so Google retries for weeks before removing the URL. 410 says "stop crawling immediately".' },
      { q: 'Should I use 410 for deleted user profiles?', a: 'Yes if you want them deindexed quickly. Pair with a brief explanation page (in the body) for human visitors.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 411, name: 'Length Required', klass: '4xx',
    summary: 'The request lacks a Content-Length header that the server requires.',
    meaning: `411 Length Required is rare in modern HTTP. The server is rejecting a request because it has a body but no Content-Length header (and the server does not support chunked transfer encoding for this endpoint). Most modern HTTP clients set Content-Length automatically, so 411 mostly shows up when handcrafting requests or using ancient libraries.`,
    when: 'Return 411 when your server cannot handle requests without a Content-Length and the client did not send one.',
    causes: [
      'Handcrafted HTTP request without Content-Length',
      'Client streamed body without specifying length',
      'Older HTTP/1.0 client',
    ],
    fixes: [
      'Add Content-Length header to the request',
      'Or use Transfer-Encoding: chunked if the server supports it',
      'Most modern HTTP libraries set this automatically',
    ],
    example: `HTTP/2 411
content-type: text/plain
Content-Length header required`,
    related: [400, 413, 422],
    faqs: [
      { q: 'Why is 411 rare?', a: 'Modern HTTP clients (curl, fetch, requests, etc.) set Content-Length automatically. You only see 411 with handcrafted requests or unusual streaming clients.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 412, name: 'Precondition Failed', klass: '4xx',
    summary: 'A precondition header on the request did not match the server\'s state.',
    meaning: `412 Precondition Failed is the response when an <code>If-Match</code>, <code>If-None-Match</code>, <code>If-Unmodified-Since</code>, or other conditional header does not match the resource\'s current state. The most common case: optimistic concurrency control. The client GETs a resource with ETag "v1", modifies it, and sends PUT with <code>If-Match: "v1"</code>. If another client updated the resource in between (current ETag is "v2"), the server returns 412 instead of overwriting.`,
    when: 'Return 412 when a request includes an If-Match or If-Unmodified-Since header and the precondition does not match. This protects against lost updates.',
    causes: [
      'ETag in If-Match header does not match current ETag',
      'If-Unmodified-Since timestamp is older than the resource\'s last modification',
      'Concurrent update happened between GET and PUT',
    ],
    fixes: [
      'GET the resource again to get the current ETag',
      'Apply your changes to the latest version',
      'Retry the PUT with the new If-Match value',
      'For repeated 412s, implement merge logic or prompt the user',
    ],
    example: `curl -i -X PUT -H 'If-Match: "v1"' \\
  -d '{"name":"Ada"}' https://api.example.com/users/42

HTTP/2 412
etag: "v3"
content-type: application/json
{"error":"precondition failed","current_etag":"v3"}`,
    related: [409, 304, 428],
    faqs: [
      { q: '412 vs 409?', a: '412 is specifically about precondition headers (If-Match, etc.). 409 is the broader conflict code and applies to any state conflict, with or without preconditions.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 413, name: 'Content Too Large', klass: '4xx',
    summary: 'The request body exceeds the server\'s size limit.',
    meaning: `413 Content Too Large (formerly Payload Too Large) tells the client the request body is bigger than the server is willing to accept. Common limits: 1MB for JSON APIs, 10-100MB for file uploads, multi-GB for object storage. The response should include a <code>Retry-After</code> header (rare but spec-allowed) and ideally a body explaining the limit. Note: the older spec name "Payload Too Large" is still used in many libraries and tools.`,
    when: 'Return 413 when the request body exceeds the configured maximum.',
    causes: [
      'File upload exceeds server limit',
      'Bulk import payload too large',
      'JSON body has too many items in an array',
      'CDN or proxy limit hit before reaching origin',
      'Nginx client_max_body_size or equivalent exceeded',
    ],
    fixes: [
      'Split the upload into smaller chunks',
      'Use multipart/form-data for large files instead of JSON-encoded base64',
      'Increase server-side limit (Nginx: client_max_body_size, Express: limit option)',
      'For very large uploads, use signed URLs to upload directly to S3/R2/GCS',
    ],
    example: `curl -i -X POST -d @huge.json https://api.example.com/import

HTTP/2 413
content-type: application/json
{"error":"payload too large","limit_mb":1,"received_mb":15}`,
    related: [400, 411, 414],
    faqs: [
      { q: 'Where is the 1MB limit set?', a: 'Multiple places: Nginx (client_max_body_size, default 1MB), Express (default 100KB for JSON), Cloudflare (100MB on free, more on paid), API Gateway (10MB by default).' },
      { q: 'Why is the spec name now "Content Too Large"?', a: 'RFC 9110 renamed it from "Payload Too Large" to be more accurate. Both names refer to status code 413.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 414, name: 'URI Too Long', klass: '4xx',
    summary: 'The URL is longer than the server is willing to interpret.',
    meaning: `414 URI Too Long means the request line (the URL with all query parameters) exceeds the server's parsing buffer. Typical limits are 4KB-8KB. This usually happens when GET requests are used to send what should be a POST body: large lists in query strings, encoded binary data in URLs, or query-string explosion from chained tracking parameters. The fix is almost always to switch to POST.`,
    when: 'Return 414 when the request URI exceeds the server\'s configured maximum.',
    causes: [
      'Massive query strings (hundreds of parameters)',
      'Base64-encoded data in URL parameters',
      'Tracking parameter sprawl (UTM + Google + Facebook + custom)',
      'GET request being used where POST should be',
    ],
    fixes: [
      'Move data from query string to POST body',
      'For search APIs, accept POST with JSON body for complex queries',
      'Increase server limit (Nginx: large_client_header_buffers)',
      'Strip unnecessary tracking parameters',
    ],
    example: `HTTP/2 414
content-type: text/plain
URI too long`,
    related: [413, 400, 431],
    faqs: [
      { q: 'What is the typical URL length limit?', a: 'IE caps at 2KB, modern browsers handle 8KB+, most servers default to 4-8KB.' },
      { q: 'Should search use GET or POST?', a: 'Use GET for short queries (cacheable, bookmarkable). Use POST for very large or sensitive search bodies.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 415, name: 'Unsupported Media Type', klass: '4xx',
    summary: 'The server cannot parse the Content-Type of the request body.',
    meaning: `415 Unsupported Media Type means the request body is in a format the server cannot or will not parse. Common cause: sending JSON to an endpoint that expects multipart/form-data, or vice versa. The response should include an <code>Accept</code> header listing the Content-Types the endpoint will accept (note: this is the unusual case where Accept appears on a response, not a request).`,
    when: 'Return 415 when the request Content-Type is not one the server accepts on this endpoint.',
    causes: [
      'POST JSON to a multipart-only endpoint',
      'POST form-encoded to a JSON-only endpoint',
      'Missing Content-Type header (server defaults to a type it does not accept)',
      'Wrong charset (UTF-16 to a UTF-8-only endpoint)',
    ],
    fixes: [
      'Set the correct Content-Type header: <code>-H "Content-Type: application/json"</code>',
      'Curl with -d defaults to application/x-www-form-urlencoded; override with -H',
      'Read the API docs for the exact expected Content-Type',
    ],
    example: `curl -i -X POST -H "Content-Type: text/plain" -d "hello" https://api.example.com/users

HTTP/2 415
accept: application/json, multipart/form-data
content-type: application/json
{"error":"unsupported content-type"}`,
    related: [400, 406, 422],
    faqs: [
      { q: '415 vs 406?', a: '415 is about the request body Content-Type. 406 is about the response Content-Type the client will accept.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 416, name: 'Range Not Satisfiable', klass: '4xx',
    summary: 'The requested byte range is outside the resource\'s actual size.',
    meaning: `416 Range Not Satisfiable means the client sent a Range header asking for bytes that do not exist in the resource. Most commonly: requesting bytes 5000-6000 of a file that is only 4000 bytes long. The response should include a <code>Content-Range</code> header indicating the actual size, so the client can adjust and retry.`,
    when: 'Return 416 when the Range header asks for bytes outside the resource bounds.',
    causes: [
      'Resume of a download where the file changed size',
      'Client miscomputed the range',
      'Off-by-one in Range header construction',
    ],
    fixes: [
      'Re-fetch the resource size with HEAD or a 0-byte range',
      'Recompute the range based on the current size',
      'For resumable downloads, store the original size and verify before resuming',
    ],
    example: `curl -i -H "Range: bytes=10000-20000" https://example.com/small.txt

HTTP/2 416
content-range: bytes */500
content-type: text/plain
Range out of bounds`,
    related: [206, 400, 304],
    faqs: [
      { q: 'How do I check the file size first?', a: 'Use HEAD: <code>curl -I URL</code>. The Content-Length header is the resource size.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 418, name: "I'm a Teapot", klass: '4xx',
    summary: 'The server is a teapot and refuses to brew coffee.',
    meaning: `418 I'm a Teapot is the most famous joke status code on the web. It comes from RFC 2324, the Hyper Text Coffee Pot Control Protocol, an April Fools' RFC from 1998. Some servers return it for fun; some bot-detection systems use it as a tarpit response; it has been removed from major browsers' implementations and added back multiple times due to internet outcry. It will probably outlive us all.`,
    when: 'Return 418 only as a joke or easter egg. Real APIs should not use it.',
    causes: [],
    fixes: [],
    example: `curl -i https://www.google.com/teapot

HTTP/2 418
content-type: text/html
<html>I'm a teapot.</html>`,
    related: [200, 451, 503],
    faqs: [
      { q: 'Is 418 a real status code?', a: 'It is in an Internet Standards Track RFC (sort of). It is not in mainline RFC 9110, but most HTTP libraries recognize it.' },
      { q: 'What is HTCPCP?', a: 'The Hyper Text Coffee Pot Control Protocol, RFC 2324. An April Fools joke from 1998 that defines BREW and WHEN methods. 418 came from there.' },
    ],
    rfc: 'RFC 2324',
  },
  {
    code: 422, name: 'Unprocessable Content', klass: '4xx',
    summary: 'The request is well-formed but contains semantically invalid data.',
    meaning: `422 Unprocessable Content (formerly Unprocessable Entity) is the validation-error code. The request was syntactically valid (parseable JSON, all required fields present), but failed business-rule validation: email already exists, age must be positive, cross-field constraint violated. Many APIs use 400 for everything client-side wrong, but 422 is more specific and lets clients distinguish "your JSON is broken" (400) from "your data is logically invalid" (422).`,
    when: 'Return 422 when the request parsed successfully but failed validation. Include detailed per-field errors in the response body.',
    causes: [
      'Required field has an invalid value',
      'Cross-field validation failed (start_date > end_date)',
      'Unique constraint violation (email already taken)',
      'Foreign key constraint (referenced user does not exist)',
      'Business rule violated (cannot transition from state A to state C)',
    ],
    fixes: [
      'Read the response body, 422 should always include per-field error details',
      'Fix the offending fields and retry',
      'For cross-field errors, may need to re-fetch related resources',
    ],
    example: `curl -i -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -d '{"email":"taken@example.com","age":-5}'

HTTP/2 422
content-type: application/json
{
  "error":"validation failed",
  "details":[
    {"field":"email","reason":"already taken"},
    {"field":"age","reason":"must be positive"}
  ]
}`,
    related: [400, 409, 415],
    faqs: [
      { q: '400 vs 422?', a: '400 = malformed (broken JSON, missing required field, wrong type). 422 = well-formed but invalid (email already exists, age out of range, business rule violation).' },
      { q: 'Are all clients aware of 422?', a: 'Most modern HTTP libraries are. Some older or simpler clients lump all 4xx together and may not distinguish 422 from 400.' },
      { q: 'Why was it renamed from Unprocessable Entity?', a: 'RFC 9110 renamed it for clarity. Both names refer to status code 422.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 423, name: 'Locked', klass: '4xx',
    summary: 'The resource is locked and cannot be modified right now.',
    meaning: `423 Locked is a WebDAV code for resource-level locking. Some non-WebDAV APIs use it to indicate temporary locks on resources during long-running operations (e.g. while a CI job is editing a config file, the file is locked). It is similar to 409 Conflict but specifically about explicit lock state, not state-mismatch in general.`,
    when: 'Return 423 when a resource has an explicit lock that prevents the requested operation.',
    causes: [],
    fixes: [],
    example: `HTTP/2 423
content-type: application/json
{"error":"resource locked","unlock_at":"2026-05-05T15:00:00Z"}`,
    related: [409, 425, 503],
    faqs: [
      { q: 'Is 423 standard outside WebDAV?', a: 'Not really. Most REST APIs use 409 Conflict for locking. 423 is technically valid and somewhat self-documenting if your API has explicit locks.' },
    ],
    rfc: 'RFC 4918',
  },
  {
    code: 425, name: 'Too Early', klass: '4xx',
    summary: 'The server is unwilling to risk processing a request that might be replayed.',
    meaning: `425 Too Early is a TLS 1.3 / 0-RTT defense. When TLS 1.3 sends data in 0-RTT (early data) for low-latency reconnects, that data is replayable by an attacker. Servers protecting against replay attacks return 425 for any non-idempotent request that arrived in 0-RTT, telling the client to retry over a fully-established TLS session.`,
    when: 'Return 425 when a non-idempotent request arrives via TLS 1.3 0-RTT and you cannot guarantee it has not been replayed.',
    causes: [],
    fixes: [
      'Retry the request without TLS 0-RTT',
      'Most clients handle 425 automatically and retry',
    ],
    example: `HTTP/2 425
content-type: text/plain
Replay protection: retry with full handshake`,
    related: [403, 408, 401],
    faqs: [
      { q: 'When does 425 occur in practice?', a: 'Mostly invisibly. CDNs and modern servers handle it automatically. You rarely see it directly.' },
    ],
    rfc: 'RFC 8470',
  },
  {
    code: 426, name: 'Upgrade Required', klass: '4xx',
    summary: 'The client must upgrade to a different protocol to continue.',
    meaning: `426 Upgrade Required tells the client that this resource requires a protocol the current request did not use. Most commonly seen when an HTTP endpoint requires HTTPS, or when an HTTP/1.1 endpoint requires HTTP/2 or WebSocket. The response must include an <code>Upgrade</code> header listing acceptable protocols.`,
    when: 'Return 426 when a resource requires a specific protocol not used by the current request.',
    causes: [
      'HTTP request to an HTTPS-only endpoint',
      'HTTP/1.1 request to an HTTP/2-required endpoint',
      'WebSocket required but client did not upgrade',
    ],
    fixes: [
      'Use HTTPS instead of HTTP',
      'Upgrade HTTP client to support HTTP/2',
      'For WebSocket, send Upgrade and Connection headers',
    ],
    example: `HTTP/1.1 426
upgrade: TLS/1.2, HTTP/2
connection: Upgrade
content-type: text/plain
This resource requires HTTPS`,
    related: [101, 400, 505],
    faqs: [
      { q: 'Why not just redirect to HTTPS with 301?', a: '301 to HTTPS is the typical fix. 426 is more specific but less commonly used. For HTTPS upgrades, 301 or 308 is what most servers actually do.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 428, name: 'Precondition Required', klass: '4xx',
    summary: 'The server requires the request to be conditional.',
    meaning: `428 Precondition Required tells the client to add an <code>If-Match</code> or similar conditional header before the server will process the request. This is a defense against the "lost update" problem: the server is saying "do not let me write this without you confirming you saw the latest version". You see 428 most often on PUT and PATCH endpoints that mandate optimistic concurrency control.`,
    when: 'Return 428 from PUT/PATCH endpoints that require ETag-based concurrency to prevent lost updates.',
    causes: [
      'PUT or PATCH without If-Match header',
      'Server enforces optimistic concurrency on this resource',
    ],
    fixes: [
      'GET the resource first to obtain the current ETag',
      'Send PUT/PATCH with <code>If-Match: "etag-value"</code>',
      'Implement automatic conditional retry in your HTTP client',
    ],
    example: `curl -i -X PUT -d '{"name":"Ada"}' https://api.example.com/users/42

HTTP/2 428
content-type: application/json
{"error":"precondition required","need":"If-Match header"}`,
    related: [412, 409, 425],
    faqs: [
      { q: '428 vs 412?', a: '428 = "you did not include a precondition header at all". 412 = "you included one and it did not match".' },
    ],
    rfc: 'RFC 6585',
  },
  {
    code: 429, name: 'Too Many Requests', klass: '4xx',
    summary: 'The client has sent too many requests in too short a time and is being rate-limited.',
    meaning: `429 Too Many Requests is the rate-limit response. The client has exceeded the allowed request rate and must back off. The response should include a <code>Retry-After</code> header (seconds to wait, or an HTTP date) so the client can schedule the retry. Many APIs also include rate-limit metadata: <code>X-RateLimit-Limit</code> (requests per window), <code>X-RateLimit-Remaining</code> (requests left), <code>X-RateLimit-Reset</code> (when the window resets).`,
    when: 'Return 429 when a client exceeds rate-limit thresholds. Always include Retry-After. Rate-limit per-IP, per-API-key, per-user, or per-account depending on threat model.',
    causes: [
      'Too many requests in a short window',
      'Burst exceeded the per-second cap',
      'Daily quota exhausted',
      'Concurrent connection limit hit',
      'Bot-like traffic patterns triggered defensive rate limit',
    ],
    fixes: [
      'Read Retry-After and back off accordingly',
      'Implement exponential backoff with jitter',
      'Cache responses to reduce request volume',
      'For batch operations, use bulk endpoints instead of N individual requests',
      'For client-side, use token-bucket rate limiting before sending',
      'Upgrade to a higher tier if the limit is hit consistently',
    ],
    example: `curl -i https://api.example.com/data

HTTP/2 429
retry-after: 60
x-ratelimit-limit: 100
x-ratelimit-remaining: 0
x-ratelimit-reset: 1714914000
content-type: application/json
{"error":"rate limit exceeded","retry_after_seconds":60}`,
    related: [503, 408, 425],
    faqs: [
      { q: 'How should I respect Retry-After?', a: 'Wait at least the indicated time before retrying. Add jitter (random 0-25% extra) to avoid synchronized retry storms.' },
      { q: '429 vs 503?', a: '429 = "you specifically are over your limit". 503 = "the whole service is overloaded for everyone". Different fix, different alert path.' },
      { q: 'Should I count 429s in error budgets?', a: 'Yes, if you control the client. 429 means you sent too many requests; that is a client-side bug or a missing rate limiter.' },
    ],
    rfc: 'RFC 6585',
  },
  {
    code: 431, name: 'Request Header Fields Too Large', klass: '4xx',
    summary: 'The request headers, in total or individually, exceed the server\'s limit.',
    meaning: `431 Request Header Fields Too Large rejects requests with overly large headers. Common causes: cookie sprawl (sites accumulating dozens of large cookies), JWT tokens exceeding header buffer limits, or accidentally setting a very long User-Agent. Server limits vary: Nginx defaults to 8KB, Express 8KB, Cloudflare 32KB. This is rare but visible when it happens.`,
    when: 'Return 431 when total header size or any single header exceeds the configured maximum.',
    causes: [
      'Very large JWT token in Authorization header',
      'Cookie sprawl: many sites accumulate dozens of cookies',
      'Forwarded headers in long proxy chains',
      'Custom headers stuffed with too much data',
    ],
    fixes: [
      'Clear cookies for the offending site',
      'Move data from headers to request body',
      'Use shorter JWT claims or move large data to a separate fetch',
      'Increase server header buffer (Nginx: large_client_header_buffers)',
    ],
    example: `HTTP/2 431
content-type: text/plain
Header section too large`,
    related: [413, 414, 400],
    faqs: [
      { q: 'Why are my cookies so big?', a: 'Each domain you visit can store ~4KB of cookies. Tracking, ad networks, and analytics SDKs accumulate cookies fast. Modern browsers cap total cookie size per domain.' },
    ],
    rfc: 'RFC 6585',
  },
  {
    code: 451, name: 'Unavailable For Legal Reasons', klass: '4xx',
    summary: 'The resource is blocked due to a legal demand.',
    meaning: `451 Unavailable For Legal Reasons (a Ray Bradbury reference, naming intent) signals that content has been blocked due to a legal order: court injunction, DMCA takedown, GDPR right-to-be-forgotten, or government censorship. The response should include details about the legal authority that issued the demand, where possible. 451 is meant to be more transparent than serving 404 or 403 for blocked content.`,
    when: 'Return 451 when content is being withheld specifically due to a legal order, not policy or technical limits.',
    causes: [],
    fixes: [],
    example: `HTTP/2 451
link: <https://example.com/legal/notice/dmca-12345>; rel="blocked-by"
content-type: text/html
<p>This content has been removed due to a DMCA takedown notice.</p>`,
    related: [404, 403, 410],
    faqs: [
      { q: 'Why 451 specifically?', a: 'It is named after Fahrenheit 451, Ray Bradbury\'s novel about book burning and censorship.' },
      { q: 'Is 451 enforceable?', a: 'No. The status code is informational. The legal demand is what is enforceable. 451 just makes the blocking visible.' },
    ],
    rfc: 'RFC 7725',
  },

  // ===== 5xx Server Errors =====
  {
    code: 500, name: 'Internal Server Error', klass: '5xx',
    summary: 'The server hit an unhandled error while processing the request.',
    meaning: `500 Internal Server Error is the catch-all server-fault code. The server encountered an unexpected condition (uncaught exception, null pointer, database connection refused, deserialization crash) and could not complete the request. 500 says nothing about why; the actual cause is in the server logs. From the client's perspective, 500 means "this is not your fault, retry might help, file a bug if it persists".`,
    when: 'Return 500 only for genuinely unexpected server-side failures. Use 503 for known overload, 502 for upstream failures, 504 for upstream timeouts.',
    causes: [
      'Uncaught exception in application code',
      'Database connection failure',
      'Null reference / undefined access',
      'Out of memory',
      'Deserialization or parsing error in business logic',
      'Misconfiguration (missing environment variable, bad credentials)',
    ],
    fixes: [
      'Check server logs for the stack trace',
      'Retry the request, may be transient',
      'For consistent 500s, file a bug report with the exact request and timestamp',
      'For your own services, add better error handling and convert to specific 4xx where appropriate',
    ],
    example: `HTTP/2 500
content-type: application/json
{"error":"internal server error","request_id":"abc123"}`,
    related: [502, 503, 504],
    faqs: [
      { q: 'What is the request_id field for?', a: 'When you file a bug report, the server team can pull the exact stack trace and context for your specific failed request. Always include it.' },
      { q: 'Should I retry on 500?', a: 'Yes, with exponential backoff. Many 500s are transient. If they persist, the underlying bug needs a fix on the server side.' },
      { q: 'How do I avoid 500s in my own service?', a: 'Catch exceptions at the request boundary, convert known failure modes to specific 4xx codes (validation errors → 422, missing → 404, etc.), and reserve 500 for truly unexpected failures.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 501, name: 'Not Implemented', klass: '5xx',
    summary: 'The server does not support the request method or feature.',
    meaning: `501 Not Implemented means the server does not know how to handle the request method at all (TRACE, CONNECT) or does not implement a feature requested in headers (e.g. unknown Transfer-Encoding). It is different from 405 Method Not Allowed: 405 means "this resource does not support this method"; 501 means "this server does not support this method, period".`,
    when: 'Return 501 when the server lacks support for a method or feature, not when a specific resource refuses the method.',
    causes: [
      'TRACE or CONNECT method requested',
      'Server does not implement HTTP/2 push and request includes related directive',
      'Unknown Transfer-Encoding',
    ],
    fixes: [
      'Use a different method',
      'Check the OPTIONS response to see what methods are supported',
    ],
    example: `HTTP/2 501
content-type: text/plain
Method not implemented`,
    related: [405, 502, 505],
    faqs: [
      { q: '501 vs 405?', a: '501 = the server does not implement this method anywhere. 405 = the server implements the method generally but not on this resource.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 502, name: 'Bad Gateway', klass: '5xx',
    summary: 'A gateway or proxy got an invalid response from an upstream server.',
    meaning: `502 Bad Gateway means the proxy or load balancer sitting in front of the actual server received a malformed or unexpected response from upstream. Classic causes: upstream crashed mid-response, upstream returned protocol garbage, connection was reset before the response completed. 502 is one of the most common error codes from CDNs (Cloudflare, AWS CloudFront, Fastly) and reverse proxies (Nginx, HAProxy).`,
    when: 'A proxy or CDN returns 502 when it cannot get a valid response from the origin. Origin operators see this as "the proxy is reporting we returned garbage".',
    causes: [
      'Origin server crashed mid-request',
      'Origin returned non-HTTP response (raw error text, wrong port)',
      'Connection reset by origin',
      'Origin SSL certificate invalid or expired',
      'Origin closed the connection before sending the full response',
      'Upstream timeout (sometimes manifests as 502 instead of 504)',
    ],
    fixes: [
      'Check origin server logs for crashes or errors',
      'Verify origin is actually running and reachable on the right port',
      'Check origin certificate validity',
      'For Cloudflare 502s, check the Cloudflare event log and origin response',
      'Retry the request, often transient',
    ],
    example: `HTTP/2 502
server: cloudflare
content-type: text/html
<html><body>502 Bad Gateway</body></html>`,
    related: [503, 504, 500],
    faqs: [
      { q: '502 vs 504?', a: '502 = the upstream returned bad data (wrong format, garbled). 504 = the upstream did not respond at all within the timeout.' },
      { q: 'Why am I getting 502 from Cloudflare?', a: 'Cloudflare 502 means Cloudflare reached your origin but the response was invalid. Check origin logs first; the origin is the source of the problem.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 503, name: 'Service Unavailable', klass: '5xx',
    summary: 'The server is temporarily unable to handle the request, usually due to overload or maintenance.',
    meaning: `503 Service Unavailable means the server is healthy enough to respond but cannot process this request right now. Two main scenarios: scheduled maintenance (deployment in progress, restart window) and overload (more requests than the server can handle). The response should include a <code>Retry-After</code> header so clients know when to come back. 503 is preferable to crashing or letting the request queue grow unbounded; it tells clients explicitly to back off.`,
    when: 'Return 503 when the server is intentionally rejecting requests due to overload, maintenance, or a circuit breaker tripping. Always include Retry-After.',
    causes: [
      'Deployment in progress',
      'Server overloaded, intentional shedding',
      'Circuit breaker tripped due to dependency failures',
      'Database under maintenance',
      'Autoscaling lag (traffic spike, instances still booting)',
    ],
    fixes: [
      'Wait the time given in Retry-After',
      'Retry with exponential backoff',
      'For consistent 503s, the service has a capacity or availability problem',
      'For your own service, add capacity, fix the failing dependency, or fall back to cached data',
    ],
    example: `HTTP/2 503
retry-after: 30
content-type: text/plain
Service temporarily unavailable due to maintenance`,
    related: [502, 504, 429],
    faqs: [
      { q: '503 vs 429?', a: '503 = service-wide unavailable. 429 = you specifically are over your rate limit (others are fine).' },
      { q: '503 vs 504?', a: '503 = the server itself is unavailable / overloaded. 504 = an upstream the server depends on did not respond in time.' },
      { q: 'Should I show a maintenance page or return 503?', a: 'Both. Return 503 with a Retry-After header AND serve a friendly maintenance HTML body. Search engines understand 503 means "temporary", so they will not deindex your pages.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 504, name: 'Gateway Timeout', klass: '5xx',
    summary: 'A gateway or proxy did not receive a response from an upstream server in time.',
    meaning: `504 Gateway Timeout means the proxy or CDN waited for the origin to respond and gave up. Common timeout values: Cloudflare 100s on free, Nginx 60s default, AWS ALB 60s default, API Gateway 29s for HTTP and 30s for WebSocket. 504s usually mean the origin is doing too much work per request: a slow database query, an unindexed scan, an external API call that did not have its own timeout.`,
    when: 'A proxy returns 504 when the origin does not respond within the configured timeout. Origin operators see 504 as "we are too slow".',
    causes: [
      'Slow database query',
      'Long-running computation in the request path',
      'External API call without a sane timeout',
      'Origin overloaded, requests queuing',
      'Network issue between proxy and origin',
    ],
    fixes: [
      'Profile the slow request',
      'Add a shorter timeout on external API calls (always less than the proxy timeout)',
      'Move long-running work to async jobs (return 202 instead of waiting)',
      'Add database indexes for slow queries',
      'Increase upstream timeout if the work is genuinely slow but legitimate',
    ],
    example: `HTTP/2 504
server: cloudflare
content-type: text/html
<html><body>504 Gateway Timeout</body></html>`,
    related: [502, 503, 408],
    faqs: [
      { q: '504 vs 408?', a: '408 = the client did not finish sending the request in time. 504 = the upstream did not finish sending the response in time.' },
      { q: 'Why does my request work locally but 504 in production?', a: 'Production usually has tighter timeouts (Cloudflare 100s, ALB 60s, API Gateway 29s). Local has no proxy and no timeout. Profile the slow request and either speed it up or move to async.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 505, name: 'HTTP Version Not Supported', klass: '5xx',
    summary: 'The HTTP version used in the request is not supported by the server.',
    meaning: `505 HTTP Version Not Supported is rare. Modern servers handle HTTP/1.0, HTTP/1.1, HTTP/2, and HTTP/3 ubiquitously. 505 mostly shows up for very old HTTP/0.9 clients hitting modern servers, or for handcrafted requests with malformed version strings.`,
    when: 'Return 505 when a request specifies an HTTP major version the server does not implement.',
    causes: [],
    fixes: [
      'Use a modern HTTP client',
      'Verify the request line has a valid HTTP version (HTTP/1.1, HTTP/2.0)',
    ],
    example: `HTTP/1.1 505
content-type: text/plain
HTTP version not supported`,
    related: [426, 501, 400],
    faqs: [
      { q: 'When does 505 actually happen?', a: 'Almost never in 2026. You can trigger it manually by sending HTTP/0.9 or a bogus version string.' },
    ],
    rfc: 'RFC 9110',
  },
  {
    code: 507, name: 'Insufficient Storage', klass: '5xx',
    summary: 'The server cannot store the data needed to complete the request.',
    meaning: `507 Insufficient Storage is a WebDAV code that some non-WebDAV APIs adopt for "out of disk space" or "quota exceeded" scenarios. It is more specific than 500 (the server is broken) or 503 (the service is unavailable): 507 says "the storage layer specifically cannot accept this".`,
    when: 'Return 507 when storage is full or quota is exceeded.',
    causes: [
      'Disk full on the storage server',
      'User storage quota exhausted',
      'Database tablespace full',
    ],
    fixes: [
      'Free up storage',
      'Increase quota',
      'Delete old data before retrying',
    ],
    example: `HTTP/2 507
content-type: application/json
{"error":"quota exceeded","used_gb":100,"quota_gb":100}`,
    related: [413, 503, 500],
    faqs: [
      { q: 'Is 507 widely supported?', a: 'It is in the HTTP spec and used by some WebDAV servers and a handful of REST APIs. Many APIs use 503 or a custom error code instead.' },
    ],
    rfc: 'RFC 4918',
  },
  {
    code: 508, name: 'Loop Detected', klass: '5xx',
    summary: 'The server detected an infinite loop while processing the request.',
    meaning: `508 Loop Detected is another WebDAV code. The server detected that processing the request would create an infinite loop (e.g. circular symlinks, recursive PROPFIND on cyclic resource graph). Outside WebDAV, 508 is occasionally used by APIs to signal recursion-depth-exceeded errors.`,
    when: 'Return 508 when a request would cause infinite recursion or self-reference.',
    causes: [],
    fixes: [],
    example: `HTTP/2 508
content-type: application/json
{"error":"loop detected","depth":1024}`,
    related: [500, 423, 422],
    faqs: [
      { q: 'When do you actually see 508?', a: 'Rarely. WebDAV servers use it for circular resource graphs. Some recursive query APIs adopt it for depth-limit errors.' },
    ],
    rfc: 'RFC 5842',
  },
  {
    code: 511, name: 'Network Authentication Required', klass: '5xx',
    summary: 'The client must authenticate to the network (captive portal) before accessing the resource.',
    meaning: `511 Network Authentication Required is the captive-portal status code. When a public WiFi network requires you to log in (hotel, airport, coffee shop), a properly-configured network gateway returns 511 with a body pointing at the login page. Most captive portals do not actually use 511; they intercept all HTTP traffic with a redirect to the login page, which is messier but more compatible with broken clients.`,
    when: 'Return 511 from network gateways when the client has not authenticated to the network.',
    causes: [
      'Public WiFi captive portal not yet logged into',
      'Network requires SSO authentication before allowing internet access',
    ],
    fixes: [
      'Open a browser, navigate to any HTTP page, complete the captive portal login',
      'Use a known captive-portal-detection URL (Apple/Google/MS all have these)',
    ],
    example: `HTTP/1.1 511
content-type: text/html
<html><body>You must <a href="https://wifi.example.com/login">log in to the network</a>.</body></html>`,
    related: [407, 401, 403],
    faqs: [
      { q: 'Do real captive portals use 511?', a: 'Most do not. They intercept HTTP traffic and serve a 302 redirect to the login page. 511 is the spec-correct way but causes compatibility issues with old clients.' },
    ],
    rfc: 'RFC 6585',
  },
];

// ---------- TEMPLATE ----------

const KLASS_INFO = {
  '1xx': { color: '#60A5FA', label: 'Informational', desc: 'Request received and processing continues' },
  '2xx': { color: '#4ADE80', label: 'Success', desc: 'Request was successfully received, understood, and accepted' },
  '3xx': { color: '#FACC15', label: 'Redirection', desc: 'Further action must be taken to complete the request' },
  '4xx': { color: '#F87171', label: 'Client Error', desc: 'The request contains bad syntax or cannot be fulfilled' },
  '5xx': { color: '#F87171', label: 'Server Error', desc: 'The server failed to fulfill an apparently valid request' },
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Code is already-escaped HTML for sections that contain inline <code> tags etc.
// Use sparingly; pass plain strings everywhere else.
function pageHtml(c, allCodes) {
  const klass = KLASS_INFO[c.klass];
  const isError = c.klass === '4xx' || c.klass === '5xx';
  const fullName = `HTTP ${c.code} ${c.name}`;
  const seoTitle = `${c.code} ${c.name}: HTTP Status Code Meaning, Causes, and Fixes | TerminalFeed`;
  const seoDesc = c.summary;

  const relatedCards = (c.related || [])
    .map(rc => allCodes.find(x => x.code === rc))
    .filter(Boolean)
    .map(r => `      <a href="/http/${r.code}" class="related-card">
        <div class="related-code">${r.code}</div>
        <div class="related-name">${r.name}</div>
      </a>`).join('\n');

  const faqJsonLd = c.faqs && c.faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  const faqHtml = c.faqs && c.faqs.length ? `
    <section class="section faqs">
      <h2>Frequently Asked Questions</h2>
      ${c.faqs.map(f => `<details class="faq">
        <summary>${escapeHtml(f.q)}</summary>
        <div class="faq-answer">${f.a}</div>
      </details>`).join('\n      ')}
    </section>` : '';

  const causesHtml = c.causes && c.causes.length ? `
    <section class="section">
      <h2>Common causes</h2>
      <ul class="bullet-list">
        ${c.causes.map(x => `<li>${x}</li>`).join('\n        ')}
      </ul>
    </section>` : '';

  const fixesHtml = c.fixes && c.fixes.length ? `
    <section class="section">
      <h2>How to fix ${c.code} ${escapeHtml(c.name)}</h2>
      <ul class="bullet-list">
        ${c.fixes.map(x => `<li>${x}</li>`).join('\n        ')}
      </ul>
    </section>` : '';

  const exampleHtml = c.example ? `
    <section class="section">
      <h2>Example response</h2>
      <pre><code>${escapeHtml(c.example)}</code></pre>
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDesc)}">
  <meta name="keywords" content="${c.code} status code, http ${c.code}, ${c.code} ${escapeHtml(c.name).toLowerCase()}, ${c.code} meaning, ${c.code} fix, http status code ${c.code}">
  <link rel="canonical" href="https://terminalfeed.io/http/${c.code}">
  <meta property="og:title" content="${escapeHtml(fullName)}: Meaning, Causes, and Fixes">
  <meta property="og:description" content="${escapeHtml(seoDesc)}">
  <meta property="og:url" content="https://terminalfeed.io/http/${c.code}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://terminalfeed.io/og-image.png">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="TerminalFeed Blog" href="/feed.xml">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${fullName}: Meaning, Causes, and Fixes`,
    description: seoDesc,
    url: `https://terminalfeed.io/http/${c.code}`,
    datePublished: '2026-05-05',
    dateModified: '2026-05-05',
    author: { '@type': 'Organization', name: 'TerminalFeed' },
    publisher: {
      '@type': 'Organization',
      name: 'TerminalFeed',
      logo: { '@type': 'ImageObject', url: 'https://terminalfeed.io/logo.png' },
    },
    mainEntityOfPage: `https://terminalfeed.io/http/${c.code}`,
    about: { '@type': 'Thing', name: `HTTP ${c.code}` },
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://terminalfeed.io/' },
      { '@type': 'ListItem', position: 2, name: 'HTTP Status Codes', item: 'https://terminalfeed.io/http' },
      { '@type': 'ListItem', position: 3, name: `${c.code} ${c.name}`, item: `https://terminalfeed.io/http/${c.code}` },
    ],
  })}</script>
  ${faqJsonLd ? `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>` : ''}
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0A0A0C;
      color: #D4D2CB;
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace;
      line-height: 1.7;
      padding: 24px 16px 64px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .breadcrumbs { font-size: 11px; color: #4E4D49; margin-bottom: 18px; }
    .breadcrumbs a { color: #4E4D49; text-decoration: none; }
    .breadcrumbs a:hover { color: #5DCAA5; }
    .breadcrumbs .sep { margin: 0 6px; color: #2A2A30; }

    .header { border-bottom: 1px solid #1E1E24; padding-bottom: 24px; margin-bottom: 32px; }
    .badge {
      display: inline-block;
      font-size: 10px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 3px;
      margin-bottom: 14px;
      color: ${klass.color};
      border: 1px solid ${klass.color}40;
      background: ${klass.color}10;
    }
    .header h1 { font-size: 28px; color: #F0EDE6; margin-bottom: 8px; font-weight: 600; }
    .header h1 .num { color: ${klass.color}; }
    .summary { font-size: 14px; color: #A8A6A0; line-height: 1.7; }

    .section { margin-bottom: 36px; }
    .section h2 { font-size: 16px; color: #4ADE80; margin-bottom: 14px; letter-spacing: 0.3px; font-weight: 600; }
    .section p { font-size: 13.5px; color: #C8C8C0; margin-bottom: 14px; line-height: 1.8; }
    .section a { color: #5DCAA5; text-decoration: none; border-bottom: 1px solid #5DCAA530; }
    .section a:hover { border-bottom-color: #5DCAA5; }
    .section code {
      background: #111114;
      border: 1px solid #1A1A22;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      color: #5DCAA5;
    }
    .section pre {
      background: #0D0D10;
      border: 1px solid #1A1A22;
      border-radius: 6px;
      padding: 14px 16px;
      margin: 14px 0;
      overflow-x: auto;
      font-size: 11.5px;
      line-height: 1.7;
    }
    .section pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: #C8C8C0;
      font-size: inherit;
      white-space: pre;
    }
    .bullet-list { margin: 0 0 0 20px; }
    .bullet-list li { font-size: 13px; color: #C8C8C0; margin-bottom: 8px; line-height: 1.7; }
    .bullet-list li code { font-size: 11.5px; }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
    }
    .related-card {
      background: #111114;
      border: 1px solid #1A1A22;
      border-radius: 5px;
      padding: 12px 14px;
      text-decoration: none !important;
      border-bottom: 1px solid #1A1A22 !important;
      transition: border-color 0.15s;
    }
    .related-card:hover { border-color: #5DCAA5 !important; border-bottom-color: #5DCAA5 !important; }
    .related-code { font-size: 18px; color: #5DCAA5; font-weight: 600; margin-bottom: 2px; }
    .related-name { font-size: 11px; color: #8A8880; }

    .faqs h2 { color: #5DCAA5; }
    .faq {
      background: #0D0D10;
      border: 1px solid #1A1A22;
      border-radius: 5px;
      padding: 12px 16px;
      margin-bottom: 8px;
    }
    .faq summary {
      cursor: pointer;
      font-size: 13px;
      color: #F0EDE6;
      font-weight: 500;
      list-style: none;
    }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary::before { content: '› '; color: #5DCAA5; margin-right: 4px; }
    .faq[open] summary::before { content: '⌄ '; }
    .faq-answer { font-size: 12.5px; color: #A8A6A0; padding-top: 10px; line-height: 1.7; }

    .meta-box {
      background: #0D0D10;
      border: 1px solid #1A1A22;
      border-radius: 5px;
      padding: 12px 16px;
      font-size: 11px;
      color: #8A8880;
      margin: 24px 0;
    }
    .meta-box code { font-size: 11px; color: ${klass.color}; }

    footer.footer {
      margin-top: 48px;
      text-align: center;
      padding: 24px 0;
      font-size: 11px;
      color: #4E4D49;
      border-top: 1px solid #1A1A22;
    }
    footer.footer a { color: #4E4D49; text-decoration: none; }
    footer.footer a:hover { color: #5DCAA5; }
    footer.footer .sep { margin: 0 6px; color: #2A2A30; }

    @media (max-width: 600px) {
      .header h1 { font-size: 22px; }
      .section h2 { font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span class="sep">›</span><a href="/http">HTTP Status Codes</a><span class="sep">›</span><span>${c.code} ${escapeHtml(c.name)}</span>
    </nav>

    <header class="header">
      <span class="badge">${klass.label} · ${c.klass}</span>
      <h1><span class="num">${c.code}</span> ${escapeHtml(c.name)}</h1>
      <p class="summary">${escapeHtml(c.summary)}</p>
    </header>

    <section class="section">
      <h2>What ${c.code} ${escapeHtml(c.name)} means</h2>
      <p>${c.meaning}</p>
      ${c.when ? `<p><strong style="color:#F0EDE6">When servers should return it:</strong> ${escapeHtml(c.when)}</p>` : ''}
    </section>

    ${causesHtml}
    ${fixesHtml}
    ${exampleHtml}

    <section class="section">
      <h2>Related status codes</h2>
      <div class="related-grid">
${relatedCards}
      </div>
    </section>

    ${faqHtml}

    <div class="meta-box">
      <strong style="color:#C8C8C0">Defined in:</strong> ${escapeHtml(c.rfc || 'RFC 9110')} · <strong style="color:#C8C8C0">Class:</strong> <code>${c.klass} ${klass.label}</code>
    </div>

    <section class="section">
      <h2>More references</h2>
      <p>For a one-page reference of all HTTP status codes, see the <a href="/cheatsheets/http">HTTP cheat sheet</a>. For testing API responses, try the <a href="/tools/api">API Tester tool</a>. For inspecting responses on the command line, the <a href="/cheatsheets/curl">curl cheat sheet</a> covers the most common flags.</p>
    </section>

    <footer class="footer">
      <a href="/">Home</a><span class="sep">|</span>
      <a href="/http">All Status Codes</a><span class="sep">|</span>
      <a href="/cheatsheets/http">HTTP Cheat Sheet</a><span class="sep">|</span>
      <a href="/cheatsheets/curl">Curl Cheat Sheet</a><span class="sep">|</span>
      <a href="/tools/api">API Tester</a><span class="sep">|</span>
      <a href="/blog">Blog</a><span class="sep">|</span>
      <a href="/for-devs">Developer Hub</a>
    </footer>
  </div>
</body>
</html>
`;
}

function indexHtml(allCodes) {
  const groups = ['1xx', '2xx', '3xx', '4xx', '5xx'];
  const groupHtml = groups.map(g => {
    const info = KLASS_INFO[g];
    const codes = allCodes.filter(c => c.klass === g).sort((a, b) => a.code - b.code);
    return `    <section class="group">
      <h2 style="color:${info.color}">${g} ${info.label}</h2>
      <p class="group-desc">${info.desc}</p>
      <div class="code-grid">
${codes.map(c => `        <a href="/http/${c.code}" class="code-card" data-search="${c.code} ${escapeHtml(c.name).toLowerCase()} ${escapeHtml(c.summary).toLowerCase()}">
          <div class="card-num" style="color:${info.color}">${c.code}</div>
          <div class="card-name">${escapeHtml(c.name)}</div>
          <div class="card-summary">${escapeHtml(c.summary)}</div>
        </a>`).join('\n')}
      </div>
    </section>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTTP Status Codes: Complete Reference with Causes, Fixes, and Examples | TerminalFeed</title>
  <meta name="description" content="Every HTTP status code explained on its own page. Search by number or keyword. Each page has the meaning, common causes, fixes for error codes, real curl examples, and FAQ. ${allCodes.length} codes covered.">
  <meta name="keywords" content="http status codes, http response codes, http error codes, status code reference, 404, 500, 403, 401, 429, 502, 503, 504">
  <link rel="canonical" href="https://terminalfeed.io/http">
  <meta property="og:title" content="HTTP Status Codes: Complete Reference">
  <meta property="og:description" content="Every HTTP status code explained on its own page. ${allCodes.length} codes with meanings, causes, fixes, and examples.">
  <meta property="og:url" content="https://terminalfeed.io/http">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://terminalfeed.io/og-image.png">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="TerminalFeed Blog" href="/feed.xml">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'HTTP Status Codes: Complete Reference',
    description: `Every HTTP status code explained on its own page. ${allCodes.length} codes with meanings, causes, fixes, and examples.`,
    url: 'https://terminalfeed.io/http',
    publisher: {
      '@type': 'Organization',
      name: 'TerminalFeed',
      logo: { '@type': 'ImageObject', url: 'https://terminalfeed.io/logo.png' },
    },
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://terminalfeed.io/' },
      { '@type': 'ListItem', position: 2, name: 'HTTP Status Codes', item: 'https://terminalfeed.io/http' },
    ],
  })}</script>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0A0A0C;
      color: #D4D2CB;
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace;
      line-height: 1.7;
      padding: 24px 16px 64px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    .breadcrumbs { font-size: 11px; color: #4E4D49; margin-bottom: 18px; }
    .breadcrumbs a { color: #4E4D49; text-decoration: none; }
    .breadcrumbs a:hover { color: #5DCAA5; }
    .breadcrumbs .sep { margin: 0 6px; color: #2A2A30; }

    .header { border-bottom: 1px solid #1E1E24; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; color: #F0EDE6; margin-bottom: 10px; font-weight: 600; }
    .header h1 span { color: #5DCAA5; }
    .header p { font-size: 13.5px; color: #A8A6A0; max-width: 750px; line-height: 1.7; }

    .search-box { margin-bottom: 32px; }
    .search-box input {
      width: 100%;
      background: #111114;
      border: 1px solid #1E1E24;
      color: #F0EDE6;
      padding: 12px 16px;
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
    }
    .search-box input:focus { outline: none; border-color: #5DCAA5; }
    .search-box input::placeholder { color: #4E4D49; }

    .group { margin-bottom: 48px; }
    .group h2 { font-size: 18px; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
    .group-desc { font-size: 12px; color: #8A8880; margin-bottom: 18px; }

    .code-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    .code-card {
      background: #111114;
      border: 1px solid #1A1A22;
      border-radius: 5px;
      padding: 14px 16px;
      text-decoration: none;
      transition: border-color 0.15s, background 0.15s;
      display: block;
    }
    .code-card:hover { border-color: #5DCAA5; background: #14141A; }
    .card-num { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
    .card-name { font-size: 13px; color: #F0EDE6; margin-bottom: 6px; }
    .card-summary { font-size: 11px; color: #8A8880; line-height: 1.6; }
    .hidden { display: none; }

    .meta-row {
      display: flex;
      gap: 24px;
      margin-top: 24px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #8A8880;
    }
    .meta-row strong { color: #5DCAA5; font-weight: 600; }

    footer.footer {
      margin-top: 48px;
      text-align: center;
      padding: 24px 0;
      font-size: 11px;
      color: #4E4D49;
      border-top: 1px solid #1A1A22;
    }
    footer.footer a { color: #4E4D49; text-decoration: none; }
    footer.footer a:hover { color: #5DCAA5; }
    footer.footer .sep { margin: 0 6px; color: #2A2A30; }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span class="sep">›</span><span>HTTP Status Codes</span>
    </nav>

    <header class="header">
      <h1><span>›_</span> HTTP STATUS CODES</h1>
      <p>Every HTTP status code on its own page. Each entry covers what the code means, when servers should return it, common causes (for errors), how to fix them, a real curl example, related codes, and a small FAQ. ${allCodes.length} codes documented. Search by number or keyword.</p>
      <div class="meta-row">
        <span><strong>Source of truth:</strong> RFC 9110 + extension RFCs</span>
        <span><strong>One-page version:</strong> <a href="/cheatsheets/http" style="color:#5DCAA5;text-decoration:none">cheat sheet</a></span>
        <span><strong>Curl reference:</strong> <a href="/cheatsheets/curl" style="color:#5DCAA5;text-decoration:none">cheat sheet</a></span>
      </div>
    </header>

    <div class="search-box">
      <input type="text" id="search" placeholder="Search by number or keyword (e.g. 404, rate limit, gateway, redirect)">
    </div>

${groupHtml}

    <footer class="footer">
      <a href="/">Home</a><span class="sep">|</span>
      <a href="/cheatsheets/http">HTTP Cheat Sheet</a><span class="sep">|</span>
      <a href="/cheatsheets/curl">Curl Cheat Sheet</a><span class="sep">|</span>
      <a href="/tools/api">API Tester</a><span class="sep">|</span>
      <a href="/for-devs">Developer Hub</a><span class="sep">|</span>
      <a href="/blog">Blog</a>
    </footer>
  </div>
  <script>
    document.getElementById('search').addEventListener('input', function(e) {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('.code-card').forEach(card => {
        card.classList.toggle('hidden', q && !card.dataset.search.includes(q));
      });
      document.querySelectorAll('.group').forEach(g => {
        const visible = g.querySelectorAll('.code-card:not(.hidden)').length;
        g.style.display = visible ? '' : 'none';
      });
    });
  </script>
</body>
</html>
`;
}

// ---------- WRITE ----------

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const c of CODES) {
  const html = pageHtml(c, CODES);
  fs.writeFileSync(path.join(OUT_DIR, `${c.code}.html`), html);
  written++;
}
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml(CODES));

console.log(`Generated ${written} status code pages + 1 index → public/http/`);

// Export sitemap entries for scripts/update-sitemap pipeline (optional)
const sitemapEntries = [
  '  <url><loc>https://terminalfeed.io/http</loc><lastmod>2026-05-05</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>',
  ...CODES.map(c => `  <url><loc>https://terminalfeed.io/http/${c.code}</loc><lastmod>2026-05-05</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
].join('\n');
fs.writeFileSync(path.join(__dirname, '../public/http/_sitemap-fragment.xml'), sitemapEntries);
console.log(`Wrote sitemap fragment with ${CODES.length + 1} entries → public/http/_sitemap-fragment.xml`);
