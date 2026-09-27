import { Base } from './base';
/**
 * <ag-search placeholder="Search" value=""></ag-search>
 * Capsule on regular glass with a dictation symbol trailing. The inner input's `input` and
 * `change` events bubble; read `.value` from the element.
 */
export declare class AgSearch extends Base {
    static observedAttributes: string[];
    private input?;
    private glass?;
    get value(): string;
    set value(v: string);
    attributeChangedCallback(name: string, _: string | null, next: string | null): void;
    connectedCallback(): void;
    focus(options?: FocusOptions): void;
}
