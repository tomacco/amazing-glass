import { Base } from './base';
/**
 * <ag-segmented options="Day,Week,Month" value="Week"></ag-segmented>
 * Tap a segment to jump there with a small liquid stretch, or grab the selection and slide
 * it as a lens. `options` also accepts a JSON array; set the `options` property from JS.
 * Fires `change`; read `.value` or `.selectedIndex`.
 */
export declare class AgSegmented extends Base {
    static observedAttributes: string[];
    private pill?;
    private lens?;
    private items;
    private opts;
    private index;
    private dragged;
    get options(): string[];
    set options(v: string[]);
    get value(): string;
    set value(v: string);
    get selectedIndex(): number;
    set selectedIndex(i: number);
    attributeChangedCallback(name: string, _: string | null, next: string | null): void;
    connectedCallback(): void;
    private renderItems;
    private place;
    private select;
}
