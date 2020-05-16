import { set } from 'lodash';
import areParticlesIntersected from '../helpers/areParticlesIntersected';

const createCollisionDetector = (state, areParticlesIntersected) => ({
	foodCollisionDetector: (x, y, size, player, socket) => {
		for (let id in state.food) {
			let piece = state.food[id];
			let playerProps = { x: piece.x, y: piece.y, size: size };
			let pieceOfFoodProps = { x: x, y: y, size: state.foodSize };
			if (
				areParticlesIntersected(pieceOfFoodProps, playerProps) &&
				piece.active
			) {
				socket.emit('piece-eaten', id);
				set(piece, 'active', false);
				player.updateSize(1);
			}
		}
	},
});

const foodSetter = state => ({
	setFood: (food, foodSize) => {
		state.food = food;
		state.foodSize = foodSize;
	},
});

const deleter = state => ({
	deletePiece: id => {
		set(state, `food[${[id]}].active`, false);
	},
});

const translater = state => ({
	translateFood: (x, y, sk) => {
		state.translateVector.x = -x;
		state.translateVector.y = -y;
		sk.translate(state.translateVector.x, state.translateVector.y);
	},
});

const drawer = state => ({
	draw: sk => {
		for (let item in state.food) {
			let piece = state.food[item];
			if (state.food[item].active) {
				sk.ellipse(piece.x, piece.y, state.foodSize);
			}
		}
	},
});

const FoodFactory = (foodSize = 10) => {
	const state = {
		food: [],
		foodSize: foodSize,
		translateVector: { x: 0, y: 0 },
	};

	return Object.freeze({
		state,
		...foodSetter(state),
		...deleter(state),
		...translater(state),
		...createCollisionDetector(state, areParticlesIntersected),
		...drawer(state),
	});
};

export { FoodFactory };
