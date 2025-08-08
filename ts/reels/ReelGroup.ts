import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import { GameReelTexture } from '../types/sprite-types';
import { ViewMetrics } from '../constants/ViewMetrics';
import { SymbolPool } from './SymbolPool';
import { ReelConstants } from '../constants/ReelConstants';

export class ReelGroup extends Container {
	private _reelFrame!: Sprite;
	private _reelMask: Graphics;
	public symbolPool: SymbolPool;

	public async init(): Promise<void> {
		await this.makeReelFrame();

		this.symbolPool = new SymbolPool();
		this.createMask();
		await this.symbolPool.init();
		await this.symbolPool.populateVisibleSymbols();
		this.symbolPool.position.y = -120;
		this.symbolPool.position.x = 5;
		this.symbolPool.setMask({ mask: this._reelMask });
		this.addChild(this.symbolPool);

		this.position.x = ViewMetrics.CANVAS_MIDDLE_WIDTH;
		this.position.y = ViewMetrics.CANVAS_MIDDLE_HEIGHT - this._reelFrame.height / 2;
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
}
