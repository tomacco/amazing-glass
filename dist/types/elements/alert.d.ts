import { Base } from './base';
import './surface';
export interface AlertAction {
    label: string;
    role?: 'default' | 'cancel' | 'destructive';
    value?: string;
}
/**
 * <ag-alert heading="Delete 3 photos?" message="…" actions='[{"label":"Cancel","role":"cancel"},{"label":"Delete","role":"destructive"}]'></ag-alert>
 * Leading-aligned text and capsule buttons side by side. The default action is stained in the
 * accent colour, a destructive one in red. Fires `action` with the value (or label) as `detail`.
 */
export declare class AgAlert extends Base {
    static observedAttributes: string[];
    private list;
    private glass?;
    private built;
    get actions(): AlertAction[];
    set actions(v: AlertAction[]);
    attributeChangedCallback(name: string, _: string | null, next: string | null): void;
    connectedCallback(): void;
    private render;
}
