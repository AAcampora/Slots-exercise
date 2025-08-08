import { Container } from 'pixi.js';
import { Button } from '../components/Button';
import { ReelGroup } from '../reels/ReelGroup';
import { Signal } from 'signals';

export class TestButtonContainer extends Container {
	private _addBalanceButton: Button;
	private _removeBalanceButton: Button;
	private _setToMinimumBalanceButton: Button;

	public addBalanceSignal: Signal = new Signal();
	public removeBalanceSignal: Signal = new Signal();
	public setToMinimumBalanceSignal: Signal = new Signal();

	public async init(): Promise<void> {
		this._addBalanceButton = new Button();
		this._addBalanceButton.position.set(-400, 0);
		await this._addBalanceButton.init('max Balance', 200, 46, this.addBalance.bind(this));
		this.addChild(this._addBalanceButton);

		this._removeBalanceButton = new Button();
		this._removeBalanceButton.position.set(-400, 80);
		await this._removeBalanceButton.init('no Balance', 200, 46, this.removeBalance.bind(this));
		this.addChild(this._removeBalanceButton);

		this._setToMinimumBalanceButton = new Button();
		this._setToMinimumBalanceButton.position.set(-400, 160);
		await this._setToMinimumBalanceButton.init(
			'set to minimum Balance',
			350,
			46,
			this.setToMinimumBalance.bind(this)
		);
		this.addChild(this._setToMinimumBalanceButton);
	}

	private addBalance(): void {
		this.addBalanceSignal.dispatch();
	}

	private removeBalance(): void {
		this.removeBalanceSignal.dispatch();
	}

	private setToMinimumBalance(): void {
		this.setToMinimumBalanceSignal.dispatch();
	}
}
