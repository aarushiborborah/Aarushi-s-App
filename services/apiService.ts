import type { Attachment } from '../types';

const getApiBaseUrl = (): string => {
    const hostname = window.location.hostname;
    const href = window.location.href;

    // Check for any development-related indicators in the hostname or URL.
    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        href.includes('.goog') ||
        href.includes('dev') ||
        href.includes('non prod')
    ) {
        return 'https://www.dev.humanizeiq.ai/api/r2-explorer';
    }
    
    // Otherwise, point to the production API
    return 'https://www.humanizeiq.ai/api/r2-explorer';
};

const isStudioMode = (): boolean => {
    const hostname = window.location.href;
    return hostname.includes('.goog');
};

// --- Studio Mode Cookie Loading (Async) ---
let studioCookiePromise: Promise<string | null> | null = null;

const fetchStudioCookie = (): Promise<string | null> => {
    if (!isStudioMode()) {
        return Promise.resolve(null);
    }
    if (studioCookiePromise) {
        return studioCookiePromise;
    }
    studioCookiePromise = (async () => {
        try {
            // Fetch from the application's relative path
            const response = await fetch('./local_cookie.json');
            if (!response.ok) {
                console.error(`Failed to fetch local_cookie.json: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            if (data && typeof data.cookie === 'string') {
                return data.cookie;
            }
            console.error("Invalid format for local_cookie.json. Expected { \"cookie\": \"...\" }");
            return null;
        } catch (error) {
            console.error("Error fetching or parsing local_cookie.json:", error);
            return null;
        }
    })();
    return studioCookiePromise;
};
// --- End Studio Mode Cookie Loading ---

const getUrlWithStudioAuth = async (baseUrl: string): Promise<string> => {
    if (!isStudioMode()) {
        return baseUrl;
    }
    const cookie = await fetchStudioCookie();
    if (!cookie) {
        return baseUrl;
    }
    const param = `X-Studio-Cookie=${encodeURIComponent(cookie)}`;
    if (baseUrl.includes('?')) {
        return `${baseUrl}&${param}`;
    } else {
        return `${baseUrl}?${param}`;
    }
}

const getFetchOptions = async (options: RequestInit = {}): Promise<RequestInit> => {
    const headers = new Headers(options.headers);

    // Studio auth is now handled via query parameter.
    return {
        ...options,
        credentials: 'include',
        headers: headers,
    };
};

export async function getFiles(): Promise<{ request: { url: string, options: RequestInit }, response: any }> {
    const baseUrl = `${getApiBaseUrl()}/files`;
    const url = await getUrlWithStudioAuth(baseUrl);
    const options = await getFetchOptions({ method: 'GET' });

    const request = { url, options };

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            const error: any = new Error(`API call failed with status ${response.status}: ${errorText}`);
            error.request = request;
            throw error;
        }

        const responseJson = await response.json();
        return { request, response: responseJson };
    } catch (error: any) {
        console.error('Error fetching files:', error);
        if (!error.request) {
            error.request = request;
        }
        throw error;
    }
}


export async function createDefectIssue(
    appName: string,
    title: string,
    description: string,
    attachments: Attachment[]
): Promise<any> {
    const baseUrl = 'https://www.dev.humanizeiq.ai/api/ai_studio_manager_api/app-builder/create-defect-issue';
    const url = await getUrlWithStudioAuth(baseUrl);

    const body = {
        appName,
        title,
        description,
        attachments
    };

    const options = await getFetchOptions({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed with status ${response.status}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating defect issue:', error);
        throw error;
    }
}
