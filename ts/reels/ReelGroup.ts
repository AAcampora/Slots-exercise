import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import { GameReelTexture } from '../types/sprite-types';
import { ViewMetrics } from '../constants/ViewMetrics';
import { SymbolPool } from './SymbolPool';
import { ReelConstants } from '../constants/ReelConstants';
import { SpinButton } from '../components/SpinButton';
import { BalanceDisplay } from '../components/BalanceDisplay';
import { WinDisplay } from '../components/WinDisplay';
import { Button } from '../components/Button.ts';

export class ReelGroup extends Container {
	private _reelFrame!: Sprite;
	private _reelMask: Graphics;
	private _symbolPool: SymbolPool;
	private _spinButton: SpinButton;
	private _balanceDisplay: BalanceDisplay;
	private _winDisplay: WinDisplay;
	private _addBalanceButton: Button;
	private _removeBalanceButton: Button;
	private _setToMinimumBalanceButton: Button;

	private _canSpin: boolean = true;

	private _balance: number = 1;

	public async init(): Promise<void> {
		await this.makeReelFrame();

		this._symbolPool = new SymbolPool();
		this.createMask();
		await this._symbolPool.init();
		await this._symbolPool.populateVisibleSymbols();
		this._symbolPool.position.y = -120;
		this._symbolPool.position.x = 5;
		this._symbolPool.setMask({ mask: this._reelMask });
		this.addChild(this._symbolPool);

		this.position.x = ViewMetrics.CANVAS_MIDDLE_WIDTH;
		this.position.y = ViewMetrics.CANVAS_MIDDLE_HEIGHT - this._reelFrame.height / 2;

		this._balanceDisplay = new BalanceDisplay();
		await this._balanceDisplay.init();
		this._balanceDisplay.position.set(-20, 400);
		this._balanceDisplay.setBalance(this._balance);
		this.addChild(this._balanceDisplay);

		this._spinButton = new SpinButton();
		this._spinButton.position.set(200, 250);
		await this._spinButton.init(this.startSpinning.bind(this));
		if (this._balance === 0) {
			this._spinButton.fadeOut();
		}
		this.addChild(this._spinButton);

		this._winDisplay = new WinDisplay();
		await this._winDisplay.init();
		this._winDisplay.position.set(70, 200);
		this.addChild(this._winDisplay);

		this._addBalanceButton = new Button();
		this._addBalanceButton.position.set(-400, 0);
		await this._addBalanceButton.init('max Balance', 200, 46, this.addBalance.bind(this));
		this.addChild(this._addBalanceButton);

		this._removeBalanceButton = new Button();
		this._removeBalanceButton.position.set(-400, 80);
		await this._removeBalanceButton.init('no Balance', 200, 46, this.removeBalance.bind(this));
		this.addChild(this._removeBalanceButton);

		this._removeBalanceButton = new Button();
		this._removeBalanceButton.position.set(-400, 160);
		await this._removeBalanceButton.init('set to minimum Balance', 350, 46, this.setToMinimumBalance.bind(this));
		this.addChild(this._removeBalanceButton);
	}

	private async makeReelFrame(): Promise<void> {
		const texture = await Assets.load(GameReelTexture.REEL);
		this._reelFrame = new Sprite(texture);
		this.addChild(this._reelFrame);
	}

	private createMask(): void {
		this._reelMask = new Graphics()
			.rect(5, 6, ReelConstants.SYMBOL_WIDTH, ReelConstants.SYMBOL_HEIGHT * 3)
			.fill('red');
		this.addChild(this._reelMask);
	}

	public startSpinning(): void {
		if (this._balance === 0) {
			this._spinButton.fadeOut();
		} else {
			this._symbolPool.spinCompleteSignal.addOnce(this.onSpinComplete, this);
			//handle slam stop
			if (!this._canSpin && !this._symbolPool.slamStopActive && this._symbolPool.canSlamStop) {
				this._symbolPool.slamStop();
			} else if (this._canSpin) {
				this._symbolPool.startSpinning(Math.round(Math.random() * 100));
				this._balance--;
				this._balanceDisplay.setBalance(this._balance);
			}

			this._canSpin = false;
		}
	}

	private onSpinComplete(): void {
		this._canSpin = true;
		const maxCount = Math.max(
			...this._symbolPool.win.map((v) => this._symbolPool.win.filter((x) => x === v).length)
		);
		this._balance = maxCount > 1 ? this._balance + maxCount : this._balance;
		this._balanceDisplay.setBalance(this._balance);
		if (maxCount > 1) {
			this._winDisplay.showWin(maxCount);
		}

		if (this._balance === 0) {
			this._spinButton.fadeOut();
		}
	}

	private addBalance(): void {
		this._balance = 100;
		this._balanceDisplay.setBalance(this._balance);
		this._spinButton.fadeIn();
	}

	private removeBalance(): void {
		this._balance = 0;
		this._balanceDisplay.setBalance(this._balance);
		this._spinButton.fadeOut();
	}

	private setToMinimumBalance(): void {
		this._balance = 1;
		this._balanceDisplay.setBalance(this._balance);
		this._spinButton.fadeIn();
	}
}
