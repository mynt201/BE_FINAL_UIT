// User Types
export interface IUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  fullName?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  refreshTokens?: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
  }>;
}

export interface ICreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface IUpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  fullName?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

// Auth Types
export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest extends ICreateUserRequest {}

export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

// Ward Types
export interface IWard {
  _id: string;
  ward_name: string;
  district: string;
  population_density: number;
  low_elevation: number;
  drainage_capacity?: number;
  urban_land: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  area_km2?: number;
  description?: string;
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateWardRequest {
  ward_name: string;
  district: string;
  population_density: number;
  low_elevation: number;
  drainage_capacity?: number;
  urban_land: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  area_km2?: number;
  description?: string;
}

// Weather Types
export interface IWeather {
  _id: string;
  date: Date;
  location: {
    ward_id: string;
    ward_name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity?: number;
  rainfall: number;
  wind_speed?: number;
  wind_direction?: string;
  pressure?: number;
  water_level?: number;
  tidal_level?: number;
  weather_condition: string;
  source: string;
  is_forecast: boolean;
  notes?: string;
}

// Risk Index Types
export interface IRiskIndex {
  _id: string;
  ward_id: string;
  ward_name: string;
  calculation_date: Date;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  exposure: number;
  susceptibility: number;
  resilience: number;
  risk_score: number;
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  factors?: {
    population_density?: number;
    low_elevation?: number;
    urban_land?: number;
    drainage_capacity?: number;
    rainfall?: number;
    water_level?: number;
    weather_condition?: string;
  };
  trend?: {
    previous_score: number;
    change_percentage: number;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  calculation_method: string;
  data_sources: string[];
  notes?: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Statistics Types
export interface IDailyStatistics {
  year: number;
  month: number;
  monthName: string;
  dailyStats: Array<{
    day: number;
    date: string;
    rainfall: number;
    avgWaterLevel: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    avgRisk: number;
    wardDetails: Array<{
      ward_name: string;
      risk_score: number;
      risk_level: string;
    }>;
  }>;
}

export interface IMonthlyStatistics {
  year: number;
  monthlyStats: Array<{
    month: number;
    monthName: string;
    avgRainfall: number;
    totalRainfall: number;
    avgRisk: number;
    highRiskDays: number;
    rainyDays: number;
    totalDays: number;
  }>;
}

export interface IYearlyStatistics {
  startYear: number;
  endYear: number;
  yearlyStats: Array<{
    year: number;
    totalRainfall: number;
    avgRisk: number;
    highRiskMonths: number;
    rainyDays: number;
    monthlyRisks: number[];
  }>;
}

export interface IComparisonStatistics {
  period1: {
    avgRainfall: number;
    avgRisk: number;
    highRiskDays: number;
    totalDays: number;
    maxRisk: number;
    minRisk: number;
    label: string;
  };
  period2: {
    avgRainfall: number;
    avgRisk: number;
    highRiskDays: number;
    totalDays: number;
    maxRisk: number;
    minRisk: number;
    label: string;
  };
  changes: {
    rainfall: number;
    risk: number;
    highRiskDays: number;
  };
}

// Dashboard Types
export interface IDashboardStats {
  overview: {
    totalUsers: number;
    totalWards: number;
    totalWeatherRecords: number;
    totalRiskRecords: number;
  };
  userStats: Record<string, number>;
  wardStats: Record<string, number>;
  weatherStats: {
    totalRainfall: number;
    avgTemperature: number;
    avgHumidity: number;
    recordCount: number;
  };
  riskDistribution: Array<{
    level: string;
    count: number;
    percentage: string;
  }>;
  recentUsers: Array<{
    username: string;
    fullName?: string;
    role: string;
    createdAt: Date;
  }>;
  lastUpdated: Date;
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalUsers?: number;
    totalWards?: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Pagination Types
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'all' | 'admin' | 'user';
}

// System Usage Types
export interface ISystemUsage {
  _id: string;
  user_id: string;
  ward_id?: string;
  action: string;
  action_details?: any;
  ip_address: string;
  user_agent?: string;
  session_id?: string;
  start_time: Date;
  end_time?: Date;
  duration_ms?: number;
  status: 'success' | 'error' | 'warning' | 'info';
  error_message?: string;
  resource_type?: string;
  resource_id?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  device_info?: {
    browser?: string;
    os?: string;
    device?: string;
    screen_resolution?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Drainage System Types
export interface IDrainageSystem {
  _id: string;
  ward_id: string;
  ward_name: string;
  system_name: string;
  system_type: 'surface_drainage' | 'underground_drainage' | 'combined_system' | 'stormwater_management' | 'sewer_system';
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  design_capacity: number;
  current_flow_rate?: number;
  material?: string;
  installation_year?: number;
  last_maintenance?: Date;
  next_maintenance?: Date;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  blockages: Array<{
    date: Date;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    resolved: boolean;
    resolved_date?: Date;
  }>;
  pumps: Array<{
    pump_id: string;
    capacity: number;
    power: number;
    operational: boolean;
    last_service?: Date;
  }>;
  monitoring_stations: Array<{
    station_id: string;
    location: string;
    sensors: Array<{
      type: string;
      operational: boolean;
      last_reading?: number;
      last_reading_date?: Date;
    }>;
  }>;
  coverage_area?: number;
  efficiency_rating?: number;
  notes?: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Road Bridge Types
export interface IRoadBridge {
  _id: string;
  ward_id: string;
  ward_name: string;
  name: string;
  type: 'road' | 'bridge' | 'culvert' | 'tunnel' | 'flyover' | 'underpass' | 'footbridge';
  category: 'national' | 'provincial' | 'district' | 'local' | 'private';
  status: 'operational' | 'under_maintenance' | 'closed' | 'planned' | 'damaged';
  location: string;
  coordinates: {
    start?: {
      latitude: number;
      longitude: number;
    };
    end?: {
      latitude: number;
      longitude: number;
    };
  };
  specifications: {
    length?: number;
    width?: number;
    height?: number;
    lanes?: number;
    max_load?: number;
    speed_limit?: number;
    surface_type?: string;
  };
  construction: {
    construction_year?: number;
    contractor?: string;
    cost?: number;
    funding_source?: string;
    design_standard?: string;
  };
  maintenance: {
    last_inspection?: Date;
    next_inspection?: Date;
    last_maintenance?: Date;
    next_maintenance?: Date;
    maintenance_history: Array<{
      date: Date;
      type: string;
      description: string;
      cost?: number;
      contractor?: string;
    }>;
    condition_rating?: number;
  };
  traffic: {
    daily_volume?: number;
    peak_hour_volume?: number;
    vehicle_types: Array<{
      type: string;
      percentage: number;
    }>;
    congestion_level: 'low' | 'moderate' | 'high' | 'severe';
  };
  flood_vulnerability: {
    flood_risk_level: 'low' | 'medium' | 'high' | 'very_high';
    flood_history: Array<{
      date: Date;
      flood_level: number;
      damage: string;
      recovery_cost?: number;
    }>;
    protective_measures: Array<{
      type: string;
      description: string;
      installation_date?: Date;
      effectiveness: 'high' | 'medium' | 'low' | 'none';
    }>;
  };
  utilities: {
    has_lighting: boolean;
    has_signage: boolean;
    has_barriers: boolean;
    has_cctv: boolean;
    has_emergency_phones: boolean;
  };
  environmental_impact: {
    noise_level?: string;
    air_quality_impact?: string;
    wildlife_disruption?: string;
    green_spaces_affected?: number;
  };
  notes?: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request Types with User
export interface IAuthenticatedRequest extends Request {
  user: IUser;
}

// Extended Express Request types
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Pino Logger Types
export interface ILogger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  child: (bindings: Record<string, any>) => ILogger;
}
