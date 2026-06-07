"""
BotShield UI — Backend
Orquestra o simulador e faz streaming de eventos via SSE para o frontend React.
"""

import asyncio
import subprocess
import sys
import os
import json
import re
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import threading
import queue

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

process_state = {
    "proc": None,
    "running": False,
    "mode": None,
}

event_queue: queue.Queue = queue.Queue(maxsize=500)

stats = {
    "Humano":       {"ALLOW": 0, "CAPTCHA": 0, "BLOCK": 0},
    "Brute Force":  {"ALLOW": 0, "CAPTCHA": 0, "BLOCK": 0},
    "Scraper":      {"ALLOW": 0, "CAPTCHA": 0, "BLOCK": 0},
    "DoS Single":   {"ALLOW": 0, "CAPTCHA": 0, "BLOCK": 0},
    "Botnet":       {"ALLOW": 0, "CAPTCHA": 0, "BLOCK": 0},
}

LINE_RE = re.compile(
    r'\[(\d+)\]\s+\[([^\]]+)\]\s+IP:\s+([\d\.]+)\s+\|\s+(\w+)\s+(\/\S*)\s+->\s+(\w+)'
)

PROFILE_MAP = {
    "humano":       "Humano",
    "brute force":  "Brute Force",
    "brute":        "Brute Force",
    "scraper":      "Scraper",
    "dos single":   "DoS Single",
    "botnet":       "Botnet",
}

def normalize_profile(raw: str) -> str:
    raw = raw.strip().lower()
    for key, val in PROFILE_MAP.items():
        if key in raw:
            return val
    return raw.title()

def parse_line(line: str):
    m = LINE_RE.search(line)
    if not m:
        return None
    status, perfil_raw, ip, method, endpoint, decisao = m.groups()
    perfil = normalize_profile(perfil_raw)
    decisao = decisao.upper().strip()
    if decisao not in ("ALLOW", "CAPTCHA", "BLOCK"):
        return None
    if perfil in stats and decisao in stats[perfil]:
        stats[perfil][decisao] += 1
    return {
        "type": "request",
        "ts": datetime.utcnow().isoformat(),
        "status": int(status),
        "profile": perfil,
        "ip": ip,
        "method": method,
        "endpoint": endpoint,
        "decision": decisao,
        "stats": {k: dict(v) for k, v in stats.items()},
    }

def reset_stats():
    for p in stats:
        for k in stats[p]:
            stats[p][k] = 0

def read_output(proc):
    for raw_line in iter(proc.stdout.readline, b''):
        line = raw_line.decode('utf-8', errors='replace').rstrip()
        evt = parse_line(line)
        if evt:
            try:
                event_queue.put_nowait(evt)
            except queue.Full:
                pass
    process_state["running"] = False
    process_state["proc"] = None
    try:
        event_queue.put_nowait({"type": "stopped"})
    except queue.Full:
        pass


class StartRequest(BaseModel):
    mode: int


SIMULATOR_PATH = os.path.join(os.path.dirname(__file__), "simulator.py")


@app.post("/start")
def start_simulation(req: StartRequest):
    if process_state["running"]:
        return {"ok": False, "error": "Já existe uma simulação ativa."}
    if not os.path.exists(SIMULATOR_PATH):
        return {"ok": False, "error": f"simulator.py não encontrado em {SIMULATOR_PATH}"}

    reset_stats()
    while not event_queue.empty():
        try:
            event_queue.get_nowait()
        except queue.Empty:
            break

    proc = subprocess.Popen(
        [sys.executable, "-u", SIMULATOR_PATH],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        bufsize=0,
        env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"},
    )
    proc.stdin.write((str(req.mode) + "\n").encode())
    proc.stdin.flush()

    process_state["proc"] = proc
    process_state["running"] = True
    process_state["mode"] = req.mode

    t = threading.Thread(target=read_output, args=(proc,), daemon=True)
    t.start()

    return {"ok": True, "mode": req.mode}


@app.post("/stop")
def stop_simulation():
    proc = process_state.get("proc")
    if proc and process_state["running"]:
        proc.terminate()
        process_state["running"] = False
        process_state["proc"] = None
        return {"ok": True}
    return {"ok": False, "error": "Nenhuma simulação ativa."}


@app.post("/clear")
def clear_stats():
    reset_stats()
    while not event_queue.empty():
        try:
            event_queue.get_nowait()
        except queue.Empty:
            break
    try:
        event_queue.put_nowait({"type": "cleared", "stats": {k: dict(v) for k, v in stats.items()}})
    except queue.Full:
        pass
    return {"ok": True}


@app.get("/status")
def get_status():
    return {
        "running": process_state["running"],
        "mode": process_state["mode"],
        "stats": {k: dict(v) for k, v in stats.items()},
    }


@app.get("/stream")
async def stream_events():
    async def generator():
        yield "data: {\"type\":\"connected\"}\n\n"
        while True:
            try:
                evt = event_queue.get_nowait()
                yield f"data: {json.dumps(evt)}\n\n"
            except queue.Empty:
                await asyncio.sleep(0.05)
                yield ": ping\n\n"
    return StreamingResponse(generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)