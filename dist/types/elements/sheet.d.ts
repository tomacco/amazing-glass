import { Base } from './base';
export type Detent = 'closed' | 'medium' | 'large';
/**
 * <ag-sheet detent="medium">…your content…</ag-sheet>
 * A bottom sheet on regular glass, positioned inside its nearest positioned ancestor.
 * Medium floats inset from the edges so content peeks around it; large goes flush and more
 * opaque to hold focus. Drag or tap the grabber to change detent. Fires `detentchange`.
 * Children stay where you put them; the element only adds the grabber.
 */
export declare class AgSheet extends Base {
    static observedAttributes: string[];
    private grabber?;
    private glass?;
    private settle;
    get detent(): Detent;
    set detent(d: Detent);
    attributeChangedCallback(): void;
    connectedCallback(): void;
    private change;
}
