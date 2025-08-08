import { Container, Ticker } from 'pixi.js';
import { ReelMatrix } from '../constants/ReelMatrix';
import { GameSymbol } from '../gameSymbols/GameSymbol';
import { ReelConstants } from '../constants/ReelConstants';
import gsap, { Power1 } from 'gsap';
import { Signal } from 'signals';

export class SymbolPool extends Container {
	private _gameSymbolPool: GameSymbol[] = [];
	private _visibleSymbolPool: GameSymbol[] = [];
	public spinCompleteSignal: Signal = new Signal();

	private _reelStop: number = 0;
	private _reelIndex: number = 0;

	private _currentSpeed = { value: 60 };

	private _needsToStop: boolean = false;
	public slamStopActive: boolean;
	public canSlamStop: boolean;

	private _speedTimeline: GSAPTimeline;

	public async init(): Promise<void> {
		ReelMatrix.forEach((symbol, i) => {
			const gameSymbol = new GameSymbol({ texture: symbol });
			this._gameSymbolPool.push(gameSymbol);
		});
	}

	public populateVisibleSymbols(): void {
		for (let i = 0; i < ReelConstants.NUM_ROWS; i++) {
			let gameSymbol = this._gameSymbolPool[i];
			gameSymbol.position.y = ReelConstants.SYMBOL_HEIGHT * i;
			this._visibleSymbolPool.push(gameSymbol);
			this.addChild(gameSymbol);
			this._reelIndex++;
		}
	}

	public startSpinning(reelStop: number): void {
		this.reset();
		this._reelStop = reelStop;
		this._visibleSymbolPool.forEach((symbol) => {
			gsap.to([symbol], {
				duration: 0.2,
				y: symbol.y - ReelConstants.SYMBOL_HEIGHT / 2,
				ease: 'linear',
			});
		});
		gsap.delayedCall(0.3, () => {
			this.spinReel();
			this.canSlamStop = true;
		});
	}

	private spinReel(): void {
		this._currentSpeed.value = 60;
		Ticker.shared.add(this.spinUpdate, this);
		//after 2 seconds, we prepare the reel so it stops in the correct spot
		this._speedTimeline.to(this._currentSpeed, {
			value: 10,
			duration: 1.3,
			ease: Power1.easeInOut,
			onComplete: () => {
				this.prepareReelStop();
			},
		});
	}

	private prepareReelStop(): void {
		//prepare the next 5 symbols to be the correct ones on the reel stop
		this._reelIndex =
			this._reelStop < ReelConstants.NUM_ROWS ? this._gameSymbolPool.length - 5 : this._reelStop - 5;
		this._needsToStop = true;
	}

	public slamStop(): void {
		this._speedTimeline.kill();
		this.slamStopActive = true;
		this.canSlamStop = false;
		this._currentSpeed.value = 80;
		this.prepareReelStop();
	}

	private slowDownAndStop(): void {
		Ticker.shared.remove(this.spinUpdate, this);
		this._visibleSymbolPool.forEach((symbol) => {
			gsap.to([symbol], {
				duration: 0.3,
				y: symbol.y + ReelConstants.SYMBOL_HEIGHT / 2,
				onComplete: () => {
					this.SnapBackReel();
				},
			});
		});
	}

	private SnapBackReel(): void {
		this._visibleSymbolPool.forEach((symbol, i) => {
			gsap.to([symbol], {
				duration: 0.2,
				y: ReelConstants.SYMBOL_HEIGHT * i,
				onComplete: () => {
					this.spinCompleteSignal.dispatch();
				},
			});
		});
	}

	public spinUpdate(): void {
		this._visibleSymbolPool.forEach((symbol) => {
			symbol.y += this._currentSpeed.value; // move down

			// When symbol leaves bottom
			if (symbol.y >= ReelConstants.NUM_ROWS * ReelConstants.SYMBOL_HEIGHT) {
				this.recycleSymbol(symbol);
			}
		});
	}

	private recycleSymbol(symbol: GameSymbol): void {
		// Remove the symbol from visible pool (filter out the one to recycle)
		this._visibleSymbolPool.pop();
		this.removeChild(symbol);

		//increment reel index
		this._reelIndex++;
		if (this._reelIndex > this._gameSymbolPool.length - 1) {
			this._reelIndex = 0;
		}

		// Grab next symbol from top of gameSymbolPool
		const nextSymbol = this._gameSymbolPool[this._reelIndex];
		this.addChild(nextSymbol);
		const topSymbol = this._visibleSymbolPool[0];

		// Position it just above current top
		nextSymbol.y = topSymbol.y - ReelConstants.SYMBOL_HEIGHT;

		// Add to start of visible pool
		this._visibleSymbolPool.unshift(nextSymbol);

		if (this._reelIndex === this._reelStop && this._needsToStop) {
			this.slowDownAndStop();
		}
	}

	private reset(): void {
		this._speedTimeline = gsap.timeline();
		this.slamStopActive = false;
		this.canSlamStop = false;
		this._needsToStop = false;
	}
}
