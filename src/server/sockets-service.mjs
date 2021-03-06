import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import { FoodFactory } from './server-food.mjs';
import { PlayersFactory } from './server-players.mjs';
import {
	mapBoundary,
	initialPlayerSize,
	initialPlayerPosition,
} from './constants';

let app = express();
let httpServer = http.createServer(app);
let io = socketio(httpServer);

app.use(express.static('../client'));

let food = FoodFactory(
	{ x: mapBoundary.max, y: mapBoundary.max },
	initialPlayerSize,
	io
);

let players = PlayersFactory(io);

food.generate(200);

io.on('connection', socket => {
	socket.on('request-food', () => {
		socket.emit('send-food', food.state);
		io.emit('send-food', food.state);
	});

	socket.on('request-players', () => {
		io.emit('request-players');
	});

	socket.on('player-joined', player => {
		players.insertPlayer(player);
		// players.startTimer(player.id);
		io.emit('server-player-joind', player);
	});

	socket.on('new-player-position', data => {
		players.movePlayer(data.id, data.position);
		io.emit('new-player-position-from-server', data);
	});

	socket.on('reset-player', id => {
		players.resetPlayer(id);
	});

	socket.on('keep-alive', id => {
		players.keepAlive(id);
	});

	socket.on('disconnect', () => {
		io.emit('user-disconnected', socket.id);
		players.removePlayer(socket.id);
	});

	socket.on('piece-of-food-relives', () => {});

	socket.on('generate-food', data => {
		food.generate(200);
		socket.emit('send-food', food);
		io.emit('send-food', food);
	});

	socket.on('reset-food', data => {
		food.resetFood();
		socket.emit('send-food', food.state);
		io.emit('send-food', food.state);
	});
});

const collisionDetectorInterval = setInterval(function () {
	players.detectCollision(0.2);
	food.foodCollisionDetector(players.state.players, players.increaseSize);
}, 10);

const stateSyncInterval = setInterval(function () {
	io.emit('sync-food-state', food.state.food);
	io.emit('sync-players-state', players.state.players);
}, 3000);

httpServer.listen(3000, () => {
	console.log('listening on *:3000');
});
