# IFC to XKT Converter API

Backend service for converting IFC files to XKT format for xeokit BIM Viewer.

## Features
- 🔄 Convert IFC to XKT format
- 📊 Progress tracking for long conversions
- 🧹 Auto-cleanup of old files (1 hour)
- 🔒 CORS support for frontend integration

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ZweBXA)

### Quick Deploy:
1. Click the button above OR go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Create new project → Deploy from GitHub repo
4. Select this repository
5. Railway will auto-detect Node.js and deploy

### Environment Variables (Optional):
- `PORT` - Server port (default: 3001)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS

## Deploy to Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (512MB RAM)

## API Endpoints

### Health Check
```
GET /
GET /health
```

### Convert IFC to XKT
```
POST /convert
Content-Type: multipart/form-data
Body: file=<your.ifc>

Response:
{
  "jobId": "uuid",
  "status": "processing",
  "statusUrl": "/status/uuid",
  "downloadUrl": "/download/uuid"
}
```

### Check Status
```
GET /status/:jobId

Response:
{
  "jobId": "uuid",
  "status": "processing|completed|failed",
  "progress": 0-100,
  "downloadUrl": "/download/uuid"
}
```

### Download XKT
```
GET /download/:jobId
```

## Local Development

```bash
cd ifc-converter-api
npm install
npm run dev
```

## Usage with Frontend

```javascript
// Upload IFC file
const formData = new FormData();
formData.append('file', ifcFile);

const response = await fetch('https://your-api.railway.app/convert', {
  method: 'POST',
  body: formData
});

const { jobId } = await response.json();

// Poll for status
const checkStatus = async () => {
  const status = await fetch(`https://your-api.railway.app/status/${jobId}`);
  const data = await status.json();
  
  if (data.status === 'completed') {
    // Load XKT in xeokit
    xktLoader.load({
      src: `https://your-api.railway.app/download/${jobId}`,
      id: 'model'
    });
  } else if (data.status === 'processing') {
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

## License

MIT
