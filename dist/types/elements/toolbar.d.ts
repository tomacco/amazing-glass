import { Glass } from '../core';
import { Base } from './base';
import './surface';
/**
 * <ag-toolbar>
 *   <ag-toolbar-group><ag-button variant="plain" icon="chevronLeft" aria-label="Back"></ag-button></ag-toolbar-group>
 *   <ag-toolbar-group><ag-button variant="plain" icon="share" aria-label="Share"></ag-button>…</ag-toolbar-group>
 * </ag-toolbar>
 * HIG: actions that affect the same thing share one glass background; groups float apart.
 * Keep icons and text apart within a group, and label every icon.
 */
export declare class AgToolbar extends Base {
    connectedCallback(): void;
}
export declare class AgToolbarGroup extends Base {
    static observedAttributes: string[];
    glass?: Glass;
    connectedCallback(): void;
    attributeChangedCallback(): void;
}
