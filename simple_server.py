# Keeps the gemini key secure
import os
import json
import http.server
import urllib.request
import urllib.parse
from urllib.error import HTTPError

class APIHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        """Serve static files"""
        if self.path == '/':
            self.path = '/index.html'
        
        # Remove leading slash for file path
        file_path = self.path.lstrip('/')
        
        if '..' in file_path or file_path.startswith('/'):
            self.send_error(404)
            return
            
        try:
            # Try to serve from src directory
            full_path = os.path.join('src', file_path)
            if os.path.exists(full_path):
                with open(full_path, 'rb') as f:
                    content = f.read()
                
                # Set content type based on file extension
                if file_path.endswith('.html'):
                    content_type = 'text/html'
                elif file_path.endswith('.css'):
                    content_type = 'text/css'
                elif file_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif file_path.endswith('.svg'):
                    content_type = 'image/svg+xml'
                else:
                    content_type = 'text/plain'
                
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_error(404)
        except Exception as e:
            print(f"Error serving file: {e}")
            self.send_error(500)

    def do_POST(self):
        """Handle API requests"""
        if self.path == '/api/generate':
            self.handle_generate_api()
        else:
            self.send_error(404)

    def handle_generate_api(self):
        """Handle Gemini API proxy requests"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Parse JSON request
            request_data = json.loads(post_data.decode('utf-8'))
            prompt = request_data.get('prompt')
            
            if not prompt:
                self.send_json_response({'error': 'Prompt is required'}, 400)
                return
            
            # Get API key from environment variable
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                # Fallback: read from .env file manually
                try:
                    with open('.env', 'r') as f:
                        for line in f:
                            if line.startswith('GEMINI_API_KEY='):
                                api_key = line.split('=', 1)[1].strip()
                                break
                except FileNotFoundError:
                    pass
            
            if not api_key:
                self.send_json_response({'error': 'API key not configured'}, 500)
                return
            
            api_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}'
            
            payload = {
                'contents': [
                    {
                        'role': 'user',
                        'parts': [{'text': prompt}],
                    },
                ],
            }
            
            # Make request to Gemini API
            req = urllib.request.Request(
                api_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                self.send_json_response(result, 200)
                
        except HTTPError as e:
            print(f"HTTP error: {e}")
            self.send_json_response({'error': f'API request failed: {e.code}'}, 500)
        except Exception as e:
            print(f"Server error: {e}")
            self.send_json_response({'error': 'Internal server error'}, 500)

    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        json_data = json.dumps(data).encode('utf-8')
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_data)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json_data)

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 8000))
    
    print(f"Starting server on http://localhost:{PORT}")
    print("Press Ctrl+C to stop the server")
    
    server = http.server.HTTPServer(('localhost', PORT), APIHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
        server.server_close()


