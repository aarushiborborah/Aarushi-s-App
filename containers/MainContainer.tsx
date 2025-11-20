
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '../components/icons';
import Dashboard from '../components/Dashboard';

interface MainContainerProps {
    user: { name: string } | null;
    workspaceUrl: string;
    signOutUrl: string;
}

const MainContainer: React.FC<MainContainerProps> = ({ user, workspaceUrl, signOutUrl }) => {
    const { theme, toggleTheme } = useTheme();

    return (
     <div className="relative min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <header className="relative z-20 w-full p-5 flex justify-between items-center border-b border-slate-900/10 dark:border-slate-300/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-4">
            <img 
              src="https://www.humanizeiq.ai/home/images/HumanizeIQ_Logo_updated.png" 
              alt="HumanizeIQ Logo" 
              className="h-12 w-auto" 
            />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 hidden sm:block">Task Manager</h1>
          </div>
          {user && (
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
              <a href={workspaceUrl} className="hidden md:block hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">My Workspace</a>
              <span className="hidden sm:block bg-slate-900/5 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-md text-slate-900 dark:text-slate-100">
                Aarushi Borborah
              </span>
              <a href={signOutUrl} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Sign out</a>
               <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" aria-label="Toggle theme">
                  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
            </nav>
          )}
        </header>

        <main className="relative z-10 flex-grow p-4 sm:p-6 lg:p-8">
             <Dashboard />
        </main>
        
       <footer className="relative z-10 w-full p-5 text-center text-slate-600 dark:text-slate-400 text-sm border-t border-slate-900/10 dark:border-slate-300/10">
         <p>© 2025 HumanizeIQ. All Rights Reserved.</p>
       </footer>
    </div>
    )
};

export default MainContainer;
