import { Container } from 'pixi.js';
import { ReelGroup } from './reels/ReelGroup';
import { TestButtonContainer } from './utils/TestButtonContainer';
import { BalanceDisplay } from './components/BalanceDisplay';
import { SpinButton } from './components/SpinButton';
import { WinDisplay } from './components/WinDisplay';
import { ViewMetrics } from './constants/ViewMetrics';

export class Game extends Container {
	private _reelGroup: ReelGroup;
	private _testButtonContainer: TestButtonContainer;
	private _spinButton: SpinButton;
	private _balanceDisplay: BalanceDisplay;
	private _winDisplay: WinDisplay;

	private _balance: number;

	private _canSpin: boolean = true;

	public async init(): Promise<void> {
		this._balance = 100;

		this._reelGroup = new ReelGroup();
		await this._reelGroup.init();
		this.addChild(this._reelGroup);

		this._testButtonContainer = new TestButtonContainer();
		this._testButtonContainer.position.set(900, 350);
		await this.makeTestButtons();
		this.addChild(this._testButtonContainer);

		this._balanceDisplay = new BalanceDisplay();
		await this._balanceDisplay.init();
		this._balanceDisplay.position.set(ViewMetrics.CANVAS_MIDDLE_WIDTH, 755);
		this._balanceDisplay.setBalance(this._balance);
		this.addChild(this._balanceDisplay);

		this._spinButton = new SpinButton();
		this._spinButton.position.set(1200, 620);
		await this._spinButton.init(this.startSpinning.bind(this));
		if (this._balance === 0) {
			this._spinButton.fadeOut();
		}
		this.addChild(this._spinButton);

		this._winDisplay = new WinDisplay();
		await this._winDisplay.init();
		this._winDisplay.position.set(1030, ViewMetrics.CANVAS_MIDDLE_HEIGHT);
		this.addChild(this._winDisplay);
	}

	public startSpinning(): void {
		if (this._balance === 0) {
			this._spinButton.fadeOut();
		} else {
			this._reelGroup.symbolPool.spinCompleteSignal.addOnce(this.onSpinComplete, this);
			//handle slam stop
			if (
				!this._canSpin &&
				!this._reelGroup.symbolPool.slamStopActive &&
				this._reelGroup.symbolPool.canSlamStop
			) {
				this._reelGroup.symbolPool.slamStop();
			} else if (this._canSpin) {
				this._reelGroup.symbolPool.startSpinning(Math.round(Math.random() * 100));
				this._balance--;
				this._balanceDisplay.setBalance(this._balance);
			}

			this._canSpin = false;
		}
	}

	private onSpinComplete(): void {
		this._canSpin = true;
		const maxCount = Math.max(
			...this._reelGroup.symbolPool.win.map((v) => this._reelGroup.symbolPool.win.filter((x) => x === v).length)
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
	private makeTestButtons(): void {
		const test = this._testButtonContainer;
		test.init();
		test.addBalanceSignal.add(this.addBalance, this);
		test.removeBalanceSignal.add(this.removeBalance, this);
		test.setToMinimumBalanceSignal.add(this.setToMinimumBalance, this);
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
