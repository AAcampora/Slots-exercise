import { Assets, Container, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import { GameWinBackground } from '../types/sprite-types';

export class WinDisplay extends Container {
	private _bg: Sprite;
	private _text: Text;

	public async init(): Promise<void> {
		const bg = await Assets.load(GameWinBackground.WIN_BG);
		this._bg = new Sprite(bg);
		this._bg.anchor.set(0.5);
		this.addChild(this._bg);
		this._text = new Text({
			text: '0',
			style: {
				fontFamily: 'Arial',
				fontSize: 45,
				fill: '#ffffff',
				stroke: { color: '#000000', width: 4 },
			},
		});
		this._text.alpha = 0;
		this._bg.alpha = 0;
		this.addChild(this._text);
		this._text.anchor.set(0.5);
	}

	public showWin(cash: number): void {
		gsap.killTweensOf([this._text, this._bg]);
		this._text.text = '1% $'.replace('1%', cash.toString());
		this._text.position.y = 0;
		this._bg.position.y = 0;
		this._text.alpha = 0;
		this._bg.alpha = 0;
		gsap.to([this._text, this._bg], {
			duration: 0.5,
			alpha: 1,
			onComplete: () => {
				this.fadeoutWin();
			},
		});
	}

	private fadeoutWin(): void {
		gsap.to([this._text, this._bg], {
			y: -200,
			duration: 1,
			alpha: 0,
		});
	}
}
