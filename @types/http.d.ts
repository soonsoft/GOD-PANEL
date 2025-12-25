export type RequestDataType = "json" | "file" | "form" | "text";
export type ResponseDataType = "json" | "file" | "text" | "blob";

export interface HttpRequestOptions extends Omit<RequestInit, "body" | "method"> {
    requestDataType?: RequestDataType;
    responseDataType?: ResponseDataType;
    [key: string]: any;
}

export interface ContentDisposition {
    value: string;
    filename?: string;
    [param: string]: string | undefined;
}

export interface HttpError {
    code: string;
    status: number;
    statusText: string;
    message: string | Promise<string>;
}

export function setGlobalConfig(config?: Partial<RequestInit>): void;

export function getContentDisposition(header: Headers): ContentDisposition;

export function httpUpload(url: string, data?: any): Promise<any>;

export function httpDownload(url: string, data?: any, filename?: string | null, method?: "GET" | "POST"): Promise<void>;

export function httpGet(url: string, data?: any, options?: HttpRequestOptions & { responseDataType: "file" }): Promise<Response>;
export function httpGet(url: string, data?: any, options?: HttpRequestOptions & { responseDataType: "json" }): Promise<any>;
export function httpGet(url: string, data?: any, options?: HttpRequestOptions): Promise<any | Response>;

export function httpPost(url: string, data?: any, options?: HttpRequestOptions & { responseDataType: "file" }): Promise<Response>;
export function httpPost(url: string, data?: any, options?: HttpRequestOptions & { responseDataType: "json" }): Promise<any>;
export function httpPost(url: string, data?: any, options?: HttpRequestOptions): Promise<any | Response>;

export function httpUpload(url: string, data?: any, options?: HttpRequestOptions): Promise<any>;

export function httpDownload(url: string, data?: any, filename?: string | null, method?: "GET" | "POST", options?: HttpRequestOptions): Promise<void>;

export function httpRequest(url: string, method?: string, data?: any, options?: HttpRequestOptions & { responseDataType: "file" }): Promise<Response>;
export function httpRequest(url: string, method?: string, data?: any, options?: HttpRequestOptions & { responseDataType: "json" }): Promise<any>;
export function httpRequest(url: string, method?: string, data?: any, options?: HttpRequestOptions & { responseDataType: "text" }): Promise<string>;
export function httpRequest(url: string, method?: string, data?: any, options?: HttpRequestOptions): Promise<any | Response>;
