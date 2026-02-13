export interface UnitData {
  name: string;
  country: string;      
  address: string; 
  phone?: string;
}

export interface RegisterUserData {
  username: string;
  email: string;
  phone?: string;
  password: string;
  roleReference: string;
}

export interface UnitWithAdminRequest {
  unit: UnitData;
  adminUser: RegisterUserData;
}

export interface UnitRegistrationResponse {
  unit: {
    id: number;
    name: string;
    country: string;       
    address: string; 
    phone?: string;
    createdAt: string;
    updatedAt: string;
    userCount: number;
  };
  adminUser: {
    id: number;
    username: string;
    email: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    role: {
      id: number;
      label: string;
      reference: string;
      slug: string;
      isUnitAdmin: boolean;
    };
    unit: {
      id: number;
      name: string;
      country: string;       // Nouveau champ
      address: string; 
      phone?: string;
      description?: string;
    };
  };
}