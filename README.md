# A Svete website written in HTML, CSS, some JS
## Built for Hack Club's Grub Program
### Helps people learn svelte 5 rune syntax.

1. **✅ Removed hardcoded API key** from `script.js`
2. **✅ Created `.env` file** to store the API key securely
3. **✅ Created secure Python server** that acts as a proxy
4. **✅ Updated `script.js`** to call the secure `/api/generate` endpoint
5. **✅ Added `.gitignore`** to prevent committing sensitive files

## How to Run:

```bash
# Start the server
python3 simple_server.py

# Or use the start script
./start_server.sh
```

## Access Your Secure Website:
Visit `http://localhost:8000` in your browser

