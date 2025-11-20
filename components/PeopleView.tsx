
import React, { useState, useMemo } from 'react';
import type { TaskItem } from '../types';
import TaskCard from './TaskCard';

interface PeopleViewProps {
    tasks: TaskItem[];
    teamMembers: string[];
    onUpdateTask: (task: TaskItem) => void;
    onDeleteTask: (id: string) => void;
}

const PeopleView: React.FC<PeopleViewProps> = ({ tasks, teamMembers, onUpdateTask, onDeleteTask }) => {
    const [selectedPerson, setSelectedPerson] = useState<string>(teamMembers[0] || '');
    const [sortBy, setSortBy] = useState<'dueDate' | 'status'>('dueDate');

    const personTasks = useMemo(() => {
        const filtered = tasks.filter(t => t.assignee === selectedPerson);
        return filtered.sort((a, b) => {
            if (sortBy === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            } else {
                return a.status === b.status ? 0 : a.status === 'Done' ? 1 : -1;
            }
        });
    }, [tasks, selectedPerson, sortBy]);

    const actionItems = personTasks.filter(t => t.type === 'ActionItem');
    const projectTasks = personTasks.filter(t => t.type === 'ProjectTask');

    // Calculate stats
    const stats = useMemo(() => {
        const total = personTasks.length;
        const done = personTasks.filter(t => t.status === 'Done').length;
        return { total, done, pending: total - done };
    }, [personTasks]);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar List */}
            <aside className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">Team Members</h3>
                </div>
                <ul className="p-2 space-y-1">
                    {teamMembers.map(person => {
                        const count = tasks.filter(t => t.assignee === person && t.status === 'In Progress').length;
                        return (
                            <li key={person}>
                                <button
                                    onClick={() => setSelectedPerson(person)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-colors ${
                                        selectedPerson === person 
                                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-100 font-medium' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{person}</span>
                                    {count > 0 && <span className="bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-100 text-xs px-2 py-0.5 rounded-full">{count}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <header className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{selectedPerson}</h2>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                            <span>Total: <strong className="text-slate-800 dark:text-slate-200">{stats.total}</strong></span>
                            <span>Pending: <strong className="text-orange-600">{stats.pending}</strong></span>
                            <span>Done: <strong className="text-green-600">{stats.done}</strong></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Sort by:</span>
                        <select 
                            className="p-1 rounded border text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="dueDate">Due Date</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </header>

                <div className="flex-grow overflow-hidden p-6">
                    <div className="flex flex-col xl:flex-row gap-6 h-full">
                        
                        {/* Left Column: Daily Action Items */}
                        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Daily Action Items
                                </h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100">
                                    {actionItems.length}
                                </span>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                                {actionItems.length === 0 && (
                                    <div className="text-center text-slate-400 py-8 text-sm">
                                        No daily action items.
                                    </div>
                                )}
                                {actionItems.map(task => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        teamMembers={teamMembers} 
                                        onUpdate={onUpdateTask} 
                                        onDelete={onDeleteTask} 
                                        showMoveProject={false}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Project Tasks */}
                        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800/30 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Project Tasks
                                </h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100">
                                    {projectTasks.length}
                                </span>
                            </div>
                             <div className="flex-grow overflow-y-auto p-4 space-y-3">
                                {projectTasks.length === 0 && (
                                    <div className="text-center text-slate-400 py-8 text-sm">
                                        No project tasks.
                                    </div>
                                )}
                                {projectTasks.map(task => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        teamMembers={teamMembers} 
                                        onUpdate={onUpdateTask} 
                                        onDelete={onDeleteTask} 
                                        showMoveProject={false}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default PeopleView;
