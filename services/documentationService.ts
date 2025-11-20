// --- Dynamic Path Resolution ---
const isStudioMode = (): boolean => {
    return window.location.href.includes('.goog');
};

/**
 * Constructs the full, correct URL for a given application asset.
 * This function adjusts the path based on whether the app is running in
 * AI Studio or a standard deployed environment. It includes extensive logging
 * for debugging purposes.
 * @param relativePath The path to the asset (e.g., 'Documents/ProjectInstructions.md').
 * @returns The full, absolute URL to the asset.
 */
export function getDocumentUrl(relativePath: string): string {
    const isStudio = isStudioMode();
    
    // --- Extensive Logging as Requested ---
    console.log(`--- [getDocumentUrl Debug] ---`);
    console.log(`isStudioMode: ${isStudio}`);
    console.log(`Input relativePath: "${relativePath}"`);
    console.log(`window.location.href: "${window.location.href}"`);
    console.log(`window.location.origin: "${window.location.origin}"`);
    console.log(`window.location.pathname: "${window.location.pathname}"`);
    // --- End Logging ---

    if (isStudio) {
        // In AI Studio, assets from 'public' are served under '/public/'.
        // The `new URL()` constructor fails with the Studio's href.
        // A simple relative path is more robust as `fetch()` can resolve it.
        const finalStudioPath = `public/${relativePath}`;
        console.log(`[Debug] Studio Mode: Returning simple relative path: "${finalStudioPath}"`);
        return finalStudioPath;
    }

    // In Deployed Mode, construct a robust base URL from the current location.
    const { origin, pathname } = window.location;
    
    let baseDirectory = '';
    // If pathname ends with a slash, it's already a directory.
    if (pathname.endsWith('/')) {
        baseDirectory = pathname;
    } else {
        const lastSlashIndex = pathname.lastIndexOf('/');
        // Check if the last segment looks like a file (contains a dot).
        if (pathname.substring(lastSlashIndex + 1).includes('.')) {
            // It's a file, so the base is the path up to the last slash.
            baseDirectory = pathname.substring(0, lastSlashIndex + 1);
        } else {
            // It's a directory without a trailing slash, so add one.
            baseDirectory = pathname + '/';
        }
    }

    const baseUrl = origin + baseDirectory;
    console.log(`[Debug] Deployed Mode: Calculated baseUrl: "${baseUrl}"`);

    try {
        const finalUrl = new URL(relativePath, baseUrl).href;
        console.log(`[Debug] Deployed Mode: Constructed final URL: "${finalUrl}"`);
        return finalUrl;
    } catch (e) {
        console.error(`[Debug] Deployed Mode: Error constructing URL. Base: '${baseUrl}', Path: '${relativePath}'`, e);
        // Fallback to the relative path if construction fails.
        return relativePath;
    }
}
// --- End Dynamic Path Resolution ---

// List of documents to be used by the UI and the AI context.
// Paths are now relative to the application's public root.
export const documentList = [
    { name: 'SDLC Integration Checklist', path: 'Documents/ProjectInstructions.md' },
    { name: 'Authentication and API Integration Guide', path: 'Documents/AuthenticationAndAPIntegration.md' },
    { name: 'Studio vs. Deployed Mode Guide', path: 'Documents/StudioVsDeployedMode.md' }
];

// Memoize the fetching of the full context to avoid repeated network calls.
let fullContextPromise: Promise<string> | null = null;

export const getFullDocumentationContext = (): Promise<string> => {
    if (fullContextPromise) {
        return fullContextPromise;
    }
    fullContextPromise = (async () => {
        const allContent = await Promise.all(
            documentList.map(async (doc) => {
                const docUrl = getDocumentUrl(doc.path);
                try {
                    const response = await fetch(docUrl);
                    if (!response.ok) {
                        console.error(`Failed to fetch document: ${docUrl}, status: ${response.status}`);
                        return `## DOCUMENT: ${doc.name}\n\n[Error: Could not load content]\n\n`;
                    }
                    const text = await response.text();
                    // Each document is separated for clarity in the context.
                    return `## DOCUMENT: ${doc.name}\n\n${text}\n\n---\n\n`;
                } catch (error) {
                    console.error(`Error fetching document ${docUrl}:`, error);
                    return `## DOCUMENT: ${doc.name}\n\n[Error: Could not load content due to a network issue]\n\n`;
                }
            })
        );
        return allContent.join('');
    })();
    return fullContextPromise;
};