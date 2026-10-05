// Backend origin baked at build time; tolerate a trailing slash or a pasted /v1 suffix
export const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '').replace(/\/v1$/, '')
