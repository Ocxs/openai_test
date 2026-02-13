# Dual LLM Workbench (No-API)

A pure static web page for **copy + open** workflow: write one prompt, then manually paste/send it on ChatGPT and Gemini official websites.

## Run locally

Use any static server, for example:

```bash
npx serve .
```

Then open the shown localhost URL.

## Notes

- No backend, no API key, no OpenAI/Google API requests.
- Clipboard API is most reliable in secure contexts (`https` or `localhost`) and user-click handlers.
- If "Open both" is blocked, allow pop-ups for your site or use the two separate open buttons.
- No iframe embedding for third-party sites due to common X-Frame-Options/CSP restrictions.
