const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const cors = require("cors")

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use('/uploads', express.static('uploads'));

app.use(cors())
// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Middleware para parse de JSON
app.use(express.json());

// Middleware de autenticação JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, 'sua_chave_secreta');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
// Rota de registro de usuário
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const user = await prisma.user.create({
      data: { email, password, name },
    });
    const token = jwt.sign({ userId: user.id }, 'sua_chave_secreta');
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ userId: user.id }, 'sua_chave_secreta');
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para criar um produto
app.post('/products', authenticate, upload.single('image'), async (req, res) => {
  const { name, description, price } = req.body;
  const PriceINT = parseInt(price); 
  
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const product = await prisma.product.create({
      data: { name, description, price: PriceINT, imageUrl },
    });
    console.log(product)
    res.status(201).json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});
// Rota para criar um serviço
app.post('/services', authenticate, async (req, res) => {
  const { name, description, price, duration } = req.body;
  const PriceINT = parseInt(price);
  const DurationINT = parseInt(duration);

  try {
    const service = await prisma.service.create({
      data: { name, description, price:PriceINT , duration:DurationINT },
    });
    res.status(201).json(service);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// Outras rotas para listar, atualizar e excluir produtos e serviços


// Rota para listar todos os produtos
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


app.get('/', async (req, res) => {
  return res.send("erro no sistema")
});

// Rota para obter um produto específico
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para atualizar um produto
app.put('/products/:id', authenticate, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { name, description, price, imageUrl },
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para excluir um produto
app.delete('/products/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.delete({ where: { id: parseInt(id) } });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para listar todos os serviços
app.get('/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para obter um serviço específico
app.get('/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para atualizar um serviço
app.put('/services/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration } = req.body;
  try {
    const service = await prisma.service.update({
      where: { id: parseInt(id) },
      data: { name, description, price, duration },
    });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota para excluir um serviço
app.delete('/services/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.delete({ where: { id: parseInt(id) } });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.listen( process.env.PORT || port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});