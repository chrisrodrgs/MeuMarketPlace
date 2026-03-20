const express = require('express');
const path = require('path');
const http = require('http');
const { connect } = require('./src/database/connection');
const routes = require('./routes');
const app = express();

const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const flash = require('connect-flash');
// const passport = require('passport'); // COMENTADO
const { middlewareGlobal } = require('./src/middlewares/middlewares');

// Configurar Passport (Google Auth) - COMENTADO
// require('./src/config/passport-google')();

// Criar servidor HTTP para Socket.IO
const server = http.createServer(app);

// Inicializar Socket.IO para o chat
const ChatServer = require('./src/socket/chatServer');
const chatServer = new ChatServer(server);

// Configuração da sessão
app.use(session({
    secret: 'fgsgsfdgsfdgsfdgsfhnmjb',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({
        db: 'session.sqlite',
        dir: './database'
    }),
    cookie: {
        maxAge: 100 * 60 * 60 * 24 * 7,
        httpOnly: true
    }
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Passport - COMENTADO
// app.use(passport.initialize());
// app.use(passport.session());

app.use(flash());
app.use(middlewareGlobal);
app.use(routes);

// Configuração das views
app.set('views', path.resolve(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// Rota 404
app.use((req, res, next) => {
    res.status(404).render('404');
});

const porta = 3000;

// Iniciar servidor com Socket.IO
server.listen(porta, () => {
    console.log("=".repeat(50));
    console.log("🚀 Servidor executado em:");
    console.log(`📱 Local: http://127.0.0.1:${porta}`);
    console.log(`💬 Chat disponível em: http://127.0.0.1:${porta}/chat`);
    console.log("=".repeat(50));
    connect();
});

module.exports = { app, server };