// Servidor Node.js + Socket.io para jogo de corrida online
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let players = {};
let raceStarted = false;
let finishLine = 800;

io.on('connection', (socket) => {
    // Novo jogador
    players[socket.id] = {
        x: 50,
        y: 120 + Object.keys(players).length * 80,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        name: 'Carro ' + socket.id.substring(0,4),
        finished: false,
        place: 0
    };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

    socket.on('move', () => {
        if (!raceStarted || players[socket.id].finished) return;
        players[socket.id].x += 10;
        if (players[socket.id].x >= finishLine && !players[socket.id].finished) {
            players[socket.id].finished = true;
            players[socket.id].place = 1 + Object.values(players).filter(p => p.finished).length - 1;
            io.emit('playerFinished', { id: socket.id, place: players[socket.id].place });
        }
        io.emit('playerMoved', { id: socket.id, ...players[socket.id] });
    });

    socket.on('startRace', () => {
        if (!raceStarted) {
            raceStarted = true;
            Object.values(players).forEach(p => { p.x = 50; p.finished = false; p.place = 0; });
            io.emit('raceStarted');
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
        if (Object.keys(players).length === 0) raceStarted = false;
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});