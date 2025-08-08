import { Assets, Container, Sprite } from 'pixi.js';

export interface SymbolConfig {
	texture: string;
}

export class GameSymbol extends Container {
	private _texture: Sprite;

	constructor(config: SymbolConfig) {
		super();
		this.makeTexture(config.texture);
	}

	private makeTexture(textureName: string): void {
		(async () => {
			const texture = await Assets.load(textureName);
			this._texture = new Sprite(texture);
			this.addChild(this._texture);
		})();
	}
}
