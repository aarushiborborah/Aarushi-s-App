
import React, { useState } from 'react';
import type { TaskItem, Company, ExtractedActionItem, Project } from '../types';
import { extractActionItems } from '../services/geminiService';
import TaskCard from './TaskCard';

interface ActionItemsViewProps {
    tasks: TaskItem[];
    teamMembers: string[];
    company: Company;
    projects: Project[];
    onAdd: (items: TaskItem[]) => void;
    onUpdate: (task: TaskItem) => void;
    onDelete: (id: string) => void;
}

const ActionItemsView: React.FC<ActionItemsViewProps> = ({ tasks, teamMembers, company, projects, onAdd, onUpdate, onDelete }) => {
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [drafts, setDrafts] = useState<ExtractedActionItem[]>([]);
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [manualItem, setManualItem] = useState<Partial<TaskItem>>({ status: 'In Progress', projectId: undefined });

    const inputClass = "w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-400";

    const handleExtract = async () => {
        if (!transcript.trim()) return;
        setIsProcessing(true);
        try {
            const items = await extractActionItems(transcript, teamMembers);
            setDrafts(items);
        } catch (error) {
            console.error("Extraction failed", error);
            alert("Failed to extract items.");
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmDrafts = () => {
        const newTasks: TaskItem[] = drafts.map(d => ({
            id: crypto.randomUUID(),
            title: d.title,
            assignee: d.assignee,
            dueDate: d.dueDate || '',
            status: (d.status as any) || 'In Progress',
            company,
            type: 'ActionItem'
        }));
        onAdd(newTasks);
        setDrafts([]);
        setTranscript('');
    };

    const removeDraft = (index: number) => {
        setDrafts(drafts.filter((_, i) => i !== index));
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualItem.title || !manualItem.assignee) return;
        
        onAdd([{
            id: crypto.randomUUID(),
            title: manualItem.title,
            assignee: manualItem.assignee,
            dueDate: manualItem.dueDate || '',
            status: manualItem.status || 'In Progress',
            company,
            type: 'ActionItem',
            description: manualItem.description,
            projectId: manualItem.projectId
        } as TaskItem]);
        setIsAddingManual(false);
        setManualItem({ status: 'In Progress', projectId: undefined });
    };

    return (
        <div className="space-y-8">
            {/* Section 1: Extraction Area */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Extract from Meeting Script</h2>
                <textarea
                    className="w-full h-32 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Paste meeting transcript here..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                />
                <div className="mt-3 flex justify-end gap-3">
                     <label className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
                        Upload .txt
                        <input type="file" accept=".txt" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setTranscript(ev.target?.result as string);
                                reader.readAsText(file);
                            }
                        }} />
                    </label>
                    <button
                        onClick={handleExtract}
                        disabled={isProcessing || !transcript}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                    >
                        {isProcessing ? 'Extracting...' : 'Extract Action Items'}
                    </button>
                </div>
            </div>

            {/* Section 2: Drafts Review */}
            {drafts.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-200 dark:border-orange-800/30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-orange-800 dark:text-orange-200">Review Drafts ({drafts.length})</h3>
                        <div className="flex gap-2">
                             <button onClick={() => setDrafts([])} className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded transition-colors">Discard All</button>
                             <button onClick={confirmDrafts} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Confirm All</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {drafts.map((draft, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                                <button onClick={() => removeDraft(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">✕</button>
                                <input 
                                    value={draft.title} 
                                    onChange={(e) => {
                                        const newDrafts = [...drafts];
                                        newDrafts[idx].title = e.target.value;
                                        setDrafts(newDrafts);
                                    }}
                                    className="font-medium w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-cyan-500 focus:outline-none mb-2 px-2 py-1 rounded"
                                    placeholder="Title"
                                />
                                <div className="flex gap-2 text-sm">
                                    <input 
                                        value={draft.assignee} 
                                        onChange={(e) => {
                                            const newDrafts = [...drafts];
                                            newDrafts[idx].assignee = e.target.value;
                                            setDrafts(newDrafts);
                                        }}
                                        className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded w-1/2"
                                        placeholder="Assignee"
                                    />
                                    <input 
                                        type="date"
                                        value={draft.dueDate}
                                        onChange={(e) => {
                                            const newDrafts = [...drafts];
                                            newDrafts[idx].dueDate = e.target.value;
                                            setDrafts(newDrafts);
                                        }}
                                        className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded w-1/2"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 3: Active List & Manual Add */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Daily Action Items List</h2>
                    <button onClick={() => setIsAddingManual(!isAddingManual)} className="px-3 py-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                        {isAddingManual ? 'Cancel Adding' : '+ Add Manual Item'}
                    </button>
                </div>

                {isAddingManual && (
                    <form onSubmit={handleManualSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid gap-4">
                        <input 
                            placeholder="Task Title" 
                            className={inputClass}
                            value={manualItem.title || ''} 
                            onChange={e => setManualItem({...manualItem, title: e.target.value})} 
                            required 
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select 
                                className={inputClass}
                                value={manualItem.assignee || ''} 
                                onChange={e => setManualItem({...manualItem, assignee: e.target.value})} 
                                required
                            >
                                <option value="" disabled>Select Assignee</option>
                                {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select 
                                className={inputClass}
                                value={manualItem.projectId || ''} 
                                onChange={e => setManualItem({...manualItem, projectId: e.target.value === '' ? undefined : e.target.value})} 
                            >
                                <option value="">No Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input 
                                type="date" 
                                className={inputClass}
                                value={manualItem.dueDate || ''} 
                                onChange={e => setManualItem({...manualItem, dueDate: e.target.value})} 
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddingManual(false)} className="px-3 py-1 text-sm text-slate-500">Cancel</button>
                            <button type="submit" className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700">Add Item</button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tasks.length === 0 && <p className="text-slate-500 dark:text-slate-400 col-span-full text-center py-8">No action items yet.</p>}
                    {tasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            teamMembers={teamMembers} 
                            projects={projects}
                            onUpdate={onUpdate} 
                            onDelete={onDelete} 
                            showMoveProject={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActionItemsView;
