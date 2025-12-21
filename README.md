# Brand Growth Analyzer

A modern web application that analyzes website brand growth by fetching data from DataForSEO API through an n8n workflow.

## Features

- 🎨 Modern, responsive UI with dark theme
- 📊 Real-time brand growth metrics visualization
- 🔄 Integration with n8n webhook workflows
- 📈 Data visualization for growth trends
- ⚡ Fast and lightweight

## Setup Instructions

### 1. Configure n8n Webhook URL

1. Open `script.js`
2. Replace `YOUR_N8N_WEBHOOK_URL_HERE` with your actual n8n webhook URL:
   ```javascript
   const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/your-webhook-id';
   ```

### 2. n8n Workflow Setup

Your n8n workflow should:

1. **Receive Webhook** - Accept POST requests with JSON body containing:
   ```json
   {
     "website": "example.com",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **Call DataForSEO API** - Use the website name to fetch brand growth data
   - You can use DataForSEO API nodes or HTTP Request node
   - Common endpoints: Domain Analytics, Backlinks, Keywords, etc.

3. **Process Data** - Transform the DataForSEO response into a format like:
   ```json
   {
     "metrics": {
       "organic_traffic": 125000,
       "backlinks": 5000,
       "referring_domains": 1200,
       "domain_rating": 65,
       "organic_keywords": 8500
     },
     "changes": {
       "organic_traffic": 15.5,
       "backlinks": 8.2,
       "referring_domains": 12.1
     },
     "historical": [
       { "date": "2024-01-01", "value": 100000 },
       { "date": "2024-02-01", "value": 110000 },
       { "date": "2024-03-01", "value": 125000 }
     ]
   }
   ```

4. **Return Response** - Send the processed data back to the webhook response

### 3. Deploy to GitHub Pages

#### Quick Setup:

1. **Create a GitHub repository** (if you haven't already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Brand Growth Analyzer"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - The workflow will automatically deploy when you push to the `main` branch

3. **Your site will be available at**:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is already configured and will automatically deploy your site on every push to the main branch.

#### Local Testing (Optional)

##### Option A: Simple HTTP Server (Python)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

##### Option B: Node.js HTTP Server
```bash
npx http-server -p 8000
```

##### Option C: VS Code Live Server
- Install "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

Then open `http://localhost:8000` in your browser.

## Usage

1. Enter a website domain name (e.g., `example.com`)
2. Click "Analyze Growth" button
3. View the brand growth metrics and visualizations

## Response Format

The website expects the n8n webhook to return JSON data. It can handle multiple formats:

### Format 1: Direct Metrics
```json
{
  "metrics": {
    "organic_traffic": 125000,
    "backlinks": 5000
  },
  "changes": {
    "organic_traffic": 15.5
  }
}
```

### Format 2: DataForSEO API Response
The website can parse standard DataForSEO API responses automatically.

### Format 3: Flat Structure
```json
{
  "organic_traffic": 125000,
  "backlinks": 5000,
  "organic_traffic_change": 15.5
}
```

## Customization

### Styling
Edit `styles.css` to customize colors, fonts, and layout. The CSS uses CSS variables for easy theming.

### Metrics Display
Modify the `extractMetrics()` function in `script.js` to handle different data structures from your n8n workflow.

### Chart Library
For more advanced charts, consider integrating:
- Chart.js
- D3.js
- ApexCharts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

