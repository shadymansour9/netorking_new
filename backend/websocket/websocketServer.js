const http = require('https');
const WebSocket = require('ws');

// Define your WebSocket URL (useful for logging or other purposes)
const websocketUrl = 'https://netorking-new-59ln.vercel.app/'; // Replace with your actual URL

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Server is running');
  console.log(`HTTP request received. Server running at ${websocketUrl}`);
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log(`New WebSocket client connected at ${websocketUrl}`);

  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Handle message quickly and asynchronously
    processMessage(message, ws);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Ensure server starts listening as soon as possible
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is listening on ${websocketUrl}`);
});

// Example function for processing messages asynchronously
function processMessage(message, ws) {
  // Asynchronous operation to avoid blocking
  setImmediate(() => {
    ws.send(`Echo: ${message}`);
  });
}
