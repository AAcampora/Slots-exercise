import { Container, Text } from 'pixi.js';

export class BalanceDisplay extends Container {
	private _text: Text;

	public async init(): Promise<void> {
		this._text = new Text({
			text: 'Balance:',
			style: {
				fontFamily: 'Arial',
				fontSize: 32,
				fill: '#ffffff',
				stroke: { color: '#000000', width: 4 },
			},
		});
		this.addChild(this._text);
	}

	public setBalance(cash: number): void {
		this._text.text = 'Balance: 1% $'.replace('1%', cash.toString());
	}
}
