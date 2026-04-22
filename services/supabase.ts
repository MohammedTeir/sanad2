import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  Camp,
  DPProfile,
  InventoryItem,
  TransferRequest,
  FamilyMember,
  AidTransaction
} from '../types';

// Types for our new database schema
export interface CampRecord {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  location_governorate: string;
  location_area: string;
  manager_name: string;
  status: 'نشط' | 'قيد الانتظار' | 'ممتلئ';
  created_at: string;
  updated_at: string;
}

export interface FamilyRecord {
  id: string;
  camp_id: string;
  head_of_family_name: string;
  head_of_family_first_name?: string;
  head_of_family_father_name?: string;
  head_of_family_grandfather_name?: string;
  head_of_family_family_name?: string;
  head_of_family_national_id: string; // Added: رقم الهوية (مطلوب، فريد)
  head_of_family_gender: 'ذكر' | 'أنثى';
  head_of_family_date_of_birth: string;
  head_of_family_age: number;
  head_of_family_marital_status: 'أعزب' | 'متزوج' | 'أرمل' | 'مطلق' | 'أسرة هشة';
  head_of_family_widow_reason: 'شهيد' | 'وفاة طبيعية' | 'حادث' | 'مرض' | 'غير ذلك' | null;
  head_of_family_role: 'أب' | 'أم' | 'زوجة';
  head_of_family_is_working: boolean;
  head_of_family_job: string;
  head_of_family_monthly_income: number; // Added: الدخل الشهري التقريبي
  head_of_family_phone_number: string;
  head_of_family_phone_secondary: string;
  head_of_family_disability_type: 'لا يوجد' | 'حركية' | 'بصرية' | 'سمعية' | 'ذهنية' | 'أخرى';
  head_of_family_disability_details: string; // Added: More detailed disability info
  head_of_family_chronic_disease_type: 'لا يوجد' | 'سكري' | 'ضغط دم' | 'قلب' | 'سرطان' | 'ربو' | 'فشل كلوي' | 'مرض نفسي' | 'أخرى';
  head_of_family_chronic_disease_details: string; // Added: More detailed chronic disease info
  head_of_family_war_injury_type: 'لا يوجد' | 'بتر' | 'كسر' | 'شظية' | 'حرق' | 'رأس/وجه' | 'عمود فقري' | 'أخرى';
  head_of_family_war_injury_details: string; // Added: More detailed injury info
  head_of_family_medical_followup_required: boolean; // Added: المتابعة الطبية: الحاجة
  head_of_family_medical_followup_frequency: 'يومي' | 'أسبوعي' | 'شهري' | string; // Added: المتابعة الطبية: تكرارها
  wife_name: string;
  wife_first_name?: string;
  wife_father_name?: string;
  wife_grandfather_name?: string;
  wife_family_name?: string;
  wife_national_id: string;
  wife_is_pregnant: boolean;
  wife_pregnancy_month: number;
  wife_medical_followup_required: boolean; // Added: المتابعة الطبية للزوجة
  wife_medical_followup_frequency: string; // Added: تكرار المتابعة للزوجة
  wife_disability_type: 'لا يوجد' | 'حركية' | 'بصرية' | 'سمعية' | 'ذهنية' | 'أخرى';
  wife_disability_details: string; // Added: More detailed disability info for wife
  wife_chronic_disease_type: 'لا يوجد' | 'سكري' | 'ضغط دم' | 'قلب' | 'سرطان' | 'ربو' | 'فشل كلوي' | 'مرض نفسي' | 'أخرى';
  wife_chronic_disease_details: string; // Added: More detailed chronic disease info for wife
  wife_war_injury_type: 'لا يوجد' | 'بتر' | 'كسر' | 'شظية' | 'حرق' | 'رأس/وجه' | 'عمود فقري' | 'أخرى';
  wife_war_injury_details: string; // Added: More detailed injury info for wife
  total_members_count: number;
  male_count: number;
  female_count: number;
  child_count: number; // Added: تصنيف العمري: أطفال
  teenager_count: number; // Added: تصنيف العمري: مراهقين
  adult_count: number; // Added: تصنيف العمري: بالغين
  senior_count: number; // Added: تصنيف العمري: كبار سن
  disabled_count: number; // Added: إحصائيات الصحة: عدد المعاقين
  injured_count: number; // Added: إحصائيات الصحة: المصابين
  pregnant_women_count: number; // Added: إحصائيات الصحة: الحوامل
  original_address_governorate: string;
  original_address_region: string;
  original_address_details: string;
  original_address_housing_type: 'ملك' | 'إيجار'; // Added: نوع السكن (ملك، إجار)
  current_housing_type: 'خيمة' | 'بيت إسمنتي' | 'شقة' | 'أخرى';
  current_housing_camp_id: string;
  current_housing_unit_number: string; // Added: رقم الخيمة/الوحدة
  current_housing_is_suitable_for_family_size: boolean; // Added: مناسب للعدد؟
  current_housing_sanitary_facilities: 'نعم (دورة مياه خاصة)' | 'لا (مرافق مشتركة)'; // Added: المرافق الصحية
  current_housing_sanitary_conditions: string; // Added: المرافق الصحية (legacy)
  current_housing_water_source: 'شبكة عامة' | 'صهاريج' | 'آبار' | 'آخر'; // Added: مصادر المياه
  current_housing_electricity_access: 'شبكة عامة' | 'مولد' | 'طاقة شمسية' | 'لا يوجد' | 'آخر'; // Added: الكهرباء
  current_housing_landmark: string;
  current_housing_country: string;
  vulnerability_score: number;
  vulnerability_priority: 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض';
  vulnerability_breakdown: Record<string, number>; // JSONB field
  vulnerability_reason: string;
  nomination_body: string;
  admin_notes: string;
  registered_date: string;
  last_updated: string;
}

export interface IndividualRecord {
  id: string;
  family_id: string;
  name: string;
  first_name?: string;
  father_name?: string;
  grandfather_name?: string;
  family_name?: string;
  national_id: string; // Added: رقم الهوية
  gender: 'ذكر' | 'أنثى';
  date_of_birth: string;
  age: number;
  relation: 'الابن' | 'البنت' | 'الجد' | 'الجدة' | 'الحفيد' | 'الحفيدة' | 'العم' | 'العمة' | 'الخال' | 'الخالة' | 'ابن الأخ' | 'ابنة الأخ' | 'ابن العم' | 'أخرى';
  education_level: 'لا يدرس' | 'ابتدائي' | 'إعدادي/ثانوي' | 'جامعي' | 'أخرى'; // Added: التعليم/العمل: المرحلة الدراسية للأطفال
  occupation: string; // Added: التعليم/العمل: المهنة للبالغين
  phone_number: string;
  marital_status: 'أعزب' | 'متزوج' | 'أرمل' | 'مطلق' | 'أسرة هشة';
  disability_type: 'لا يوجد' | 'حركية' | 'بصرية' | 'سمعية' | 'ذهنية' | 'أخرى';
  disability_details: string; // Added: More detailed disability info
  chronic_disease_type: 'لا يوجد' | 'سكري' | 'ضغط دم' | 'قلب' | 'سرطان' | 'ربو' | 'فشل كلوي' | 'مرض نفسي' | 'أخرى';
  chronic_disease_details: string; // Added: More detailed chronic disease info
  has_war_injury: boolean;
  war_injury_type: 'لا يوجد' | 'بتر' | 'كسر' | 'شظية' | 'حرق' | 'رأس/وجه' | 'عمود فقري' | 'أخرى';
  war_injury_details: string; // Added: More detailed injury info
  medical_followup_required: boolean; // Added: المتابعة الطبية: الحاجة
  medical_followup_frequency: 'يومي' | 'أسبوعي' | 'شهري' | string; // Added: المتابعة الطبية: تكرارها
  created_at: string;
  updated_at: string;
}

export interface AidRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  camp_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DistributionRecord {
  id: string;
  campaign_name: string;
  aid_id: string;
  camp_id: string;
  distribution_date: string;
  status: 'قيد الانتظار' | 'نشط' | 'مكتمل';
  total_beneficiaries: number;
  total_quantity_distributed: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DistributionRecordDetail {
  id: string;
  distribution_id: string;
  family_id: string;
  individual_id: string;
  quantity_received: number;
  status: 'تم التسليم' | 'قيد الانتظار';
  received_by: string;
  confirmation_code: string;
  delivery_date: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryRecord {
  id: string;
  camp_id: string;
  item_name: string;
  category: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_allocated: number;
  unit: string;
  expiry_date: string;
  supplier: string;
  received_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: 'SYSTEM_ADMIN' | 'CAMP_MANAGER' | 'FIELD_OFFICER' | 'BENEFICIARY';
  camp_id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionRecord {
  id: string;
  role: 'SYSTEM_ADMIN' | 'CAMP_MANAGER' | 'FIELD_OFFICER' | 'BENEFICIARY';
  resource: string;
  action: string;
  created_at: string;
}

export interface ImportExportOperationRecord {
  id: string;
  operation_type: 'استيراد' | 'تصدير';
  entity_type: string;
  file_name: string;
  file_url: string;
  status: 'قيد المعالجة' | 'مكتمل' | 'فشل';
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_log: string;
  initiated_by: string;
  started_at: string;
  completed_at: string;
}

export interface BackupSyncOperationRecord {
  id: string;
  operation_type: 'نسخة احتياطية' | 'مزامنة' | 'استعادة';
  scope: 'كامل' | 'جزئي' | 'خاص بالمخيم';
  camp_id: string;
  file_name: string;
  file_url: string;
  status: 'قيد المعالجة' | 'مكتمل' | 'فشل';
  size_bytes: number;
  initiated_by: string;
  started_at: string;
  completed_at: string;
}

export interface SystemOperationLogRecord {
  id: string;
  user_id: string;
  operation_type: string;
  resource_type: string;
  resource_id: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface SecurityLogRecord {
  id: string;
  user_id: string;
  event_type: string; // Type of security event
  severity: 'منخفض' | 'متوسط' | 'عالي' | 'حرج';
  description: string;
  ip_address: string; // Store IP address
  user_agent: string; // Store user agent string
  details: Record<string, any>; // Additional event-specific details
  created_at: string;
}

export interface FailedLoginAttemptRecord {
  id: string;
  username: string;
  ip_address: string;
  user_agent: string;
  attempted_at: string;
  blocked_until: string; // When the IP/user is unblocked
}

export interface SoftDeleteRecord {
  id: string;
  table_name: string;
  record_id: string;
  deleted_data: Record<string, any>; // Stores the full record data at time of deletion
  deleted_by_user_id: string;
  deleted_at: string;
  restored_at: string;
  restoration_reason: string;
}

// Interfaces for the additional tables that were referenced but not defined

export interface AidCampaignRecord {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'مخطط' | 'نشط' | 'مكتمل' | 'ملغى';
  aid_type: string;
  aid_category: 'غذائية' | 'غير غذائية' | 'طبية' | 'مأوى' | 'مائية' | 'أخرى';
  target_families: string[]; // Array of family IDs
  distributed_to: string[]; // Array of family IDs that received aid
  coordinator_user_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AidDistributionRecord {
  id: string;
  family_id: string;
  campaign_id: string;
  aid_type: string;
  aid_category: 'غذائية' | 'غير غذائية' | 'طبية' | 'مأوى' | 'مائية' | 'أخرى';
  quantity: number;
  distribution_date: string;
  distributed_by_user_id: string;
  notes: string;
  received_by_signature: string; // For signature verification
  received_by_biometric: string; // For biometric verification
  received_by_photo_url: string; // For photo verification
  otp_code: string; // For OTP verification
  duplicate_check_passed: boolean; // Track if duplicate check passed
  status: 'تم التسليم' | 'قيد الانتظار';
  created_at: string;
  updated_at: string;
}

export interface InventoryItemRecord {
  id: string;
  camp_id: string;
  name: string;
  category: string; // Custom category - predefined + custom
  unit: string; // Measurement unit (قطعة, كيلوغرام, etc.)
  quantity_available: number;
  quantity_reserved: number;
  quantity_allocated: number;
  min_stock: number;
  max_stock: number;
  min_alert_threshold: number;
  expiry_date: string | null;
  donor: string | null;
  received_date: string | null;
  notes: string | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransactionRecord {
  id: string;
  item_id: string;
  transaction_type: 'وارد' | 'صادر'; // وارد for incoming, صادر for outgoing
  quantity: number;
  related_to: 'شراء' | 'تبرع' | 'توزيع' | 'تحويل' | 'تعديل' | 'تلف'; // Related to what
  related_id: string; // ID of related entity (campaign, transfer, etc.)
  notes: string;
  processed_by_user_id: string; // User ID of person processing
  processed_at: string;
  created_at: string;
}

export interface InventoryAuditRecord {
  id: string;
  item_id: string;
  physical_count: number; // Actual count during audit
  system_count: number; // Count in system before audit
  difference: number; // Difference (physical - system)
  reason: 'نقص' | 'فائض' | 'سرقة' | 'تلف' | 'خطأ عد' | 'أخرى';
  notes: string;
  audited_by_user_id: string; // User ID of person conducting audit
  audited_at: string;
  created_at: string;
}

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Camps methods
  async getCamps(): Promise<CampRecord[]> {
    const { data, error } = await this.client.from('camps').select('*');
    if (error) throw error;
    return data || [];
  }

  async getCampById(id: string): Promise<CampRecord | null> {
    const { data, error } = await this.client.from('camps').select('*').eq('id', id).single();
    if (error) return null;
    return data || null;
  }

  async createCamp(camp: Omit<CampRecord, 'id' | 'created_at' | 'updated_at'>): Promise<CampRecord> {
    const { data, error } = await this.client.from('camps').insert([camp]).select().single();
    if (error) throw error;
    return data!;
  }

  async updateCamp(id: string, updates: Partial<CampRecord>): Promise<CampRecord> {
    const { data, error } = await this.client.from('camps').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data!;
  }

  // Families methods
  async getFamilies(campId?: string): Promise<FamilyRecord[]> {
    let query = this.client.from('families').select('*');
    if (campId) {
      query = query.eq('camp_id', campId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getFamilyById(id: string): Promise<FamilyRecord | null> {
    const { data, error } = await this.client.from('families').select('*').eq('id', id).single();
    if (error) return null;
    return data || null;
  }

  async createFamily(family: Omit<FamilyRecord, 'registered_date' | 'last_updated'>): Promise<FamilyRecord> {
    const { data, error } = await this.client.from('families').insert([family]).select().single();
    if (error) throw error;
    return data!;
  }

  async updateFamily(id: string, updates: Partial<FamilyRecord>): Promise<FamilyRecord> {
    const { data, error } = await this.client.from('families').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data!;
  }

  // Individuals methods
  async getIndividualsByFamilyId(familyId: string): Promise<IndividualRecord[]> {
    const { data, error } = await this.client.from('individuals').select('*').eq('family_id', familyId);
    if (error) throw error;
    return data || [];
  }

  async createIndividual(individual: Omit<IndividualRecord, 'id' | 'created_at' | 'updated_at'>): Promise<IndividualRecord> {
    const { data, error } = await this.client.from('individuals').insert([individual]).select().single();
    if (error) throw error;
    return data!;
  }

  // Inventory methods
  async getInventoryByCampId(campId: string): Promise<InventoryRecord[]> {
    const { data, error } = await this.client.from('inventory').select('*').eq('camp_id', campId);
    if (error) throw error;
    return data || [];
  }

  async createSimpleInventory(item: Omit<InventoryRecord, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryRecord> {
    const { data, error } = await this.client.from('inventory').insert([item]).select().single();
    if (error) throw error;
    return data!;
  }

  // Distributions methods
  async getDistributionsByCampId(campId: string): Promise<DistributionRecord[]> {
    const { data, error } = await this.client.from('distributions').select('*').eq('camp_id', campId);
    if (error) throw error;
    return data || [];
  }

  async createDistribution(distribution: Omit<DistributionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<DistributionRecord> {
    const { data, error } = await this.client.from('distributions').insert([distribution]).select().single();
    if (error) throw error;
    return data!;
  }

  // Distribution records methods
  async getDistributionRecordsByDistributionId(distributionId: string): Promise<DistributionRecordDetail[]> {
    const { data, error } = await this.client.from('distribution_records').select('*').eq('distribution_id', distributionId);
    if (error) throw error;
    return data || [];
  }

  async createDistributionRecord(record: Omit<DistributionRecordDetail, 'id' | 'created_at' | 'updated_at'>): Promise<DistributionRecordDetail> {
    const { data, error } = await this.client.from('distribution_records').insert([record]).select().single();
    if (error) throw error;
    return data!;
  }

  // Users methods
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const { data, error } = await this.client.from('users').select('*').eq('email', email).single();
    if (error) return null;
    return data || null;
  }

  async createUser(user: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>): Promise<UserRecord> {
    const { data, error } = await this.client.from('users').insert([user]).select().single();
    if (error) throw error;
    return data!;
  }

  // Audit log methods
  async logSystemOperation(logEntry: Omit<SystemOperationLogRecord, 'id' | 'created_at'>): Promise<SystemOperationLogRecord> {
    const { data, error } = await this.client.from('system_operations_log').insert([logEntry]).select().single();
    if (error) throw error;
    return data!;
  }

  // Update user method
  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord> {
    const { data, error } = await this.client.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data!;
  }

  // Authentication methods
  async signInWithEmail(email: string, password: string): Promise<UserRecord> {
    // In a real Supabase implementation, we would use:
    // const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    // But for our direct database approach, we'll lookup the user and verify password

    // For the JWT implementation, we'll still need to access the database directly
    // to verify credentials, but the actual authentication will be handled by our backend
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    // Verify the password hash
    const isValidPassword = await bcrypt.compare(password, data.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    if (!data.is_active) {
      throw new Error('Account is inactive');
    }

    // Update last login time
    await this.client
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  }

  async signUpUser(userData: Omit<UserRecord, 'id' | 'created_at' | 'updated_at' | 'last_login'>): Promise<UserRecord> {
    const { data, error } = await this.client
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  // Permissions methods
  async getPermissionsForRole(role: string): Promise<PermissionRecord[]> {
    const { data, error } = await this.client.from('permissions').select('*').eq('role', role);
    if (error) throw error;
    return data || [];
  }

  async getAllPermissions(): Promise<PermissionRecord[]> {
    const { data, error } = await this.client.from('permissions').select('*');
    if (error) throw error;
    return data || [];
  }

  async createPermission(permission: Omit<PermissionRecord, 'id' | 'created_at'>): Promise<PermissionRecord> {
    const { data, error } = await this.client.from('permissions').insert([permission]).select().single();
    if (error) throw error;
    return data!;
  }

  async deletePermission(id: string): Promise<void> {
    const { error } = await this.client.from('permissions').delete().eq('id', id);
    if (error) throw error;
  }

  // Backup/Sync operations methods
  async getBackupSyncOperations(): Promise<BackupSyncOperationRecord[]> {
    const { data, error } = await this.client.from('backup_sync_operations').select('*');
    if (error) throw error;
    return data || [];
  }

  async getBackupSyncOperationById(id: string): Promise<BackupSyncOperationRecord | null> {
    const { data, error } = await this.client.from('backup_sync_operations').select('*').eq('id', id).single();
    if (error) return null;
    return data || null;
  }

  async createBackupSyncOperation(operation: Omit<BackupSyncOperationRecord, 'id' | 'file_name' | 'file_url' | 'size_bytes' | 'completed_at'>): Promise<BackupSyncOperationRecord> {
    const { data, error } = await this.client.from('backup_sync_operations').insert([operation]).select().single();
    if (error) throw error;
    return data!;
  }

  async updateBackupSyncOperation(id: string, updates: Partial<BackupSyncOperationRecord>): Promise<BackupSyncOperationRecord> {
    const { data, error } = await this.client.from('backup_sync_operations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data!;
  }

  /**
   * ⚠️  DISABLED: Updates the vulnerability score for a family - Vulnerability score system disabled
   * Updates the vulnerability score for a family based on the calculated score
   * @deprecated Vulnerability score system is disabled
   */
  async updateFamilyVulnerabilityScore(
    familyId: string,
    vulnerabilityScore: number,
    vulnerabilityPriority: 'very_high' | 'high' | 'medium' | 'low',
    vulnerabilityBreakdown: Record<string, number>
  ): Promise<void> {
    // ⚠️  DISABLED: This method is deprecated and does nothing
    console.warn('updateFamilyVulnerabilityScore is deprecated - Vulnerability score system is disabled');

    // Original code kept for potential re-enablement:
    // const { error } = await this.client
    //   .from('families')
    //   .update({
    //     vulnerability_score: vulnerabilityScore,
    //     vulnerability_priority: vulnerabilityPriority,
    //     vulnerability_breakdown: vulnerabilityBreakdown
    //   })
    //   .eq('id', familyId);
    // if (error) {
    //   throw new Error(error.message);
    // }
  }

  /**
   * ⚠️  DISABLED: Recalculates vulnerability scores for all families - Vulnerability score system disabled
   * @deprecated Vulnerability score system is disabled
   */
  async recalculateAllVulnerabilityScores(): Promise<void> {
    // ⚠️  DISABLED: This method is deprecated and does nothing
    console.warn('recalculateAllVulnerabilityScores is deprecated - Vulnerability score system is disabled');

    // Original code kept for potential re-enablement:
    // const { data: families, error } = await this.client
    //   .from('families')
    //   .select('*');
    // if (error) {
    //   throw new Error(error.message);
    // }

    // In a real implementation, we would:
    // 1. Calculate the new vulnerability score for each family
    // 2. Update each family record with the new score
    // For now, we'll just return since the actual calculation would happen elsewhere
  }

  // Aid Campaign Methods
  async getAidCampaigns(): Promise<AidCampaignRecord[]> {
    const { data, error } = await this.client
      .from('aid_campaigns')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getAidCampaignById(id: string): Promise<AidCampaignRecord | null> {
    const { data, error } = await this.client
      .from('aid_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(error.message);
    }

    return data || null;
  }

  async createAidCampaign(campaign: Omit<AidCampaignRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AidCampaignRecord> {
    const { data, error } = await this.client
      .from('aid_campaigns')
      .insert([campaign])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async updateAidCampaign(id: string, updates: Partial<AidCampaignRecord>): Promise<AidCampaignRecord> {
    const { data, error } = await this.client
      .from('aid_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async deleteAidCampaign(id: string): Promise<void> {
    const { error } = await this.client
      .from('aid_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Aid Distribution Methods
  async getAidDistributions(): Promise<AidDistributionRecord[]> {
    const { data, error } = await this.client
      .from('aid_distributions')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getAidDistributionsByFamilyId(familyId: string): Promise<AidDistributionRecord[]> {
    const { data, error } = await this.client
      .from('aid_distributions')
      .select('*')
      .eq('family_id', familyId);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getAidDistributionsByCampaignId(campaignId: string): Promise<AidDistributionRecord[]> {
    const { data, error } = await this.client
      .from('aid_distributions')
      .select('*')
      .eq('campaign_id', campaignId);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async createAidDistribution(distribution: Omit<AidDistributionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AidDistributionRecord> {
    const { data, error } = await this.client
      .from('aid_distributions')
      .insert([distribution])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async updateAidDistribution(id: string, updates: Partial<AidDistributionRecord>): Promise<AidDistributionRecord> {
    const { data, error } = await this.client
      .from('aid_distributions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  // Inventory Item Methods
  async getInventoryItems(): Promise<InventoryItemRecord[]> {
    const { data, error } = await this.client
      .from('inventory_items')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getInventoryItemById(id: string): Promise<InventoryItemRecord | null> {
    const { data, error } = await this.client
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(error.message);
    }

    return data || null;
  }

  async createInventoryItemRecord(item: Omit<InventoryItemRecord, 'id' | 'quantity_available' | 'quantity_reserved' | 'created_at' | 'updated_at'>): Promise<InventoryItemRecord> {
    const { data, error } = await this.client
      .from('inventory_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItemRecord>): Promise<InventoryItemRecord> {
    const { data, error } = await this.client
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await this.client
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Inventory Transaction Methods
  async getInventoryTransactions(): Promise<InventoryTransactionRecord[]> {
    const { data, error } = await this.client
      .from('inventory_transactions')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getInventoryTransactionsByItemId(itemId: string): Promise<InventoryTransactionRecord[]> {
    const { data, error } = await this.client
      .from('inventory_transactions')
      .select('*')
      .eq('item_id', itemId);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async createInventoryTransaction(transaction: Omit<InventoryTransactionRecord, 'id' | 'created_at'>): Promise<InventoryTransactionRecord> {
    const { data, error } = await this.client
      .from('inventory_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  // Inventory Audit Methods
  async getInventoryAudits(): Promise<InventoryAuditRecord[]> {
    const { data, error } = await this.client
      .from('inventory_audits')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getInventoryAuditsByItemId(itemId: string): Promise<InventoryAuditRecord[]> {
    const { data, error } = await this.client
      .from('inventory_audits')
      .select('*')
      .eq('item_id', itemId);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async createInventoryAudit(audit: Omit<InventoryAuditRecord, 'id' | 'created_at'>): Promise<InventoryAuditRecord> {
    const { data, error } = await this.client
      .from('inventory_audits')
      .insert([audit])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  // Security and Audit Functions

  async logSecurityEvent(event: Omit<SecurityLogRecord, 'id' | 'created_at'>): Promise<SecurityLogRecord> {
    const { data, error } = await this.client
      .from('security_logs')
      .insert([event])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async getSecurityEvents(
    eventType?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical',
    fromDate?: string,
    toDate?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SecurityLogRecord[]> {
    let query = this.client
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async logFailedLoginAttempt(attempt: Omit<FailedLoginAttemptRecord, 'id' | 'attempted_at'>): Promise<FailedLoginAttemptRecord> {
    const { data, error } = await this.client
      .from('failed_login_attempts')
      .insert([attempt])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }

  async getRecentFailedAttempts(ipAddress: string, minutes: number = 15): Promise<FailedLoginAttemptRecord[]> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutes);

    const { data, error } = await this.client
      .from('failed_login_attempts')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('attempted_at', since.toISOString())
      .order('attempted_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async markRecordAsDeleted(
    tableName: string,
    recordId: string,
    deletedByUserId: string,
    recordData: any
  ): Promise<void> {
    const { error } = await this.client
      .from('soft_deletes')
      .insert([{
        table_name: tableName,
        record_id: recordId,
        deleted_data: recordData,
        deleted_by_user_id: deletedByUserId
      }]);

    if (error) {
      throw new Error(error.message);
    }
  }

  async restoreDeletedRecord(deleteRecordId: string, restorationReason: string): Promise<void> {
    const { data: deleteRecord, error: fetchError } = await this.client
      .from('soft_deletes')
      .select('*')
      .eq('id', deleteRecordId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!deleteRecord) {
      throw new Error('Delete record not found');
    }

    // In a real implementation, we would restore the record to its original table
    // For now, we'll just update the restoration info
    const { error } = await this.client
      .from('soft_deletes')
      .update({
        restored_at: new Date().toISOString(),
        restoration_reason: restorationReason
      })
      .eq('id', deleteRecordId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getSoftDeletedRecords(tableName?: string, limit: number = 50, offset: number = 0): Promise<SoftDeleteRecord[]> {
    let query = this.client
      .from('soft_deletes')
      .select('*')
      .order('deleted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getIndividualById(id: string): Promise<IndividualRecord | null> {
    const { data, error } = await this.client
      .from('individuals')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data;
  }

  async updateIndividual(id: string, record: Partial<IndividualRecord>): Promise<IndividualRecord> {
    const { data, error } = await this.client
      .from('individuals')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data!;
  }
}

export const supabaseService = new SupabaseService();