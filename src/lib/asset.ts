/** Resolves a file in /public against the deploy base, so the site works at a domain root (Vercel, localhost)
 *  and under a sub-path (GitHub Pages: /cv4brufers/). */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
