import { Glass } from '../core';
import { Base } from './base';
/**
 * <ag-glass variant="clear" tint="#34c759" tone="auto" params='{"blur":6}'>…</ag-glass>
 * A plain glass surface. Children are yours; the element only adds its refraction layer.
 */
export declare class AgGlass extends Base {
    static observedAttributes: string[];
    glass?: Glass;
    connectedCallback(): void;
    attributeChangedCallback(): void;
    disconnectedCallback(): void;
}
/**
 * <ag-button variant="glass|prominent|clear|plain" icon="plus" tint="#ff383c" size="small|large">Label</ag-button>
 * `prominent` is stained glass in the accent colour (or `tint`). `plain` has no glass of its own,
 * for use inside a toolbar group.
 */
export declare class AgButton extends Base {
    static observedAttributes: string[];
    glass?: Glass;
    private iconEl?;
    connectedCallback(): void;
    attributeChangedCallback(): void;
    private sync;
    disconnectedCallback(): void;
}
