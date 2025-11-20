
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 encoded string
}

// --- Task Manager Types ---

export type Company = 'HumanizeIQ' | 'eTeam';
export type TaskStatus = 'In Progress' | 'Done';
export type TaskType = 'ActionItem' | 'ProjectTask';

export interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string; // YYYY-MM-DD format
  status: TaskStatus;
  description?: string;
  company: Company;
  type: TaskType;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  company: Company;
}

export interface ExtractedActionItem {
  title: string;
  assignee: string;
  dueDate?: string;
  status?: string;
}

export const TEAM_MEMBERS = {
  eTeam: ["Rajeev Borborah", "Ben Thakur", "Faizan Syed"],
  HumanizeIQ: [
    "Rajeev Borborah", "Aarushi Borborah", "Purva Rao", "Praniket Utturkar", 
    "Aman Kumar Srivastava", "Aditi Jor", "Kaysan Shaikh", "Anubha Chakrovarty", 
    "Prathyusha Shetty", "Palak Srivastava", "Ashishree Phatak", 
    "Sahana Khanai", "Sriramkiran Devarakonda"
  ]
};
