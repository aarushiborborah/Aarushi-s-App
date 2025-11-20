import { useState, useEffect } from 'react';
export const useAuth = () => {
    const [authState, setAuthState] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [workspaceUrl, setWorkspaceUrl] = useState('/home/workspace');
    const [signOutUrl, setSignOutUrl] = useState('/home/confirm-signout');

    useEffect(() => {
        const hostname = window.location.hostname;
        if (hostname.startsWith('tools.')) {
            const newHost = hostname.replace('tools.', 'www.');
            const protocol = window.location.protocol;
            setWorkspaceUrl(`${protocol}//${newHost}/home/workspace`);
            setSignOutUrl(`${protocol}//${newHost}/home/confirm-signout`);
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const href = window.location.href;
            const hostname = window.location.hostname;
            const isGoogDomain = href.includes('.goog');

            // Set the Gemini API key based on the environment.
            if (isGoogDomain) {
                // In Studio Mode, the key is expected to be injected from the environment.
                if ((window as any).process?.env?.API_KEY) {
                    (window as any).GEMINI_API_KEY = (window as any).process.env.API_KEY;
                } else {
                    (window as any).GEMINI_API_KEY = 'NOTFOUND';
                    // Log a warning. AI features will not work because the API key is missing.
                    console.warn("Gemini API_KEY not found in process.env. AI features will not work in Studio Mode.");
                }
            } else {
                // In Deployed Mode, the API key is handled by a proxy. Set a placeholder value.
                (window as any).GEMINI_API_KEY = 'NOT_SET';
            }

            const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

            if (isLocal) {
                // For local development, we don't need to call an auth endpoint.
                setUser({ name: 'Local Dev User' });
                setAuthState('authorized');
                return;
            }

            // For .goog domains (Studio) and other deployed environments, perform API-based auth.
            const isDev = href.includes('dev') || href.includes('nonprod') || isGoogDomain;
            const authUrl = isDev
                ? 'https://ca.dev.humanizeiq.ai/auth/ai_studio'
                : 'https://ca.humanizeiq.ai/auth/ai_studio';

            try {
                const fetchOptions: RequestInit = { credentials: 'include' };

                if (isGoogDomain) {
                    try {
                        const cookieResponse = await fetch('./local_cookie.json');
                        if (cookieResponse.ok) {
                            const cookieData = await cookieResponse.json();
                            if (cookieData?.cookie) {
                                fetchOptions.headers = new Headers(fetchOptions.headers);
                                fetchOptions.headers.set('X-API-Studio', cookieData.cookie);
                            } else {
                                 console.error('local_cookie.json is missing "cookie" property.');
                                 setAuthState('unauthorized');
                                 return;
                            }
                        } else {
                            console.error('Failed to fetch local_cookie.json:', cookieResponse.statusText);
                            setAuthState('unauthorized');
                            return;
                        }
                    } catch (cookieError) {
                        console.error('Error loading local_cookie.json:', cookieError);
                        setAuthState('unauthorized');
                        return;
                    }
                }
                
                const response = await fetch(authUrl, fetchOptions);

                if (response.status === 200) {
                    const result = await response.json();
                    let userName: string | null = null;
                    
                    if (result.data?.firstname && result.data?.lastname) {
                        userName = `${result.data.firstname} ${result.data.lastname}`;
                    }

                    if (userName) {
                        setUser({ name: userName });
                        setAuthState('authorized');
                    } else {
                        console.error("Authentication successful (200 OK) but user name is missing in the response data.", result);
                        setAuthState('unauthorized');
                    }
                } else {
                    const errorDetails = await response.text().catch(() => 'Could not read error response.');
                    console.error(`Authentication failed with status ${response.status}:`, errorDetails);
                    setAuthState('unauthorized');
                }
            } catch (error) {
                // Log the actual error object for better debugging.
                console.error('Authentication check failed:', error);
                setAuthState('unauthorized');
            }
        };
        checkAuth();
    }, []);

    return { authState, user, workspaceUrl, signOutUrl };
};