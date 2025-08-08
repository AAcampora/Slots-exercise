import { Container, Text } from 'pixi.js';
import gsap from 'gsap';

export class WinDisplay extends Container {
	private _text: Text;

	public async init(): Promise<void> {
		this._text = new Text({
			text: '0',
			style: {
				fontFamily: 'Arial',
				fontSize: 32,
				fill: '#ffffff',
				stroke: { color: '#000000', width: 4 },
			},
		});
		this._text.alpha = 0;
		this.addChild(this._text);
		this._text.anchor.set(0.5);
	}

	public showWin(cash: number): void {
		this._text.text = '1% $'.replace('1%', cash.toString());
		this._text.position.y = 0;
		gsap.to(this._text, {
			duration: 0.2,
			alpha: 1,
		});
		gsap.to(this._text, {
			duration: 0.5,
			scale: 2,
			onComplete: () => {
				this.fadeoutWin();
			},
		});
	}

	private fadeoutWin(): void {
		gsap.to(this._text, {
			y: -200,
			duration: 1,
			alpha: 0,
		});
	}
}
