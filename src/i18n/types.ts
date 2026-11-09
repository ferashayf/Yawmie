// A text table: plain text, lists, small text formulas (which may call each other through `this`), and groups.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type TextFn = (this: any, ...args: any[]) => any;
export type StringValue = string | readonly unknown[] | TextFn | { readonly [key: string]: StringValue };
export type StringTable = { readonly [key: string]: StringValue };
