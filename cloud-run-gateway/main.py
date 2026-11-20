
import os
import secrets

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="CTI RAG Gateway", version="1.0")

COLAB_BACKEND_URL = os.getenv("COLAB_BACKEND_URL", "").rstrip("/")
COLAB_ACCESS_KEY = os.getenv("COLAB_ACCESS_KEY", "")
GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "")

TIMEOUT = httpx.Timeout(900.0, connect=20.0)

def check_gateway_key(key):
    if not GATEWAY_API_KEY:
        raise HTTPException(503, "Gateway key is not configured.")

    if not secrets.compare_digest(str(key or ""), GATEWAY_API_KEY):
        raise HTTPException(401, "Invalid gateway key.")

def check_colab_config():
    if not COLAB_BACKEND_URL or not COLAB_ACCESS_KEY:
        raise HTTPException(503, "Colab backend is not configured.")

@app.get("/healthz")
def healthz():
    return {"status": "gateway-running"}

async def forward(path, method, payload=None):
    check_colab_config()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.request(
                method,
                f"{COLAB_BACKEND_URL}{path}",
                headers={"X-Access-Key": COLAB_ACCESS_KEY},
                json=payload if method == "POST" else None,
            )

        try:
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code,
            )
        except ValueError:
            return JSONResponse(
                content={"detail": response.text[:2000]},
                status_code=response.status_code,
            )

    except httpx.TimeoutException:
        raise HTTPException(504, "Colab backend timed out.")
    except httpx.RequestError:
        raise HTTPException(502, "Cannot connect to Colab backend.")

@app.get("/api/health")
async def health(
    x_gateway_key: str | None = Header(default=None)
):
    check_gateway_key(x_gateway_key)
    return await forward("/api/health", "GET")

@app.post("/api/query")
async def query(
    request: Request,
    x_gateway_key: str | None = Header(default=None),
):
    check_gateway_key(x_gateway_key)

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON request.")

    return await forward("/api/query", "POST", payload)