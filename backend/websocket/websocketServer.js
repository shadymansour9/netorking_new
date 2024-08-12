const http = require('https');
const WebSocket = require('wss');

// Define your WebSocket URL (useful for logging or other purposes)
const websocketUrl = 'https://netorking-new-59ln.vercel.app/'; // Replace with your actual URL

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Server is running');
  console.log(`HTTP request received. Server running at ${websocketUrl}`);
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (wss) => {
  console.log(`New WebSocket client connected at ${websocketUrl}`);

  wss.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Handle message quickly and asynchronously
    processMessage(message, wss);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (wss) => {
    wss.emit('connection', wss, request);
  });
});

// Ensure server starts listening as soon as possible
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is listening on ${websocketUrl}`);
});

// Example function for processing messages asynchronously
function processMessage(message, wss) {
  // Asynchronous operation to avoid blocking
  setImmediate(() => {
    wss.send(`Echo: ${message}`);
  });
}
