import { Container, Ticker } from 'pixi.js';
import { ReelMatrix } from '../constants/ReelMatrix';
import { GameSymbol } from '../gameSymbols/GameSymbol';
import { ReelConstants } from '../constants/ReelConstants';
import gsap from 'gsap';

export class SymbolPool extends Container {
	private _gameSymbolPool: GameSymbol[] = [];
	private _visibleSymbolPool: GameSymbol[] = [];

	private _reelStop: number = 0;
	private _reelIndex: number = 0;

	private _needsToStop: boolean;

	public isSpinning: boolean;

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
		this._reelStop = reelStop;
		Ticker.shared.add(this.spinUpdate, this);
		this.isSpinning = true;
		//after 2 seconds, we prepare the reel so it stops in the correct spot
		gsap.delayedCall(2.5, () => {
			//prepare the next 5 symbols to be the correct ones on the reel stop
			this._reelIndex = this._reelStop - ReelConstants.NUM_ROWS;
			this._needsToStop = true;
		});
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
		this._visibleSymbolPool.forEach((symbol) => {
			gsap.to([symbol], {
				duration: 0.2,
				y: symbol.y - ReelConstants.SYMBOL_HEIGHT / 2,
				onComplete: () => {
					this.isSpinning = false;
				},
			});
		});
	}

	public spinUpdate(): void {
		this._visibleSymbolPool.forEach((symbol) => {
			symbol.y += 10; // move down

			// When symbol leaves bottom
			if (symbol.y >= ReelConstants.NUM_ROWS * ReelConstants.SYMBOL_HEIGHT) {
				this.recycleSymbol(symbol);
			}
		});
	}

	private recycleSymbol(symbol: GameSymbol): void {
		// Remove the symbol from visible pool (filter out the one to recycle)
		this._visibleSymbolPool = this._visibleSymbolPool.filter((s) => s !== symbol);
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
			this._needsToStop = false;
		}
	}
}
