export type Profile = {
  id: string;
  email: string;
  role: 'admin' | 'booth_staff';
  full_name: string;
  created_at: string;
};

export type Booth = {
  id: string;
  booth_number: string;
  booth_name: string;
  description: string;
  staff_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  booth_id: string;
  name: string;
  price: number;
  is_out_of_stock: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  booth_id: string;
  product_id: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  from_user_id: string;
  to_booth_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};
