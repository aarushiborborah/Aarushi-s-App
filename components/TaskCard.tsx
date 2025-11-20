
import React, { useState } from 'react';
import type { TaskItem, Project } from '../types';

interface TaskCardProps {
    task: TaskItem;
    teamMembers: string[];
    projects?: Project[];
    onUpdate: (task: TaskItem) => void;
    onDelete: (taskId: string) => void;
    showMoveProject?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, teamMembers, projects, onUpdate, onDelete, showMoveProject }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedAssignee, setEditedAssignee] = useState(task.assignee);
    const [editedDate, setEditedDate] = useState(task.dueDate);

    const inputClass = "w-full p-1 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm";

    const toggleStatus = () => {
        onUpdate({ ...task, status: task.status === 'In Progress' ? 'Done' : 'In Progress' });
    };

    const handleSave = () => {
        onUpdate({ ...task, title: editedTitle, assignee: editedAssignee, dueDate: editedDate });
        setIsEditing(false);
    };

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProjectId = e.target.value === "NO_PROJECT" ? undefined : e.target.value;
        onUpdate({ ...task, projectId: newProjectId });
    };

    return (
        <div className={`p-4 rounded-xl border shadow-sm transition-all ${task.status === 'Done' ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 opacity-75' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'}`}>
            <div className="flex items-start gap-3">
                <button 
                    onClick={toggleStatus}
                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'Done' ? 'bg-green-500 border-green-500' : 'border-slate-400 dark:border-slate-500'}`}
                    aria-label={task.status === 'Done' ? "Mark as In Progress" : "Mark as Done"}
                >
                    {task.status === 'Done' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </button>

                <div className="flex-grow space-y-2">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className={inputClass} />
                            <div className="flex gap-2">
                                <select value={editedAssignee} onChange={e => setEditedAssignee(e.target.value)} className={inputClass}>
                                    {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                                    <option value="Unassigned">Unassigned</option>
                                </select>
                                <input type="date" value={editedDate} onChange={e => setEditedDate(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className={`font-medium ${task.status === 'Done' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs mt-1 text-slate-500 dark:text-slate-400">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">{task.assignee}</span>
                                {task.dueDate && <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-500 font-bold' : ''}`}>Due: {task.dueDate}</span>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                   {isEditing ? (
                        <button onClick={handleSave} className="text-green-600 hover:text-green-700 text-xs font-medium px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20">Save</button>
                   ) : (
                        <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-600 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">Edit</button>
                   )}
                   <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                </div>
            </div>

            {showMoveProject && projects && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                     <select 
                        value={task.projectId || "NO_PROJECT"} 
                        onChange={handleProjectChange}
                        className="text-xs p-1 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="NO_PROJECT">No Project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>Move to: {p.name}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
};

export default TaskCard;
