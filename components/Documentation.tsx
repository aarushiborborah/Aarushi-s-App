import React, { useState, useEffect } from 'react';
import { documentList, getDocumentUrl } from '../services/documentationService';

interface Document {
    name: string;
    path: string;
}

const Documentation: React.FC = () => {
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectDocument = async (doc: Document) => {
        if (selectedDoc?.path === doc.path && content) return;

        setIsLoading(true);
        setError(null);
        setSelectedDoc(doc);
        try {
            const docUrl = getDocumentUrl(doc.path);
            const response = await fetch(docUrl);
            if (!response.ok) {
                throw new Error(`Failed to load document: ${response.statusText}`);
            }
            const text = await response.text();
            setContent(text);
        } catch (e: any) {
            setError(e.message || 'An error occurred while fetching the document.');
            setContent('');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Automatically load the first document on initial render
        if (documentList.length > 0) {
            handleSelectDocument(documentList[0]);
        }
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 h-full max-h-[85vh] overflow-y-hidden flex flex-col">
            <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 flex-shrink-0">
                Documentation
            </h2>
            <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-y-hidden">
                <nav className="flex-shrink-0 md:w-1/3 lg:w-1/4 border-r border-slate-200 dark:border-slate-700 pr-4 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Available Documents</h3>
                    <ul className="space-y-2">
                        {documentList.map((doc) => (
                            <li key={doc.path}>
                                <button
                                    onClick={() => handleSelectDocument(doc)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                                        selectedDoc?.path === doc.path
                                            ? 'bg-cyan-500 text-white font-semibold'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {doc.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <main className="flex-grow overflow-y-auto">
                    {isLoading && (
                         <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                            <p className="ml-4 text-slate-600 dark:text-slate-300">Loading document...</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && content && (
                         <pre className="bg-transparent dark:bg-transparent p-0 w-full h-full whitespace-pre-wrap font-mono text-sm text-slate-600 dark:text-slate-300">
                            {content}
                        </pre>
                    )}
                     {!isLoading && !error && !content && (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>Select a document from the list to view its content.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Documentation;