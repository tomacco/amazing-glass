import type { RawOffsets } from './maps';
export declare class CpuRefraction {
    private host;
    private out?;
    private memo;
    constructor(host: HTMLElement);
    render(raw: RawOffsets, w: number, h: number, dispersion: number, mask?: string): void;
    destroy(): void;
}
