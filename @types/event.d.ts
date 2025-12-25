export function addEventListener(name: string, fn: (obj?: any) => void): boolean;
export function removeEventListener(name: string, fn: (obj?: any) => void): boolean;
export function clearEventListener(name: string): void;
export function dispatchEvent(name: string, obj?: any): void;