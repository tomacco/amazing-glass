import { Base } from './base';
/**
 * <ag-switch checked></ag-switch>
 * The knob is solid at rest and lifts off the track as a clear glass lens while touched,
 * the way iOS 26 switches do. Tap to toggle or drag the knob. Fires `change`.
 */
export declare class AgSwitch extends Base {
    static observedAttributes: string[];
    private knob?;
    private lens?;
    get checked(): boolean;
    set checked(v: boolean);
    get disabled(): boolean;
    set disabled(v: boolean);
    attributeChangedCallback(): void;
    connectedCallback(): void;
    private set;
}
