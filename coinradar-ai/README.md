# Coin Radar AI Local Prototype

## Docker

Build the chatbot image from the repository root (it needs the shared `lambda/`
handlers):

```bash
docker build -t coinradar-ai .
```

Run it with Ollama already running on your computer:

```bash
docker run --rm -p 3000:3000 -e OLLAMA_MODEL=llama3.2:latest coinradar-ai
```

The image defaults `OLLAMA_URL` to `http://host.docker.internal:11434`, which
allows Docker Desktop on Windows and macOS to reach a host-installed Ollama.
On Linux, add `--add-host=host.docker.internal:host-gateway` to the `docker run`
command. Override `OLLAMA_URL` when Ollama is hosted elsewhere.

Run the backend with:

```bash
npm start
```

Then open the watchlist page and use the AI assistant panel.

The service must remain running while you use the PHP site. Confirm it is available at `http://127.0.0.1:3000/health`. Ollama must also be running locally (normally at `http://127.0.0.1:11434`).
