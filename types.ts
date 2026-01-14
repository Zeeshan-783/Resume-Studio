
export interface Project {
  title: string;
  date: string;
  description: string[];
  tech: string;
}

export interface Experience {
  role: string;
  company: string;
  type: string;
  date: string;
  location: string;
  bullets: string[];
}

export interface SkillGroup {
  category: string;
  skills: string;
}
