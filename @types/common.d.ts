export type NextTickType = "micro" | "macro";

export interface DeepCloneOptions {
    handleDOM?: boolean;
    handlePromise?: boolean;
}

export interface EventProxy {
    on(fn: (elem: Element, e: Event, setBehavior: (vals: { hitting?: boolean; aborting?: boolean }) => void) => void): boolean;
    off(fn: (elem: Element, e: Event, setBehavior: (vals: { hitting?: boolean; aborting?: boolean }) => void) => void): boolean;
    readonly eventName: string;
    // internal symbols are not exposed here
}

export function loadJS(src: string, callback?: () => void): void;

export function ready(fn: (() => void) | Array<() => void>, immediate?: boolean): void;

export function getCookie(cookieName: string): string | null;

export function isFunction(e: any): e is Function;

export function isEmpty(val: any): boolean;

export function on(eventName: string, eventFn: EventListenerOrEventListenerObject): void;
export function on(element: EventTarget, eventName: string, eventFn: EventListenerOrEventListenerObject): void;

export function off(eventName: string, eventFn: EventListenerOrEventListenerObject): void;
export function off(element: EventTarget, eventName: string, eventFn: EventListenerOrEventListenerObject): void;

export function onAnimationStart(element: Element, eventFn: (ev: Event) => void, once?: boolean): void;
export function onAnimationEnd(element: Element, eventFn: (ev: Event) => void, once?: boolean): void;

export function createEventProxy(element: Element, eventName: string): EventProxy;

export function removeEventProxy(eventProxy: EventProxy | null | undefined): void;

export function appendHtml(elem: Element | string, html?: string): void;

export function replaceHtml(elem: Element, html: string): void;

export function html(strings: TemplateStringsArray | string[], ...keys: Array<string | number>): (...values: any[]) => string;

export function htmlCondition<T = any>(predicate: ((v: T) => boolean) | any, val: T, fn?: ((v: T) => any) | any): any;

export function parentElement(elem: Node | null | undefined): Element | null;

export function nextElement(elem: Node | null | undefined): Element | null;

export function previousElement(elem: Node | null | undefined): Element | null;

export function setNextTick(fn: () => void, type?: NextTickType): string;

export function clearNextTick(key: string): boolean;

export function deepClone<T = any>(obj: T, options?: DeepCloneOptions): T;

export function generateId(): number;

export function generateGUID(): string;

export function show(element: Element | null | undefined): void;

export function hide(element: Element | null | undefined): void;

export function saveAs(blob: Blob, filename?: string): void;

export function readTextFile(blob: Blob | null | undefined, encoding?: string): Promise<string | null>;

export function convertDataAttr(str: string): string;

export function splitText(str: string | null | undefined, split?: string): string[];

