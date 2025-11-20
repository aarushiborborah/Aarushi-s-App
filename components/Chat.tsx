import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Attachment } from '../types';
import { summarizeIssueFromConversation } from '../services/geminiService';
import { createDefectIssue } from '../services/apiService';
import { PaperAirplaneIcon, PaperClipIcon } from './icons';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hello! I'm here to help you report an issue. Please describe the problem you're facing, including the application name and any steps to reproduce it." }
    ]);
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64String = (loadEvent.target?.result as string).split(',')[1];
                if (base64String) {
                    setAttachments(prev => [...prev, {
                        name: file.name,
                        type: file.type,
                        data: base64String
                    }]);
                }
            };
            reader.onerror = () => {
                setError("Failed to read file.");
            };
            reader.readAsDataURL(file);
        }
        // Reset file input to allow selecting the same file again
        if(event.target) {
            event.target.value = '';
        }
    };

    const handleSend = () => {
        if (input.trim() === '' || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const handleCreateIssue = async () => {
        setIsLoading(true);
        setError(null);
        const thinkingMessage: ChatMessage = { role: 'model', content: "Got it. I'm summarizing your issue and creating a ticket..." };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const summary = await summarizeIssueFromConversation(messages);
            
            const response = await createDefectIssue(summary.appName, summary.title, summary.description, attachments);
            
            const successMessage: ChatMessage = { role: 'model', content: `Successfully created issue! The response from the server is: \n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\`` };
            setMessages(prev => [...prev, successMessage]);
            setAttachments([]);
        } catch (e: any) {
            const errorMessage = e.message || "An unexpected error occurred.";
            setError(errorMessage);
            const modelMessage: ChatMessage = { role: 'model', content: `Sorry, I ran into an error while creating the issue: ${errorMessage}` };
            setMessages(prev => [...prev, modelMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh] bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <header className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200">AI Issue Reporter</h2>
            </header>

            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            {error && <p className="p-4 text-sm text-red-500 border-t border-slate-200 dark:border-slate-700">{error}</p>}

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Describe the issue..."
                        className="flex-grow px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
                        aria-label="Chat input"
                        disabled={isLoading}
                    />
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-3 bg-slate-500 text-white rounded-full hover:bg-slate-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                        aria-label="Attach file"
                    >
                       <PaperClipIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                    >
                       <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
                {attachments.length > 0 && (
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">Attached:</span>
                        <ul className="list-disc list-inside">
                            {attachments.map((file, index) => <li key={index}>{file.name}</li>)}
                        </ul>
                    </div>
                )}
                <button
                    onClick={handleCreateIssue}
                    disabled={isLoading || messages.length <= 1}
                    className="w-full mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Create issue from conversation"
                >
                    {isLoading ? 'Processing...' : 'Create Issue from Conversation'}
                </button>
            </div>
        </div>
    );
};

export default Chat;