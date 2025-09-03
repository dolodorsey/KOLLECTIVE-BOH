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
  role: UserRole;
  rank?: UserRank;
  assignedBrands: string[];
  xp: number;
  profileImage?: string;
}