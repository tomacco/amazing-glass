import { Base } from './base';
/**
 * <ag-slider value="40" min="0" max="100" step="1" min-icon="sunSmall" max-icon="sun"></ag-slider>
 * The thumb swells into a lens while dragged, so the fill stays visible through it.
 * Fires `input` while moving and `change` on release.
 */
export declare class AgSlider extends Base {
    static observedAttributes: string[];
    private rail?;
    private thumb?;
    private lens?;
    get min(): number;
    get max(): number;
    get step(): number;
    get value(): number;
    set value(v: number);
    attributeChangedCallback(name: string): void;
    private renderIcons;
    connectedCallback(): void;
}
