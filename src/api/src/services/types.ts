/**
 * Balance information
 */
export interface Balance {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
}

/**
 * User entity
 */
export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Customer entity
 */
export interface Customer {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}
