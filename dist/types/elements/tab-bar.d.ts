import { Base } from './base';
export interface TabItem {
    label: string;
    icon?: string;
    value?: string;
}
/**
 * <ag-tab-bar items='[{"label":"Home","icon":"house"}, …]' value="0" search minimize-on-scroll="#feed"></ag-tab-bar>
 * Floats on regular glass. Dragging across the bar turns the selection into a lens that
 * follows your finger. With `minimize-on-scroll` (a CSS selector for the scroller) it shrinks
 * to the selected tab when content scrolls down and expands on the way back up.
 * Fires `change` (read `.value`) and `search` when the search button is pressed.
 */
export declare class AgTabBar extends Base {
    static observedAttributes: string[];
    private bar?;
    private pill?;
    private glass?;
    private lens?;
    private searchBtn?;
    private tabs;
    private list;
    private index;
    private dragged;
    private minimized;
    private unbindScroll?;
    get items(): TabItem[];
    set items(v: TabItem[]);
    get value(): string;
    set value(v: string);
    attributeChangedCallback(name: string, _: string | null, next: string | null): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private renderTabs;
    private renderSearch;
    private selectValue;
    private nearest;
    private place;
    private select;
    /** Shrink to the selected tab (true) or expand (false). */
    minimize(on: boolean): void;
    private bindScroll;
}
