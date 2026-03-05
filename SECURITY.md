# Security Posture Notes

This project uses a mock payment flow for development and test only. It does not integrate with a real PSP and is not a PCI implementation.

## Token Storage Strategy

- Default policy: do not persist auth or payment tokens in `localStorage`.
- Prefer in-memory storage for short-lived access tokens during the SPA session.
- If persistence is required, use secure, `HttpOnly`, `Secure`, `SameSite` cookies managed by the backend.
- Never store card numbers, CVC, payment intent client secrets, or full webhook payloads in browser storage.

## CSRF Approach Options

- Preferred for cookie-based auth: synchronizer token or double-submit cookie.
- Validate CSRF token on state-changing API requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- Combine with `SameSite=Lax` or `SameSite=Strict` cookies where possible.
- If bearer tokens are used in headers (no cookies), CSRF risk is lower but still enforce origin/referrer checks for sensitive endpoints.

## XSS Prevention Rules

- Never use `innerHTML` with untrusted data.
- Avoid Angular `DomSanitizer` bypass APIs (`bypassSecurityTrust*`) unless there is a reviewed, documented exception.
- Treat all user input as untrusted and validate/sanitize before processing or sending to APIs.
- Keep Angular template binding defaults (`{{ }}`) for escaping and avoid manual HTML injection.
- Do not log secrets or sensitive payment fields (card number, CVC, tokens, client secrets).

## HTTPS and API Communication Assumptions

- Production deployment assumes HTTPS/TLS for all browser-to-API communication.
- Redirect all plain HTTP traffic to HTTPS in production environments.
- API endpoints should enforce modern TLS settings and valid certificates.
- Sensitive headers/tokens must only be transmitted over HTTPS.
- Development mock APIs may run locally without TLS, but this is not a production security model.
