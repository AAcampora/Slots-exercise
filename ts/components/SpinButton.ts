import { Assets, Container, Sprite } from 'pixi.js';
import { GameSpinButton } from '../types/sprite-types';

export class SpinButton extends Container {
	private _texture: Sprite;
	private _disabledTexture: Sprite;

	public async init(): Promise<void> {
		const texture = await Assets.load(GameSpinButton.PLAY);
		this._texture = new Sprite(texture);
		this.addChild(this._texture);

		const disabledTexture = await Assets.load(GameSpinButton.PLAY_DISABLED);
		this._disabledTexture = new Sprite(disabledTexture);
		this.addChild(this._disabledTexture);
	}
}
