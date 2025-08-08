import { Container, Ticker } from 'pixi.js';
import { ReelMatrix } from '../constants/ReelMatrix';
import { GameSymbol } from '../gameSymbols/GameSymbol';
import { ReelConstants } from '../constants/ReelConstants';
import gsap, { Power1 } from 'gsap';
import { Signal } from 'signals';
import { GameSymbolsTexture } from '../types/sprite-types';

export class SymbolPool extends Container {
	/**
	 * for this symbol pool I opted to have a _gameSymbolPool and a _visible symbol pool.
	 * My reasoning is because we do not want to load all the symbols on the canvas, as that would be waste of resource
	 * instead, as we spin down, we pop the last symbol of _visibleSymbolPool and then add a new one using _gameSymbolPool as reference
	 */
	private _gameSymbolPool: GameSymbol[] = [];
	private _visibleSymbolPool: GameSymbol[] = [];

	// used to store the possible win line that we might have. Usually this would be done by the server but in this project we do not have one
	public win: string[] = [];

	/**
	 * I have chosen to use an index for iterating trough _gameSymbolPool because I wanted to maintain the array immutable, and only
	 * access the symbol I need to copy inside _visibleSymbolPool
	 * also it makes the calculations for where the reel needs to stop the much easier as now we only need to compare it with the reelStop
	 */
	private _reelStop: number = 0;
	private _reelIndex: number = 0;

	// speed variables
	private _currentSpeed = { value: 60 };
	private _speedTimeline: GSAPTimeline;

	private _needsToStop: boolean = false;

	// slam stop variables
	public slamStopActive: boolean;
	public canSlamStop: boolean;

	// signals
	public spinCompleteSignal: Signal = new Signal();

	/**
	 * fill our gameSymbolPool with the symbols that we have in the ReelMatrix.
	 * we do this because we want to maintain the order of the reel symbols as they come in
	 */
	public async init(): Promise<void> {
		ReelMatrix.forEach((symbol, i) => {
			const id = Object.keys(GameSymbolsTexture).find(
				(key) => GameSymbolsTexture[key as keyof typeof GameSymbolsTexture] === symbol
			);
			const gameSymbol = new GameSymbol({ texture: symbol, id: id! });
			this._gameSymbolPool.push(gameSymbol);
		});
	}
	/**
	 * initialize the reel with some symbols
	 */
	public populateVisibleSymbols(): void {
		for (let i = 0; i < ReelConstants.NUM_ROWS; i++) {
			let gameSymbol = this._gameSymbolPool[i];
			gameSymbol.position.y = ReelConstants.SYMBOL_HEIGHT * i;
			this._visibleSymbolPool.push(gameSymbol);
			this.addChild(gameSymbol);
			this._reelIndex++;
		}
	}
	/**
	 * Because we only want to spin the reel for 3 seconds every spin, regardless of the position, we fake the initial seconds
	 * of spin, then when we are close to finish the spin, we move our reelIndex 5 symbols before the ones we need to land on
	 * creating the illusion that the reel spun properly to the correct position
	 */
	public startSpinning(reelStop: number): void {
		this.reset();
		this._reelStop = reelStop;
		// wind back the reels a lil so it looks cool
		this._visibleSymbolPool.forEach((symbol) => {
			gsap.to([symbol], {
				duration: 0.2,
				y: symbol.y - ReelConstants.SYMBOL_HEIGHT / 2,
				ease: 'linear',
			});
		});
		gsap.delayedCall(0.3, () => {
			this.spinReel();
			//we only want to allow to skip the spin after the winding them back. Earlier causes some visual issues.
			this.canSlamStop = true;
		});
	}

	/**
	 * fake spin the reels for a couple of seconds
	 */
	private spinReel(): void {
		this._currentSpeed.value = 60;
		Ticker.shared.add(this.spinUpdate, this);
		//Here we slow down the reels as they travel, so that it builds anticipation for the player as the reels are about to land.
		this._speedTimeline.to(this._currentSpeed, {
			value: 10,
			duration: 1.3,
			ease: Power1.easeInOut,
			onComplete: () => {
				this.prepareReelStop();
			},
		});
	}

	/**
	 * prepare the reels by moving the reelIndex a couple of symbols before the ones we are going to land on, and
	 * then signal that we need to stop the reels
	 */
	private prepareReelStop(): void {
		//prepare the next 5 symbols to be the correct ones on the reel stop
		this._reelIndex =
			this._reelStop < ReelConstants.NUM_ROWS ? this._gameSymbolPool.length - 5 : this._reelStop - 5;
		this._needsToStop = true;
	}
	/**
	 * HANDLE slam stop or reel skip.
	 * We kill any GSAPs and speed up the reels to sell the illusion that you accelerated the game, and
	 * set the reelIndex immediacy in the correct position
	 */
	public slamStop(): void {
		this._speedTimeline.kill();
		this.slamStopActive = true;
		this.canSlamStop = false;
		this._currentSpeed.value = 80;
		this.prepareReelStop();
	}

	/**
	 * update the symbol position on the reel, and whenever a symbol reaches the bottom, we recycle them
	 */
	public spinUpdate(): void {
		this._visibleSymbolPool.forEach((symbol) => {
			symbol.y += this._currentSpeed.value; // move down

			// When symbol leaves bottom
			if (symbol.y >= ReelConstants.NUM_ROWS * ReelConstants.SYMBOL_HEIGHT) {
				this.recycleSymbol(symbol);
			}
		});
	}

	/**
	 * When the symbol reaches the very bottom of the reel, we remove it, then we increment the reelIndex, and use that
	 * to copy the correct symbol from _gameSymbolPool to position at the top of the reel
	 * Also, if we reach our reelStop, stop the reels!
	 */
	private recycleSymbol(symbol: GameSymbol): void {
		// Remove the symbol from visible pool
		this._visibleSymbolPool.pop();
		this.removeChild(symbol);

		//increment reel index
		this._reelIndex++;
		//check if we went past the last reel, if we do, we go back at the start
		if (this._reelIndex > this._gameSymbolPool.length - 1) {
			this._reelIndex = 0;
		}

		// Grab next symbol from top of gameSymbolPool
		const nextSymbol = this._gameSymbolPool[this._reelIndex];
		this.addChild(nextSymbol);

		// Position it just above current top
		const topSymbol = this._visibleSymbolPool[0];
		nextSymbol.y = topSymbol.y - ReelConstants.SYMBOL_HEIGHT;

		// Add to start of visible pool
		this._visibleSymbolPool.unshift(nextSymbol);

		// if we are going to hit our reel stop, begin to stop the spin
		if (this._reelIndex === this._reelStop && this._needsToStop) {
			this.slowDownAndStop();
		}
	}

	/**
	 * To sell the effect that the reels just stopped, we make them move past their target, and then bounce them back
	 * in position, giving a satisfying bouncing effect to the landing, which from my experience is proffered by players
	 */
	private slowDownAndStop(): void {
		Ticker.shared.remove(this.spinUpdate, this);
		this._visibleSymbolPool.forEach((symbol, i) => {
			/**
			 * as the reels are stopping, its the perfect moment to get our possible win line
			 * we do not push the top and bottom symbols as those are hidden under the mask and do not count.
			 */
			if (i !== 0 && i !== this._visibleSymbolPool.length - 1) {
				this.win.push(symbol.id);
			}
			gsap.to([symbol], {
				duration: 0.3,
				y: symbol.y + ReelConstants.SYMBOL_HEIGHT / 2,
				onComplete: () => {
					this.SnapBackReel();
				},
			});
		});
	}

	/**
	 * Bring the reels back to their target position
	 */
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

	/**
	 * reset for next spin
	 */
	private reset(): void {
		this._speedTimeline = gsap.timeline();
		this.win = [];
		this.slamStopActive = false;
		this.canSlamStop = false;
		this._needsToStop = false;
	}
}
