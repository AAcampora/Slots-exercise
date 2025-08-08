import { Assets, Sprite } from 'pixi.js';

export class TextureLoader {
	static LoadTextureFromString(name: string): Sprite {
		let sprite;
		(async () => {
			const texture = await Assets.load(name);
			sprite = new Sprite(texture);
		})();
		return sprite;
	}
}
