import { NextRequest } from 'next/server';

// Forward all requests from /webhook to /api/webhook
export async function POST(request: NextRequest) {
  console.log('Forwarding request from /webhook to /api/webhook');
  
  // Forward the request to the actual webhook handler
  const apiUrl = new URL('/api/webhook', request.url);
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: request.headers,
    body: request.body
  });
  
  return response;
}

// Handle GET requests for verification
export async function GET(request: NextRequest) {
  console.log('Forwarding GET request from /webhook to /api/webhook');
  
  // Forward the request to the actual webhook handler
  const apiUrl = new URL('/api/webhook', request.url);
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: request.headers
  });
  
  return response;
}
