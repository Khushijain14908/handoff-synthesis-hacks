export interface Volunteer {
  id: string;
  name: string;
  contact: string;
  location: {
    lat: number;
    lng: number;
  };
  skills: string[];
  equipment: string[];
  availability: string;
  status: 'pending' | 'matched' | 'deployed';
  createdAt?: any; 
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  publicAnnouncement: string;
  status: 'active' | 'monitoring' | 'resolved';
  createdAt: any;
}

export interface Task {
  id: string;
  incidentId: string;
  title: string;
  requiredSkills: string[];
  assignedVolunteerId?: string;
  matchScore?: number;
  status: 'open' | 'in-progress' | 'completed';
  // Optional task location for proximity scoring
  location?: {
    lat: number;
    lng: number;
  };
}