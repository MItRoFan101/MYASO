const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла. Допустимые: jpeg, jpg, png, gif, webp, mp4, webm'));
    }
  }
});

// In-memory data storage
let orders = [];
let messages = [];
let products = [
  { id: 1, name: 'Говядина премиум', price: 1200, image: 'beef.jpg', weightOptions: [100, 200, 300, 500, 1000] },
  { id: 2, name: 'Свинина на кости', price: 800, image: 'pork.jpg', weightOptions: [100, 200, 300, 500, 1000] },
  { id: 3, name: 'Баранина каре', price: 950, image: 'lamb.jpg', weightOptions: [100, 200, 300, 500, 1000] },
  { id: 4, name: 'Куриное филе', price: 450, image: 'chicken.jpg', weightOptions: [100, 200, 300, 500, 1000] }
];

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order ${orderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Заказ не найден' });
  }
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  res.status(201).json(order);
});

app.delete('/api/orders', (req, res) => {
  orders = [];
  res.json({ message: 'Все заказы удалены' });
});

app.delete('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders.splice(orderIndex, 1);
    // Also delete messages for this order
    messages = messages.filter(m => m.orderId !== orderId);
    res.json({ message: 'Заказ удален' });
  } else {
    res.status(404).json({ error: 'Заказ не найден' });
  }
});

app.put('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    // Update only the status field
    orders[orderIndex].status = req.body.status;
    res.json(orders[orderIndex]);
  } else {
    res.status(404).json({ error: 'Заказ не найден' });
  }
});

app.get('/api/orders/:orderId/messages', (req, res) => {
  console.log('=== GET /api/orders/:orderId/messages ===');
  console.log('Order ID:', req.params.orderId);
  const orderMessages = messages.filter(m => m.orderId === parseInt(req.params.orderId));
  console.log('Messages found:', orderMessages.length);
  res.json(orderMessages.sort((a, b) => a.createdAt - b.createdAt));
});

app.post('/api/orders/:orderId/messages', upload.single('file'), (req, res) => {
  console.log('=== POST /api/orders/:orderId/messages ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);
  console.log('Content-Type:', req.get('content-type'));
  
  const { text } = req.body;
  const mediaFile = req.file;
  
  if (!text && !mediaFile) {
    console.log('Error: Message is empty');
    return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  }
  
  try {
    const message = {
      id: Date.now(),
      orderId: parseInt(req.params.orderId),
      senderId: req.body.senderId,
      senderType: req.body.senderType,
      text: text || '',
      mediaUrl: mediaFile ? `/uploads/chat/${mediaFile.filename}` : null,
      mediaType: mediaFile ? (mediaFile.mimetype.startsWith('video') ? 'video' : 'image') : null,
      createdAt: new Date().toISOString(),
      isReadByAdmin: req.body.senderType === 'customer'
    };
    
    messages.push(message);
    console.log('Message created:', message);
    
    // Emit to all clients in the order room
    io.to(`order_${message.orderId}`).emit('new_message', message);
    
    console.log('Message sent successfully');
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Ошибка создания сообщения: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Products API
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Товар не найден' });
  }
});

app.post('/api/products', (req, res) => {
  const product = {
    id: Date.now(),
    ...req.body
  };
  products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    products[productIndex] = { ...products[productIndex], ...req.body };
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ error: 'Товар не найден' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    products.splice(productIndex, 1);
    res.json({ message: 'Товар удален' });
  } else {
    res.status(404).json({ error: 'Товар не найден' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for http://localhost:5173`);
});