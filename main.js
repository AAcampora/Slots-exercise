import { Application, Graphics, Text, TextStyle, Assets, Sprite } from 'pixi.js';
import { ReelGroup } from './ts/reels/ReelGroup';
import { ViewMetrics } from './ts/constants/ViewMetrics';

//entry point of application
(async () => {
	const app = new Application();

	globalThis.__PIXI_APP__ = app;

	await app.init({
		width: ViewMetrics.CANVAS_WIDTH,
		height: ViewMetrics.CANVAS_HEIGHT,
		backgroundAlpha: 0.5,
		backgroundColor: 0xffea00,
	});

	app.canvas.style.position = 'absolute';

	document.body.appendChild(app.canvas);

	const gameReel = new ReelGroup();
	gameReel.init();
	app.stage.addChild(gameReel);

	window.addEventListener('keydown', (event) => {
		if (event.code === 'Space') {
			gameReel.startSpinning(Math.round(Math.random() * 100));
		}
	});
})();
