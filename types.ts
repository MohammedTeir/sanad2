
export enum Role {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CAMP_MANAGER = 'CAMP_MANAGER',
  FIELD_OFFICER = 'FIELD_OFFICER',
  BENEFICIARY = 'BENEFICIARY',
  DONOR_OBSERVER = 'DONOR_OBSERVER'
}

export type MaritalStatus = 'أعزب' | 'متزوج' | 'أرمل' | 'مطلق' | 'أسرة هشة';
export type Gender = 'ذكر' | 'أنثى';
export type RelationType = 'الابن' | 'البنت' | 'الجد' | 'الجدة' | 'الحفيد' | 'الحفيدة' | 'العم' | 'العمة' | 'الخال' | 'الخالة' | 'ابن الأخ' | 'ابنة الأخ' | 'ابن العم' | 'أخرى';
export type DisabilityType = 'لا يوجد' | 'حركية' | 'بصرية' | 'سمعية' | 'ذهنية' | 'أخرى';
export type DisabilitySeverity = 'بسيطة' | 'متوسطة' | 'شديدة' | 'كلية';
export type ChronicDiseaseType = 'لا يوجد' | 'سكري' | 'ضغط دم' | 'قلب' | 'سرطان' | 'ربو' | 'فشل كلوي' | 'مرض نفسي' | 'أخرى';
export type WarInjuryType = 'لا يوجد' | 'بتر' | 'كسر' | 'شظية' | 'حرق' | 'رأس/وجه' | 'عمود فقري' | 'أخرى';
export type HousingType = 'خيمة' | 'بيت إسمنتي' | 'شقة' | 'أخرى';
export type MonthlyIncomeRange = 'بدون دخل' | 'أقل من 100' | '100-300' | '300-500' | 'أكثر من 500';
export type WidowReasonExpanded = 'شهيد' | 'وفاة طبيعية' | 'حادث' | 'مرض' | 'غير ذلك';
export type EducationStage = 'لا يدرس' | 'ابتدائي' | 'إعدادي/ثانوي' | 'جامعي' | 'أخرى';
export type RefugeeResidentResidenceType = 'لاجئ' | 'مقيم نظامي' | 'أخرى';
export type SanitaryFacilitiesType = 'نعم (دورة مياه خاصة)' | 'لا (مرافق مشتركة)';
export type WaterSourceType = 'شبكة عامة' | 'صهاريج' | 'آبار' | 'آخر';
export type ElectricitySourceType = 'شبكة عامة' | 'مولد' | 'طاقة شمسية' | 'لا يوجد' | 'آخر';
export type MedicalFollowupFrequency = 'يومي' | 'أسبوعي' | 'شهري';
// ⚠️  DISABLED: VulnerabilityPriority - Vulnerability score system disabled
// @deprecated Vulnerability score system is disabled
export type VulnerabilityPriority = 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض';
export type ApprovalStatus = 'قيد الانتظار' | 'موافق' | 'مرفوض';
export type TransferStatus = 'قيد الانتظار' | 'موافق' | 'مرفوض' | 'تمت المعالجة';
export type ComplaintStatus = 'جديد' | 'قيد المراجعة' | 'تم الرد' | 'مغلق';
export type EmergencyReportStatus = 'جديد' | 'قيد المعالجة' | 'تم التحويل' | 'تم الحل' | 'مرفوض';
export type UrgencyLevel = 'عاجل جداً' | 'عاجل' | 'عادي';
export type HousingOwnershipType = 'ملك' | 'إيجار';
export type HousingSharingStatus = 'سكن فردي' | 'سكن مشترك';
export type HousingDetailedType = 'خيمة فردية' | 'خيمة مشتركة' | 'منزل كامل' | 'غرفة في منزل' | 'شقة مفروشة' | 'شقة غير مفروشة' | 'كارافان' | 'آخر';
export type BackupFrequency = 'يومي' | 'أسبوعي' | 'شهري';
export type OperationScope = 'كامل' | 'جزئي' | 'خاص بالمخيم';
export type OperationStatus = 'قيد المعالجة' | 'مكتمل' | 'فشل';
export type OperationType = 'نسخة احتياطية' | 'مزامنة' | 'استعادة';
export type ImportExportOperationType = 'استيراد' | 'تصدير';
export type CampStatus = 'نشط' | 'قيد الانتظار' | 'ممتلئ';
export type AidCampaignStatus = 'مخططة' | 'نشطة' | 'مكتملة' | 'ملغاة';
export type DistributionStatus = 'تم التسليم' | 'قيد الانتظار';
export type InventoryTransactionType = 'وارد' | 'صادر';
export type InventoryTransactionRelatedTo = 'شراء' | 'تبرع' | 'توزيع' | 'تحويل' | 'تعديل' | 'تلف';
export type InventoryAuditReason = 'نقص' | 'فائض' | 'سرقة' | 'تلف' | 'خطأ عد' | 'أخرى';

export interface FieldPermission {
  field_name: string;
  is_editable: boolean;
  updated_at?: string;
}

export interface FamilyMember {
  id: string;
  // 4-part name structure (مigrated from single name field)
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
  // Computed full name for display (backward compatibility)
  name: string; // Computed: `${firstName} ${fatherName} ${grandfatherName} ${familyName}`
  nationalId?: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  relation: RelationType;
  // Education & Work
  isStudying?: boolean;
  isWorking?: boolean;
  educationStage?: EducationStage;
  educationLevel?: EducationStage;
  occupation?: string;
  phoneNumber?: string;
  // Marital Status
  maritalStatus: MaritalStatus;
  // Health - Disability
  disabilityType: DisabilityType;
  disabilitySeverity?: DisabilitySeverity;
  disabilityDetails?: string;
  // Health - Chronic Disease
  chronicDiseaseType: ChronicDiseaseType;
  chronicDiseaseDetails?: string;
  // Health - War Injury
  hasWarInjury: boolean;
  warInjuryType: WarInjuryType;
  warInjuryDetails?: string;
  // Medical Follow-up
  medicalFollowupRequired: boolean;
  medicalFollowupFrequency?: MedicalFollowupFrequency;
  medicalFollowupDetails?: string;
  // Soft Delete (for internal use)
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface DPProfile {
  id: string;
  // 4-part name structure for head of family (مigrated from single headOfFamily field)
  headFirstName: string;
  headFatherName: string;
  headGrandfatherName: string;
  headFamilyName: string;
  // Computed full name for display (backward compatibility)
  headOfFamily: string; // Computed: `${headFirstName} ${headFatherName} ${headGrandfatherName} ${headFamilyName}`

  // Head of Family - National ID (required, unique)
  nationalId: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  maritalStatus: MaritalStatus;
  widowReason?: WidowReasonExpanded;
  headRole?: 'أب' | 'أم' | 'زوجة';
  
  // Head of Family - Work & Income
  isWorking: boolean;
  job: string;
  monthlyIncome?: number;
  monthlyIncomeRange?: MonthlyIncomeRange;
  
  // Head of Family - Contact
  phoneNumber: string;
  phoneSecondary?: string;
  
  // Head of Family - Health: Disability
  disabilityType: DisabilityType;
  disabilitySeverity?: DisabilitySeverity;
  disabilityDetails?: string;
  
  // Head of Family - Health: Chronic Disease
  chronicDiseaseType: ChronicDiseaseType;
  chronicDiseaseDetails?: string;
  
  // Head of Family - Health: War Injury
  warInjuryType: WarInjuryType;
  warInjuryDetails?: string;
  
  // Head of Family - Medical Follow-up
  medicalFollowupRequired: boolean;
  medicalFollowupFrequency?: MedicalFollowupFrequency;
  medicalFollowupDetails?: string;
  
  // Wife Fields
  wifeName?: string;
  wifeNationalId?: string;
  wifeDateOfBirth?: string;
  wifeAge?: number; // Auto-calculated from wifeDateOfBirth
  wifeIsPregnant: boolean;
  wifePregnancyMonth?: number;
  // Pregnancy special needs (Migration 016)
  wifePregnancySpecialNeeds?: boolean;
  wifePregnancyFollowupDetails?: string;
  // Wife - Work
  wifeIsWorking?: boolean;
  wifeOccupation?: string;
  // Wife - Medical Follow-up
  wifeMedicalFollowupRequired: boolean;
  wifeMedicalFollowupFrequency?: MedicalFollowupFrequency;
  wifeMedicalFollowupDetails?: string;
  // Wife - Health: Disability
  wifeDisabilityType?: DisabilityType;
  wifeDisabilitySeverity?: DisabilitySeverity;
  wifeDisabilityDetails?: string;
  // Wife - Health: Chronic Disease
  wifeChronicDiseaseType?: ChronicDiseaseType;
  wifeChronicDiseaseDetails?: string;
  // Wife - Health: War Injury
  wifeWarInjuryType?: WarInjuryType;
  wifeWarInjuryDetails?: string;

  // Husband fields (for female-headed households)
  husbandName?: string;
  husbandNationalId?: string;
  husbandDateOfBirth?: string;
  husbandAge?: number; // Auto-calculated
  husbandIsWorking?: boolean;
  husbandOccupation?: string;
  husbandMedicalFollowupRequired?: boolean;
  husbandMedicalFollowupFrequency?: MedicalFollowupFrequency;
  husbandMedicalFollowupDetails?: string;
  husbandDisabilityType?: DisabilityType;
  husbandDisabilitySeverity?: DisabilitySeverity;
  husbandDisabilityDetails?: string;
  husbandChronicDiseaseType?: ChronicDiseaseType;
  husbandChronicDiseaseDetails?: string;
  husbandWarInjuryType?: WarInjuryType;
  husbandWarInjuryDetails?: string;
  members: FamilyMember[];
  
  // Family Statistics (auto-calculated)
  totalMembersCount: number;
  maleCount: number;
  femaleCount: number;
  childCount: number; // < 12 years
  teenagerCount: number; // 12-17 years
  adultCount: number; // 18-59 years
  seniorCount: number; // 60+ years
  disabledCount: number;
  chronicCount: number;
  injuredCount: number;
  medicalFollowupCount: number;
  pregnantWomenCount: number;
  
  // Original Housing (Before Displacement) - Section 5.1
  originalAddress: {
    governorate: string;
    region: string;
    details: string;
    housingType: HousingOwnershipType;
  };
  
  // Current Housing (In Camp) - Section 5.2 - Enhanced
  currentHousing: {
    type: HousingType;
    campId: string;
    unitNumber?: string;
    isSuitableForFamilySize: boolean;
    
    // Sanitary facilities
    sanitaryFacilities?: SanitaryFacilitiesType;
    sanitaryConditions?: string; // Legacy field for backward compatibility
    
    // Utilities
    waterSource?: WaterSourceType;
    electricityAccess?: ElectricitySourceType;
    
    // Geographic location
    governorate?: string;
    region?: string;
    landmark: string;
    
    // Enhanced housing fields (Migration 016)
    sharingStatus?: HousingSharingStatus; // سكن فردي / سكن مشترك
    detailedType?: HousingDetailedType; // 8 detailed types
    furnished?: boolean; // For apartments
  };
  
  // Refugee/Resident Outside Country - Section 5.3
  refugeeResidentAbroad?: {
    country: string;
    city?: string;
    residenceType?: RefugeeResidentResidenceType;
  };

  // ⚠️  DISABLED: Vulnerability Assessment - Vulnerability score system disabled
  // These fields are kept for backward compatibility but are no longer populated
  // @deprecated Vulnerability score system is disabled
  vulnerabilityScore: number; // Always returns 0
  // @deprecated Vulnerability score system is disabled
  vulnerabilityPriority: VulnerabilityPriority | null; // Always returns null
  // @deprecated Vulnerability score system is disabled
  vulnerabilityBreakdown?: {
    [key: string]: number;
  } | null; // Always returns null
  vulnerabilityReason?: string;
  
  // Administrative fields
  nominationBody?: string;
  adminNotes?: string;
  
  // Document URLs
  idCardUrl?: string;
  medicalReportUrl?: string;
  signatureUrl?: string;
  
  // Flat housing fields for direct form binding (backward compatibility)
  originalAddressGovernorate?: string;
  originalAddressRegion?: string;
  originalAddressDetails?: string;
  originalAddressHousingType?: string;
  currentHousingType?: string;
  currentHousingIsSuitable?: boolean;
  currentHousingSanitaryFacilities?: SanitaryFacilitiesType | string;
  currentHousingSanitaryConditions?: string;
  currentHousingWaterSource?: WaterSourceType | string;
  currentHousingElectricityAccess?: ElectricitySourceType | string;
  currentHousingGovernorate?: string;
  currentHousingRegion?: string;
  currentHousingLandmark?: string;
  currentHousingSharingStatus?: HousingSharingStatus | string;
  currentHousingDetailedType?: HousingDetailedType;
  currentHousingFurnished?: boolean;

  // Status field
  registrationStatus?: ApprovalStatus;
  
  // Soft delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  
  // Timestamps
  registeredDate: string;
  lastUpdated: string;

  aidHistory: AidTransaction[];
  
  // Camp information (for display)
  campId?: string;
  campInfo?: CampInfo;
}

export interface Camp {
  id: string;
  name: string;
  
  // Location coordinates
  location_lat?: number;
  location_lng?: number;
  
  // Location object (for backward compatibility)
  location: {
    lat: number;
    lng: number;
    address: string;
    governorate: string;  // Governorate/Province
    area: string;         // Area/Neighborhood/District
  };
  
  // Location fields (flat)
  location_address?: string;
  location_governorate?: string;
  location_area?: string;

  managerName: string;
  manager_name?: string; // snake_case version
  status: CampStatus; // 'نشط' | 'قيد الانتظار' | 'ممتلئ'
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AidTransaction {
  id: string;
  dpId: string;
  aidType: string;
  aidCategory: string; // Flexible categories
  quantity: number;
  date: string;
  distributedBy: string;
  notes?: string;
  campaignId?: string;
  receivedBySignature?: string;
  receivedByBiometric?: string;
  receivedByPhoto?: string;
  otpCode?: string;
  duplicateCheckPassed: boolean;
  status: DistributionStatus; // 'تم التسليم' | 'قيد الانتظار'
}

export interface AidCampaign {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  start_date?: string; // snake_case
  endDate?: string;
  end_date?: string; // snake_case
  status: AidCampaignStatus; // 'مخططة' | 'نشطة' | 'مكتملة' | 'ملغاة'
  aidType: string;
  aid_type?: string; // snake_case
  aidCategory: string; // Flexible custom categories
  aid_category?: string; // snake_case
  
  // Target families
  targetFamilies?: string[];
  target_families?: string[]; // snake_case
  
  // Distributed to
  distributedTo?: string[];
  distributed_to?: string[]; // snake_case
  
  // Coordinator
  coordinator?: string;
  coordinatorUserId?: string;
  coordinator_user_id?: string; // snake_case
  
  // Link to inventory item (NEW)
  inventoryItemId?: string;
  inventory_item_id?: string; // snake_case
  
  // Camp association
  campId?: string;
  camp_id?: string; // snake_case
  
  notes?: string;
  createdAt?: string;
  created_at?: string; // snake_case
  updatedAt?: string;
  updated_at?: string; // snake_case
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // Custom category - predefined + custom values
  unit: string; // Measurement unit (قطعة, كيلوغرام, etc.)
  
  // Quantity fields
  quantityAvailable: number;
  quantity_available?: number; // snake_case
  quantityReserved: number;
  quantity_reserved?: number; // snake_case
  quantityAllocated?: number;
  quantity_allocated?: number; // snake_case
  
  // Stock thresholds
  minStock?: number;
  min_stock?: number; // snake_case - Minimum stock threshold (reorder point)
  maxStock?: number;
  max_stock?: number; // snake_case - Maximum stock capacity
  minAlertThreshold?: number;
  min_alert_threshold?: number; // snake_case - Threshold for low stock alerts
  
  // Expiry and donor
  expiryDate?: string;
  expiry_date?: string; // snake_case
  donor?: string;
  receivedDate?: string;
  received_date?: string; // snake_case
  
  // Metadata
  notes?: string;
  isActive?: boolean;
  is_active?: boolean; // snake_case
  isDeleted?: boolean;
  is_deleted?: boolean; // snake_case
  deletedAt?: string;
  deleted_at?: string; // snake_case
  
  // Camp association
  campId?: string;
  camp_id?: string; // snake_case
  
  // Timestamps
  createdAt?: string;
  created_at?: string; // snake_case
  updatedAt?: string;
  updated_at?: string; // snake_case
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType; // 'وارد' | 'صادر'
  quantity: number;
  relatedTo: InventoryTransactionRelatedTo; // 'شراء' | 'تبرع' | 'توزيع' | 'تحويل' | 'تعديل' | 'تلف'
  relatedId?: string;
  notes?: string;
  processedBy: string;
  processedAt: string;
  createdAt: string;
}

export interface InventoryAudit {
  id: string;
  itemId: string;
  physicalCount: number;
  systemCount: number;
  difference: number;
  reason: InventoryAuditReason; // 'نقص' | 'فائض' | 'سرقة' | 'تلف' | 'خطأ عد' | 'أخرى'
  notes?: string;
  auditedBy: string;
  auditedAt: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password_hash?: string; // For API requests (never returned)
  firstName?: string;
  first_name?: string; // snake_case
  lastName?: string;
  last_name?: string; // snake_case
  role: Role;
  campId?: string;
  camp_id?: string; // snake_case
  familyId?: string;
  family_id?: string; // snake_case
  phoneNumber?: string;
  phone_number?: string; // snake_case
  isActive?: boolean;
  is_active?: boolean; // snake_case
  lastLogin?: string;
  last_login?: string; // snake_case
  createdAt?: string;
  created_at?: string; // snake_case
  updatedAt?: string;
  updated_at?: string; // snake_case
}

export interface SystemConfig {
  // Vulnerability weights (stored in global_config table)
  vulnerability_weights?: {
    disabilityWeight: number;
    chronicDiseaseWeight: number;
    warInjuryWeight: number;
    pregnancyWeight: number;
    elderlyWeight: number;
    childrenWeight: number;
    femaleHeadWeight: number;
  };
  
  // Security settings
  security_settings?: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    maintenanceMode: boolean;
    passwordMinLength: number;
    requireSpecialChars: boolean;
  };
  
  // AI settings
  ai_settings?: {
    geminiApiKey: string;
    enabled: boolean;
    model: string;
  };
  
  // General settings
  general_settings?: {
    publicRegistrationEnabled: boolean;
    autoSyncEnabled: boolean;
    backupFrequency: BackupFrequency; // 'يومي' | 'أسبوعي' | 'شهري'
    timezone: string;
    language: string;
  };
  
  // Notification settings
  notification_settings?: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
}


export interface TransferRequest {
  id: string;
  dpId: string;
  dpName: string;
  fromCampId: string;
  toCampId: string;
  status: TransferStatus; // 'قيد الانتظار' | 'موافق' | 'مرفوض' | 'تمت المعالجة'
  date: string;
  reason: string;
}

export interface Complaint {
  id: string;
  familyId: string;
  familyName?: string;
  headOfFamilyNationalId?: string;
  subject: string;
  description: string;
  category: string;
  isAnonymous: boolean;
  status: ComplaintStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  restorationReason?: string;
}

export interface EmergencyReport {
  id: string;
  familyId: string;
  familyName?: string;
  headOfFamilyNationalId?: string;
  emergencyType: string;
  description: string;
  urgency: UrgencyLevel;
  location?: string;
  status: EmergencyReportStatus;
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  restorationReason?: string;
}

export interface CampInfo {
  id: string;
  name: string;
  location: {
    governorate: string;
    area: string;
    address: string;
  };
  managerName: string;
  managerContact?: string;
  capacity: number;
  currentPopulation: number;
  status: CampStatus;
}

export interface Notification {
  id: string;
  familyId: string;
  type: 'distribution' | 'complaint_response' | 'transfer_update' | 'system' | 'update_reminder';
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  readAt?: string;
}

export interface SpecialAssistanceRequest {
  id: string;
  familyId: string;
  assistanceType: 'طبية' | 'مالية' | 'سكنية' | 'تعليمية' | 'أخرى';
  description: string;
  urgency: 'عاجل جداً' | 'عاجل' | 'عادي';
  status: 'جديد' | 'قيد المراجعة' | 'تمت الموافقة' | 'مرفوض' | 'تم التنفيذ';
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionRecord extends AidTransaction {
  campaignName?: string;
  distributedByUser?: string;
  campName?: string;
}
