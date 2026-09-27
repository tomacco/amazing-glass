import { Base } from './base';
export type MenuItem = {
    label: string;
    icon?: string;
    value?: string;
    destructive?: boolean;
} | {
    separator: true;
};
/**
 * <ag-menu icon="ellipsis" label="More" items='[{"label":"Copy","icon":"copy"},{"separator":true},{"label":"Delete","icon":"trash","destructive":true}]'></ag-menu>
 * The button becomes the menu: one glass surface grows out of the button's corner on a spring
 * and shrinks back into it. Opens toward the left and down by default; add `align="start"` to
 * grow to the right. Fires `select` with the item's value (or label) as `detail`.
 */
export declare class AgMenu extends Base {
    static observedAttributes: string[];
    private surface?;
    private trigger?;
    private listEl?;
    private glass?;
    private list;
    private isOpen;
    get items(): MenuItem[];
    set items(v: MenuItem[]);
    get open(): boolean;
    set open(v: boolean);
    attributeChangedCallback(name: string, _: string | null, next: string | null): void;
    connectedCallback(): void;
    private renderTrigger;
    private renderItems;
    private toggle;
}
