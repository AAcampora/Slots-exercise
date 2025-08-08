import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import { GameReelTexture } from '../types/sprite-types';
import { ViewMetrics } from '../constants/ViewMetrics';
import { SymbolPool } from './SymbolPool';
import { ReelConstants } from '../constants/ReelConstants';
import { SpinButton } from '../components/SpinButton';

export class ReelGroup extends Container {
	private _reelFrame!: Sprite;
	private _reelMask: Graphics;
	private _symbolPool: SymbolPool;
	private _spinButton: SpinButton;

	private canSpin: boolean = true;

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

		this._spinButton = new SpinButton();
		this._spinButton.position.set(200, 250);
		await this._spinButton.init(this.startSpinning.bind(this));
		this.addChild(this._spinButton);
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
		this._symbolPool.spinCompleteSignal.addOnce(this.resetSpin, this);

		//handle slam stop
		if (!this.canSpin && !this._symbolPool.slamStopActive && this._symbolPool.canSlamStop) {
			this._symbolPool.slamStop();
			this._spinButton.fadeOut();
		} else if (this.canSpin) {
			this._symbolPool.startSpinning(Math.round(Math.random() * 100));
		}

		this.canSpin = false;
	}

	private resetSpin(): void {
		this.canSpin = true;
		this._spinButton.fadeIn();
	}
}
