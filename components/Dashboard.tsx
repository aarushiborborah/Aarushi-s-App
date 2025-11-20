
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { TaskItem, Project, Company } from '../types';
import { TEAM_MEMBERS } from '../types';
import ActionItemsView from './ActionItemsView';
import ProjectsView from './ProjectsView';
import PeopleView from './PeopleView';

type Tab = 'ActionItems' | 'Projects' | 'People';

const Dashboard: React.FC = () => {
    const [activeCompany, setActiveCompany] = useLocalStorage<Company>('active-company', 'HumanizeIQ');
    const [activeTab, setActiveTab] = useState<Tab>('ActionItems');
    const [tasks, setTasks] = useLocalStorage<TaskItem[]>('app-tasks', []);
    const [projects, setProjects] = useLocalStorage<Project[]>('app-projects', []);

    // Helper to get current team members
    const currentMembers = TEAM_MEMBERS[activeCompany];

    // Filter data for current company
    const companyTasks = tasks.filter(t => t.company === activeCompany);
    const companyProjects = projects.filter(p => p.company === activeCompany);

    // CRUD Operations
    const addTask = (newTasks: TaskItem[]) => setTasks(prev => [...prev, ...newTasks]);
    const updateTask = (updated: TaskItem) => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

    const addProject = (project: Project) => setProjects(prev => [...prev, project]);
    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        // Also unassign tasks from this project
        setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
    };

    // Seed some data if absolutely empty
    useEffect(() => {
        if (projects.length === 0 && tasks.length === 0) {
             // Optional: Seed initial data logic can go here if desired
        }
    }, []);

    return (
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
            {/* Top Bar: Company Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    {(['HumanizeIQ', 'eTeam'] as Company[]).map(c => (
                        <button
                            key={c}
                            onClick={() => setActiveCompany(c)}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                                activeCompany === c 
                                    ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                
                <nav className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {(['ActionItems', 'Projects', 'People'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {tab === 'ActionItems' ? 'Daily Action Items' : tab === 'Projects' ? 'Projects & Tasks' : 'People View'}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow animate-in fade-in duration-500">
                {activeTab === 'ActionItems' && (
                    <ActionItemsView 
                        tasks={companyTasks.filter(t => t.type === 'ActionItem')}
                        teamMembers={currentMembers}
                        company={activeCompany}
                        projects={companyProjects}
                        onAdd={addTask}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                    />
                )}
                {activeTab === 'Projects' && (
                    <ProjectsView 
                        projects={companyProjects}
                        tasks={companyTasks.filter(t => t.type === 'ProjectTask')}
                        teamMembers={currentMembers}
                        company={activeCompany}
                        onAddProject={addProject}
                        onDeleteProject={deleteProject}
                        onAddTask={(t) => addTask([t])}
                        onUpdateTask={updateTask}
                        onDeleteTask={deleteTask}
                    />
                )}
                {activeTab === 'People' && (
                    <PeopleView 
                        tasks={companyTasks}
                        teamMembers={currentMembers}
                        onUpdateTask={updateTask}
                        onDeleteTask={deleteTask}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
