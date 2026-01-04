export type UserRole = 
  | 'Super Admin' 
  | 'Inner Circle' 
  | 'Brand Lead' 
  | 'Ops / VA' 
  | 'Creative' 
  | 'Partner' 
  | 'Therapist';

export type UserRank = 
  | 'Execution King' 
  | 'Architect' 
  | 'Hustler' 
  | 'MVP of the Week';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole | string;
  rank?: UserRank;
  assignedBrands?: string[];
  xp?: number;
  profileImage?: string;
}