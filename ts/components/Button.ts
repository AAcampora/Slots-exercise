import { Assets, Container, Graphics, Point, Sprite, Text } from 'pixi.js';
import { GameWinBackground } from '../types/sprite-types';
import gsap from 'gsap';

export class Button extends Container {
	private _texture: Graphics;
	private _text: Text;

	public async init(name: string, sizeX: number, sizeY: number, onClick: () => void): Promise<void> {
		this._texture = new Graphics().rect(-5, 0, sizeX, sizeY).fill('white');
		this.addChild(this._texture);

		this._texture.interactive = true;

		this._texture.on('pointerup', () => {
			gsap.to(this.scale, {
				x: 0.9,
				y: 0.9,
				duration: 0.1,
				onComplete: () => {
					this.resetButtonSize();
				},
			});

			onClick();
		});

		this._text = new Text({
			text: name,
			style: {
				fontFamily: 'Arial',
				fontSize: 32,
				fill: '#ffffff',
				stroke: { color: '#000000', width: 4 },
			},
		});
		this.addChild(this._text);
	}

	private resetButtonSize(): void {
		gsap.to(this.scale, {
			x: 1,
			y: 1,
			duration: 0.2,
		});
	}
}
