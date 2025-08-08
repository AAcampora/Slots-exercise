import { Assets, Container, Sprite } from 'pixi.js';
import { GameSpinButton } from '../types/sprite-types';
import gsap from 'gsap';

export class SpinButton extends Container {
	private _texture: Sprite;
	private _disabledTexture: Sprite;

	public async init(onClick: () => void): Promise<void> {
		const texture = await Assets.load(GameSpinButton.PLAY);
		this._texture = new Sprite(texture);
		this.addChild(this._texture);

		this._texture.interactive = true;

		const disabledTexture = await Assets.load(GameSpinButton.PLAY_DISABLED);
		this._disabledTexture = new Sprite(disabledTexture);
		this.addChild(this._disabledTexture);
		this._disabledTexture.alpha = 0;

		this._texture.on('pointerup', () => {
			gsap.to(this._texture.scale, {
				x: 0.9,
				y: 0.9,
				duration: 0.1,
				onComplete: () => {
					this.resetButtonSize();
				},
			});

			onClick();
		});
	}

	private resetButtonSize(): void {
		gsap.to(this._texture.scale, {
			x: 1,
			y: 1,
			duration: 0.2,
		});
	}

	public fadeOut(): void {
		this._texture.visible = false;
		gsap.to(this._disabledTexture, {
			duration: 0.2,
			alpha: 1,
		});
	}

	public fadeIn(): void {
		this._texture.visible = true;
		gsap.to(this._disabledTexture, {
			duration: 0.2,
			alpha: 0,
		});
	}
}
