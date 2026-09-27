// A small symbol set drawn for this library. SF Symbols are licensed for Apple platforms only,
// so none are used here. 24 x 24 grid, filled shapes. Add your own with registerIcon().
const P: Record<string, string> = {
  house: '<path d="M12 3.2 2.8 11a1 1 0 0 0 1.3 1.5l.9-.8V19a2 2 0 0 0 2 2h3.2v-5.2a1.8 1.8 0 0 1 3.6 0V21H17a2 2 0 0 0 2-2v-7.3l.9.8a1 1 0 0 0 1.3-1.5Z"/>',
  search: '<path d="M10.5 3a7.5 7.5 0 0 1 6 12l4.3 4.3a1.2 1.2 0 0 1-1.7 1.7L14.8 16.7A7.5 7.5 0 1 1 10.5 3Zm0 2.3a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Z"/>',
  note: '<path d="M19 3.3v11.9a3.3 3.3 0 1 1-2.2-3.1V7.6l-7.6 1.8v7.8A3.3 3.3 0 1 1 7 14.1V6.8c0-.6.4-1 .9-1.2l9.8-2.3a1 1 0 0 1 1.3 1Z"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="2.2"/><rect x="13" y="3" width="8" height="8" rx="2.2"/><rect x="3" y="13" width="8" height="8" rx="2.2"/><rect x="13" y="13" width="8" height="8" rx="2.2"/>',
  person: '<circle cx="12" cy="7.5" r="4.2"/><path d="M3.8 20c.6-4.2 4-6.6 8.2-6.6s7.6 2.4 8.2 6.6c.1.6-.4 1-1 1H4.8c-.6 0-1.1-.4-1-1Z"/>',
  heart: '<path d="M12 20.6c-.3 0-.6-.1-.8-.3C6.3 16.4 2.8 13.3 2.8 9.1 2.8 6.2 5 4 7.8 4c1.7 0 3.2.8 4.2 2.2C13 4.8 14.5 4 16.2 4c2.8 0 5 2.2 5 5.1 0 4.2-3.5 7.3-8.4 11.2-.2.2-.5.3-.8.3Z"/>',
  plus: '<path d="M12 4.5c.7 0 1.2.5 1.2 1.2v5.1h5.1a1.2 1.2 0 0 1 0 2.4h-5.1v5.1a1.2 1.2 0 0 1-2.4 0v-5.1H5.7a1.2 1.2 0 0 1 0-2.4h5.1V5.7c0-.7.5-1.2 1.2-1.2Z"/>',
  ellipsis: '<circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/>',
  share: '<path d="M12 2.8c.3 0 .6.1.8.3l3.4 3.4a1.1 1.1 0 0 1-1.6 1.6l-1.5-1.5v8.1a1.1 1.1 0 0 1-2.2 0V6.6L9.4 8.1a1.1 1.1 0 0 1-1.6-1.6l3.4-3.4c.2-.2.5-.3.8-.3ZM6.8 10.2h1.1a1.1 1.1 0 0 1 0 2.2h-1v7.1h10.2v-7.1h-1a1.1 1.1 0 0 1 0-2.2h1.1c1.2 0 2.1.9 2.1 2.1v7.3c0 1.2-.9 2.1-2.1 2.1H6.8c-1.2 0-2.1-.9-2.1-2.1v-7.3c0-1.2.9-2.1 2.1-2.1Z"/>',
  trash: '<path d="M9.6 2.8h4.8c.7 0 1.2.5 1.2 1.1v.9h4a1 1 0 0 1 0 2h-.9l-.8 12.3A2.2 2.2 0 0 1 15.7 21H8.3a2.2 2.2 0 0 1-2.2-1.9L5.3 6.8h-.9a1 1 0 0 1 0-2h4v-.9c0-.6.5-1.1 1.2-1.1Zm.4 7a.9.9 0 0 0-.9.9l.3 6.8a.9.9 0 0 0 1.8 0l-.3-6.8a.9.9 0 0 0-.9-.9Zm4 0a.9.9 0 0 0-.9.9l-.3 6.8a.9.9 0 0 0 1.8 0l.3-6.8a.9.9 0 0 0-.9-.9Z"/>',
  pencil: '<path d="M16.3 3.6a2 2 0 0 1 2.8 0l1.3 1.3a2 2 0 0 1 0 2.8L9.2 18.9l-4.6 1.3a.7.7 0 0 1-.8-.8l1.3-4.6Z"/>',
  copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="2.6"/><path d="M6 15.6h-.4A2.1 2.1 0 0 1 3.5 13.5V5.6c0-1.2.9-2.1 2.1-2.1h7.9c1.2 0 2.1.9 2.1 2.1V6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mic: '<rect x="8.3" y="2.5" width="7.4" height="12.4" rx="3.7"/><path d="M5.5 11.3a6.5 6.5 0 0 0 13 0M12 17.8v3.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  chevronLeft: '<path d="M15.2 4.2a1.2 1.2 0 0 1 0 1.7L9.1 12l6.1 6.1a1.2 1.2 0 0 1-1.7 1.7l-7-7a1.2 1.2 0 0 1 0-1.7l7-7a1.2 1.2 0 0 1 1.7 0Z"/>',
  sun: '<circle cx="12" cy="12" r="4.4"/><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  sunSmall: '<circle cx="12" cy="12" r="3.4"/><path d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.7 6.7l1.1 1.1M16.2 16.2l1.1 1.1M6.7 17.3l1.1-1.1M16.2 7.8l1.1-1.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  speaker: '<path d="M11.5 4.4v15.2c0 .8-.9 1.2-1.5.7L5.8 16.6H3.9A1.4 1.4 0 0 1 2.5 15.2V8.8c0-.8.6-1.4 1.4-1.4h1.9L10 3.7c.6-.5 1.5-.1 1.5.7Z"/><path d="M15 8.5a5 5 0 0 1 0 7M17.8 5.8a8.8 8.8 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  play: '<path d="M7 4.3v15.4c0 .9 1 1.4 1.7.9l11.4-7.7a1.1 1.1 0 0 0 0-1.8L8.7 3.4C8 2.9 7 3.4 7 4.3Z"/>',
  forward: '<path d="M2.5 6.2v11.6c0 .8.9 1.3 1.5.8l7.6-5.8a1 1 0 0 0 0-1.6L4 5.4c-.6-.5-1.5 0-1.5.8Zm10 0v11.6c0 .8.9 1.3 1.5.8l7.6-5.8a1 1 0 0 0 0-1.6L14 5.4c-.6-.5-1.5 0-1.5.8Z"/>',
  xmark: '<path d="M6.2 4.8 12 10.6l5.8-5.8a1 1 0 0 1 1.4 1.4L13.4 12l5.8 5.8a1 1 0 0 1-1.4 1.4L12 13.4l-5.8 5.8a1 1 0 0 1-1.4-1.4l5.8-5.8-5.8-5.8a1 1 0 0 1 1.4-1.4Z"/>',
  checkmark: '<path d="M20 5.7a1.2 1.2 0 0 1 .2 1.7L10.4 19a1.2 1.2 0 0 1-1.8.1L3.8 14.3a1.2 1.2 0 1 1 1.7-1.7l3.8 3.8 9-10.6a1.2 1.2 0 0 1 1.7-.1Z"/>',
  photo: '<path d="M5.5 3.5h13a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V6a2.5 2.5 0 0 1 2.5-2.5Zm0 2A.5.5 0 0 0 5 6v9.6l3.6-3.8a1.3 1.3 0 0 1 1.9 0l2.3 2.4 1.3-1.3a1.3 1.3 0 0 1 1.8 0L19 16V6a.5.5 0 0 0-.5-.5Zm10.3 1.8a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z"/>',
};

/** SVG markup for a registered icon. */
export function icon(name: string | null | undefined, size = 22): string {
  if (!name || !P[name]) return '';
  return `<svg class="ag-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${P[name]}</svg>`;
}

/** Add or replace an icon. `svgInner` is the markup inside a 24 x 24 viewBox, filled with currentColor. */
export function registerIcon(name: string, svgInner: string) { P[name] = svgInner; }

export const iconNames = () => Object.keys(P);
