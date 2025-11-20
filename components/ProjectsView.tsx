
import React, { useState } from 'react';
import type { Project, TaskItem, Company } from '../types';
import TaskCard from './TaskCard';

interface ProjectsViewProps {
    projects: Project[];
    tasks: TaskItem[];
    teamMembers: string[];
    company: Company;
    onAddProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
    onAddTask: (task: TaskItem) => void;
    onUpdateTask: (task: TaskItem) => void;
    onDeleteTask: (id: string) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, tasks, teamMembers, company, onAddProject, onDeleteProject, onAddTask, onUpdateTask, onDeleteTask }) => {
    const [isAddingProj, setIsAddingProj] = useState(false);
    const [isAddingGlobalTask, setIsAddingGlobalTask] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    
    // State for adding task to a specific project (modal-like inline)
    const [addingTaskToProj, setAddingTaskToProj] = useState<string | null>(null);
    const [newTask, setNewTask] = useState<Partial<TaskItem>>({ status: 'In Progress' });

    const inputClass = "w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none";
    const inputClassSmall = "p-2 text-sm rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none";

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjName.trim()) return;
        onAddProject({
            id: crypto.randomUUID(),
            name: newProjName,
            company
        });
        setNewProjName('');
        setIsAddingProj(false);
    };

    const handleAddTask = (e: React.FormEvent, specificProjectId?: string) => {
        e.preventDefault();
        const targetProject = specificProjectId || newTask.projectId;
        
        if (!newTask.title || !newTask.assignee) return;

        onAddTask({
            id: crypto.randomUUID(),
            title: newTask.title,
            assignee: newTask.assignee,
            dueDate: newTask.dueDate || '',
            status: 'In Progress',
            company,
            type: 'ProjectTask',
            projectId: targetProject === 'NO_PROJECT' ? undefined : targetProject
        } as TaskItem);

        setAddingTaskToProj(null);
        setIsAddingGlobalTask(false);
        setNewTask({ status: 'In Progress', projectId: undefined });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Projects</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsAddingGlobalTask(!isAddingGlobalTask)}
                        className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:opacity-90 transition-colors"
                    >
                        + New Task
                    </button>
                    <button 
                        onClick={() => setIsAddingProj(!isAddingProj)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        + New Project
                    </button>
                </div>
            </div>

            {isAddingProj && (
                <form onSubmit={handleAddProject} className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex gap-4 items-center">
                    <input 
                        autoFocus
                        placeholder="Project Name" 
                        className={inputClass}
                        value={newProjName}
                        onChange={e => setNewProjName(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                    <button type="button" onClick={() => setIsAddingProj(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancel</button>
                </form>
            )}

            {isAddingGlobalTask && (
                <form onSubmit={(e) => handleAddTask(e)} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Add New Task</h3>
                        <button type="button" onClick={() => setIsAddingGlobalTask(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <input placeholder="Task Title" className={inputClass} value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} autoFocus required />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select className={inputClass} value={newTask.assignee || ''} onChange={e => setNewTask({...newTask, assignee: e.target.value})} required>
                            <option value="" disabled>Assignee</option>
                            {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select className={inputClass} value={newTask.projectId || ''} onChange={e => setNewTask({...newTask, projectId: e.target.value})}>
                            <option value="" disabled>Select Project</option>
                            <option value="NO_PROJECT">No Project (Floating Task)</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="date" className={inputClass} value={newTask.dueDate || ''} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAddingGlobalTask(false)} className="px-3 py-1 text-sm text-slate-500">Cancel</button>
                        <button type="submit" className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Task</button>
                    </div>
                </form>
            )}

            {/* Project List */}
            <div className="grid gap-8">
                {projects.length === 0 && tasks.filter(t => !t.projectId).length === 0 && <p className="text-center text-slate-500">No projects or tasks found. Create one to get started.</p>}
                
                {/* Floating Tasks (No Project) */}
                {tasks.filter(t => !t.projectId).length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/30">
                         <div className="bg-slate-100 dark:bg-slate-700/50 p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 italic">Unassigned Tasks</h3>
                            <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-300">{tasks.filter(t => !t.projectId).length} Tasks</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {tasks.filter(t => !t.projectId).map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    teamMembers={teamMembers} 
                                    projects={projects}
                                    onUpdate={onUpdateTask} 
                                    onDelete={onDeleteTask} 
                                    showMoveProject={true}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {projects.map(proj => {
                    const projTasks = tasks.filter(t => t.projectId === proj.id);
                    return (
                        <div key={proj.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/30">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{proj.name}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">{projTasks.length} Tasks</span>
                                    <button onClick={() => setAddingTaskToProj(proj.id)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300">+ Task</button>
                                    <button onClick={() => onDeleteProject(proj.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                </div>
                            </div>

                            {/* Add Task Form Inline */}
                            {addingTaskToProj === proj.id && (
                                <form onSubmit={(e) => handleAddTask(e, proj.id)} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800 grid gap-3">
                                    <input placeholder="Task Title" className={inputClassSmall} value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} autoFocus required />
                                    <div className="flex gap-3 flex-wrap">
                                        <select className={inputClassSmall} value={newTask.assignee || ''} onChange={e => setNewTask({...newTask, assignee: e.target.value})} required>
                                            <option value="" disabled>Assignee</option>
                                            {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <input type="date" className={inputClassSmall} value={newTask.dueDate || ''} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                                        <div className="flex-grow flex justify-end gap-2">
                                            <button type="button" onClick={() => setAddingTaskToProj(null)} className="text-sm text-slate-500">Cancel</button>
                                            <button type="submit" className="text-sm bg-indigo-600 text-white px-3 py-1 rounded">Add</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projTasks.length === 0 && <div className="col-span-full text-center text-sm text-slate-400 py-4">No tasks in this project.</div>}
                                {projTasks.map(task => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        teamMembers={teamMembers} 
                                        projects={projects}
                                        onUpdate={onUpdateTask} 
                                        onDelete={onDeleteTask} 
                                        showMoveProject={true}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectsView;
