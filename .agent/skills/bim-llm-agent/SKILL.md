---
name: bim-llm-agent
description: Integrate BIM LLM Code Agent — an AI agent that processes IFC/BIM files using LLMs (OpenAI/Ollama), LangChain RAG, and IfcOpenShell to answer natural language queries, generate Python code, and produce tables/charts from BIM data.
---

# BIM LLM Code Agent Skill

> **Source**: [mac999/BIM_LLM_code_agent](https://github.com/mac999/BIM_LLM_code_agent) (MIT License)

## When to use

- When the user wants to **query BIM/IFC files using natural language** (e.g., "List all rooms starting with 'A' and their areas")
- When the user needs **automated Python code generation** from IFC models
- When the user wants **tables, charts, or 3D visualizations** from BIM data
- When integrating a **BIM AI chatbot** into the existing project frontend
- When setting up **RAG (Retrieval-Augmented Generation)** over IFC code examples

## Architecture overview

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (existing smart-public-investment-manager app)      │
│                                                      │
│  BIMAgentChat.tsx ──► POST /api/bim-agent/query      │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────┐
│              Python Backend (FastAPI)                 │
│                                                      │
│  bim_agent_api.py                                    │
│  ├── /query         → Natural language → code → exec │
│  ├── /upload        → Upload IFC/PDF to vector store │
│  └── /models        → List available LLM models      │
│                                                      │
│  Core Engine (from BIM_LLM_code_agent):              │
│  ├── LangChain pipeline (prompt → BIM_chain → LLM)   │
│  ├── FAISS vector store (RAG over code examples)     │
│  ├── IfcOpenShell (IFC file parsing)                 │
│  └── Code execution sandbox (with safety checks)    │
└─────────────────────────────────────────────────────┘
```

## Workflow checklist

```
- [ ] Step 1: Set up Python backend environment
- [ ] Step 2: Install BIM LLM Agent core dependencies
- [ ] Step 3: Create FastAPI wrapper around bim_code_agent.py
- [ ] Step 4: Set up knowledge base and vector store
- [ ] Step 5: Create React frontend component (BIMAgentChat)
- [ ] Step 6: Add API service in frontend
- [ ] Step 7: Add route and navigation
- [ ] Step 8: Configure environment variables
- [ ] Step 9: Test end-to-end
```

---

## Step 1: Python backend environment

Create directory `bim-agent-api/` at project root:

```
bim-agent-api/
├── bim_agent_api.py          # FastAPI server
├── bim_code_agent.py         # Core engine (from repo)
├── requirements.txt          # Python dependencies
├── code_sample/              # IFC code examples for RAG
├── expert_kb_files/          # Uploaded BIM files
├── vectorstore_db/           # FAISS persisted index
└── .env                      # API keys
```

## Step 2: Install dependencies

```txt
# requirements.txt
fastapi>=0.104.0
uvicorn>=0.24.0
python-multipart>=0.0.6
matplotlib
pandas
numpy
pyvista
plotly
langchain-openai
langchain-core
langchain-community
ifcopenshell
faiss-cpu
python-dotenv
# Optional for Ollama models:
ollama
fastembed
```

Install:
```bash
cd bim-agent-api
pip install -r requirements.txt
```

## Step 3: FastAPI wrapper (`bim_agent_api.py`)

Wrap the core `bim_code_agent.py` with a REST API:

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os, json

load_dotenv()

from bim_code_agent import init_multi_agent, update_vector_db, get_bim_input_files

app = FastAPI(title="BIM LLM Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize on startup
llm = chains = vector_db = memory = None

@app.on_event("startup")
async def startup():
    global llm, chains, vector_db, memory
    llm, chains, vector_db, memory = init_multi_agent(
        tools_option=[],
        model_name=os.getenv("BIM_LLM_MODEL", "gpt-4o"),
        init_db=True
    )

class QueryRequest(BaseModel):
    query: str
    model: str | None = None

class QueryResponse(BaseModel):
    success: bool
    results: list
    code: str | None = None
    error: str | None = None

@app.post("/api/bim-agent/query", response_model=QueryResponse)
async def query_bim(req: QueryRequest):
    """Process a natural language BIM query."""
    try:
        response = chains.invoke({
            "input": req.query,
            "chat_history": []
        })

        results = []
        if isinstance(response, list):
            for item in response:
                if isinstance(item, str):
                    results.append({"type": "html", "content": item})
                elif hasattr(item, 'to_json'):  # Plotly figure
                    results.append({"type": "plotly", "content": item.to_json()})
                elif hasattr(item, 'to_dict'):  # DataFrame
                    results.append({"type": "table", "content": item.to_dict()})
                else:
                    results.append({"type": "text", "content": str(item)})
        elif isinstance(response, str):
            results.append({"type": "text", "content": response})

        return QueryResponse(success=True, results=results)
    except Exception as e:
        return QueryResponse(success=False, results=[], error=str(e))

@app.post("/api/bim-agent/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload IFC/PDF/JSON/TXT/CSV to the knowledge base."""
    allowed = {".ifc", ".pdf", ".json", ".txt", ".csv"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    os.makedirs("./expert_kb_files", exist_ok=True)
    path = f"./expert_kb_files/{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())

    update_vector_db(vector_db, file.filename)
    return {"success": True, "filename": file.filename}

@app.get("/api/bim-agent/models")
async def list_models():
    """List available LLM models."""
    return {
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o (OpenAI)", "type": "cloud"},
            {"id": "codegemma:7b", "name": "CodeGemma 7B", "type": "ollama"},
            {"id": "qwen2.5-coder:7b", "name": "Qwen2.5 Coder 7B", "type": "ollama"},
            {"id": "llama3:8b-instruct-q4_K_M", "name": "Llama3 8B", "type": "ollama"},
            {"id": "gemma3", "name": "Gemma 3", "type": "ollama"},
        ]
    }

@app.get("/health")
async def health():
    return {"status": "ok", "vector_db_loaded": vector_db is not None}
```

Run with:
```bash
cd bim-agent-api
uvicorn bim_agent_api:app --host 0.0.0.0 --port 8002 --reload
```

## Step 4: Knowledge base setup

1. Copy `code_sample/` folder from [BIM_LLM_code_agent repo](https://github.com/mac999/BIM_LLM_code_agent) — contains IFC code examples for RAG
2. The vector store will auto-build on first startup from `code_sample/` files
3. Users can upload additional files via the `/upload` endpoint

## Step 5: React frontend component

Create `features/bim-agent/BIMAgentChat.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import { Send, Upload, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  results?: Array<{ type: string; content: any }>;
}

export function BIMAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BIM_API = import.meta.env.VITE_BIM_AGENT_URL || 'http://localhost:8002';

  const sendQuery = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BIM_API}/api/bim-agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.success ? 'Query executed successfully' : data.error || 'Error',
        results: data.results,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Connection error: ${err.message}`,
      }]);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await fetch(`${BIM_API}/api/bim-agent/upload`, {
        method: 'POST', body: formData,
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `File "${file.name}" uploaded to knowledge base.`,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Upload failed: ${err.message}`,
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && <Bot className="w-6 h-6 text-blue-500 mt-1" />}
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <p>{msg.content}</p>
              {msg.results?.map((r, j) => (
                <div key={j} className="mt-2">
                  {r.type === 'html' && (
                    <div dangerouslySetInnerHTML={{ __html: r.content }} />
                  )}
                  {r.type === 'table' && (
                    <pre className="text-xs overflow-auto">{JSON.stringify(r.content, null, 2)}</pre>
                  )}
                  {r.type === 'text' && <p>{r.content}</p>}
                </div>
              ))}
            </div>
            {msg.role === 'user' && <User className="w-6 h-6 text-gray-500 mt-1" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <Bot className="w-6 h-6 text-blue-500 mt-1" />
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-4 flex gap-2">
        <input type="file" ref={fileInputRef} className="hidden"
          accept=".ifc,.pdf,.json,.txt,.csv"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
        />
        <button onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <Upload className="w-5 h-5" />
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendQuery()}
          placeholder="Ask about your BIM model... (e.g. 'List all rooms with area > 50m²')"
          className="flex-1 rounded-lg border px-4 py-2"
        />
        <button onClick={sendQuery} disabled={loading}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

## Step 6: Frontend API service

Create `services/bimAgentService.ts`:

```typescript
const BIM_API = import.meta.env.VITE_BIM_AGENT_URL || 'http://localhost:8002';

export const bimAgentService = {
  async query(query: string, model?: string) {
    const res = await fetch(`${BIM_API}/api/bim-agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, model }),
    });
    return res.json();
  },

  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BIM_API}/api/bim-agent/upload`, {
      method: 'POST', body: formData,
    });
    return res.json();
  },

  async getModels() {
    const res = await fetch(`${BIM_API}/api/bim-agent/models`);
    return res.json();
  },

  async health() {
    const res = await fetch(`${BIM_API}/health`);
    return res.json();
  },
};
```

## Step 7: Routes and navigation

In `App.tsx`, add:
```typescript
import { BIMAgentChat } from './features/bim-agent/BIMAgentChat';

// Inside routes:
<Route path="/bim-agent" element={<BIMAgentChat />} />
```

In `components/Sidebar.tsx`, add nav item with `Bot` icon from Lucide.

## Step 8: Environment variables

### Python backend (`bim-agent-api/.env`):
```env
OPENAI_API_KEY=<your_key>
LANGCHAIN_API_KEY=<your_key>        # optional
TAVILY_API_KEY=<your_key>           # optional, for web search
BIM_LLM_MODEL=gpt-4o               # default model
```

### React frontend (`.env`):
```env
VITE_BIM_AGENT_URL=http://localhost:8002
```

## Step 9: Testing

1. Start Python backend: `cd bim-agent-api && uvicorn bim_agent_api:app --port 8002 --reload`
2. Start React frontend: `npm run dev`
3. Navigate to `/bim-agent`
4. Upload an IFC file
5. Test queries:
   - `"How many walls are in this model?"`
   - `"List all rooms with their areas in a table"`
   - `"Show a 3D chart of room volumes"`

## Key components reference (from source repo)

| Component | Purpose |
|-----------|---------|
| `init_multi_agent()` | Initialize LLM, FAISS vector store, memory, and LangChain pipeline |
| `BIM_chain` | Custom LangChain chain: retrieves RAG context → builds IFC-aware prompt |
| `run_python_code()` | Safely exec generated Python code with retry logic (3 attempts) |
| `preprocess_code()` | Extract Python from markdown, validate syntax, check safety |
| `update_vector_db()` | Add new documents (PDF/JSON/TXT/IFC) to FAISS index |
| `check_safe_eval()` | Block dangerous imports (`os`, `subprocess`, `shutil`, etc.) |

## LLM models supported

| Model | Type | Best for |
|-------|------|----------|
| `gpt-4o` | OpenAI Cloud | Highest accuracy, best code generation |
| `codegemma:7b` | Ollama Local | Good code generation, privacy |
| `qwen2.5-coder:7b` | Ollama Local | Strong coding, multilingual |
| `llama3:8b` | Ollama Local | General purpose |
| `gemma3` | Ollama Local | Good balance of speed/quality |

## Known limitations

- LLM may hallucinate or generate incomplete code (mitigated by 3-retry loop)
- Local Ollama models are less accurate than GPT-4o for complex BIM queries
- Code execution sandbox has basic safety checks — not production-hardened
- Consider [Graph RAG with Neo4j](https://github.com/mac999/BIM_graph_agent) for complex relationship queries

## Integration with existing IFC Converter API

This project already has `ifc-converter-api/` for IFC→XKT conversion. The BIM Agent complements it:
- **IFC Converter API**: Visual 3D rendering (IFC → XKT → xeokit viewer)
- **BIM LLM Agent**: Data analysis and natural language queries over IFC data

Both can work together — upload IFC file once, view in 3D viewer AND query via AI agent.
