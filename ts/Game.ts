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
	private _bet: number;

	private _canSpin: boolean = true;

	public async init(): Promise<void> {
		this._balance = 100;
		this._bet = 1;

		//Build and position our persistent components
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
	/**
	 * because I do not have a server, we fake the reelstop by using a random number whenever we spin
	 */
	public startSpinning(): void {
		// we do not do anything if the player is broke.
		if (this._balance === 0) {
			this._spinButton.fadeOut();
		} else {
			// we listen for spin complete so we can handle the sequence after the reels have stopped.
			this._reelGroup.symbolPool.spinCompleteSignal.addOnce(this.onSpinComplete, this);

			// here we listen for whenever the player skips the spin
			if (
				!this._canSpin &&
				!this._reelGroup.symbolPool.slamStopActive &&
				this._reelGroup.symbolPool.canSlamStop
			) {
				this._reelGroup.symbolPool.slamStop();
			} else if (this._canSpin) {
				this._reelGroup.symbolPool.startSpinning(Math.round(Math.random() * 100));
				this._balance -= this._bet;
				this._balanceDisplay.setBalance(this._balance);
			}

			this._canSpin = false;
		}
	}
	/**
	 * usually we would have a server that would give us the win array to celebrate, however in this game,
	 * we need to calculate it ourselves.
	 */
	private onSpinComplete(): void {
		this._canSpin = true;
		// count how many of the same symbols are in the same array and return the one that has the most.
		const maxCount = Math.max(
			...this._reelGroup.symbolPool.win.map((v) => this._reelGroup.symbolPool.win.filter((x) => x === v).length)
		);
		//if we won more than one symbol, award the player the points. 2 symbols = double the bet, 3 symbols = triple the bet
		this._balance = maxCount > 1 ? this._balance + maxCount * this._bet : this._balance;
		this._balanceDisplay.setBalance(this._balance);
		if (maxCount > 1) {
			this._winDisplay.showWin(maxCount);
		}

		// If we are unlucky enough to go broke, we disable the spins
		if (this._balance === 0) {
			this._spinButton.fadeOut();
		}
	}

	/**
	 * I made some useful test buttons to test some cases around the balance of the game, as we have some requirements for whenever we
	 * ran out of money or in the event that we refill our balance.
	 */
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
