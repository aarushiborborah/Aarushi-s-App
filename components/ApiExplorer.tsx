import React, { useState } from 'react';
import { getFiles } from '../services/apiService';

const CodeBlock: React.FC<{ children: React.ReactNode; lang?: string }> = ({ children, lang }) => (
  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto my-2 border border-slate-200 dark:border-slate-700 max-h-96">
    <code className={`font-mono text-sm text-slate-800 dark:text-slate-200 ${lang ? `language-${lang}`: ''}`}>{String(children).trim()}</code>
  </pre>
);


const ApiExplorer: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestInfo, setRequestInfo] = useState<{ url: string; options: RequestInit } | null>(null);

    const handleFetch = async () => {
        setIsLoading(true);
        setError(null);
        setData(null);
        setRequestInfo(null);
        try {
            const { request, response } = await getFiles();
            setRequestInfo(request);
            setData(response);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            if (e.request) {
                setRequestInfo(e.request);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatHeaders = (headers: HeadersInit | undefined): string => {
        if (!headers) return '{}';
        if (headers instanceof Headers) {
            return JSON.stringify(Object.fromEntries(headers.entries()), null, 2);
        }
        return JSON.stringify(headers, null, 2);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 mt-8">
            <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">
                📡 API Explorer Sample
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>Click the button below to make a live, authenticated API call to fetch a list of files. This demonstrates the authentication flow working correctly.</p>
                
                <button
                    onClick={handleFetch}
                    disabled={isLoading}
                    className="px-4 py-2 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Fetching...' : 'Fetch Files'}
                </button>

                <div className="mt-6">
                    {isLoading && (
                        <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                            <p className="ml-4">Loading data...</p>
                        </div>
                    )}
                    
                    {requestInfo && (
                         <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Request</h3>
                            <CodeBlock lang="bash">
                                {`> ${requestInfo.options.method || 'GET'} ${requestInfo.url}\n\n` +
                                 `> Headers:\n${formatHeaders(requestInfo.options.headers)}`}
                            </CodeBlock>
                        </div>
                    )}

                    {error && (
                        <div>
                            <h3 className="text-xl font-semibold text-red-500 mb-2">Error</h3>
                            <CodeBlock lang="text">{error}</CodeBlock>
                        </div>
                    )}
                    
                    {data && (
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Response</h3>
                            <CodeBlock lang="json">{JSON.stringify(data, null, 2)}</CodeBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApiExplorer;