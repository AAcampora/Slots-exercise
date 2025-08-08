import { Assets, Container, Sprite } from 'pixi.js';

export interface SymbolConfig {
	texture: string;
	id: string;
}

export class GameSymbol extends Container {
	private _texture: Sprite;
	public id: string;

	constructor(config: SymbolConfig) {
		super();
		this.makeTexture(config.texture);
		this.id = config.id;
	}

	private makeTexture(textureName: string): void {
		(async () => {
			const texture = await Assets.load(textureName);
			this._texture = new Sprite(texture);
			this.addChild(this._texture);
		})();
	}
}
