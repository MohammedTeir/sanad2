// views/beneficiary/DPPortal.tsx
// Beneficiary DP Details Portal - Modern Bento Grid Dashboard
// Features: Glassmorphism header, Bento Grid layout, Mobile-first design

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { beneficiaryService } from '../../services/beneficiaryService';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import FileUpload from '../../components/FileUpload';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';
import type { 
  FamilyMember, 
  CampInfo, 
  Notification, 
  SpecialAssistanceRequest, 
  DistributionRecord,
  Complaint,
  EmergencyReport,
  ComplaintStatus,
  EmergencyReportStatus,
  UrgencyLevel
} from '../../types';

// ============================================================================
// ICONS - Inline SVG components (no external dependencies)
// ============================================================================
const Icons = {
  User: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Users: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Home: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Activity: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Phone: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  MapPin: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Heart: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Save: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Edit: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Clipboard: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Baby: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Alert: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Plus: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Eye: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Document: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Shield: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  LogOut: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Lock: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Bell: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Package: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Repeat: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Hand: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
  Chart: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Building: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

// ============================================================================
// INTERFACES
// ============================================================================
interface DPProfile {
  id: string;
  // 4-part name structure (Migration 015)
  headFirstName?: string;
  headFatherName?: string;
  headGrandfatherName?: string;
  headFamilyName?: string;
  headOfFamily: string;
  nationalId: string;
  gender: 'ذكر' | 'أنثى';
  dateOfBirth: string;
  age: number;
  maritalStatus: string;
  widowReason?: string;
  headRole?: 'أب' | 'أم' | 'زوجة';
  phoneNumber: string;
  phoneSecondary?: string;
  totalMembersCount: number;
  campId?: string;
  unitNumber?: string;
  registrationStatus?: 'قيد الانتظار' | 'موافق' | 'مرفوض';
  vulnerabilityPriority?: 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض';
  vulnerabilityScore?: number;
  vulnerabilityBreakdown?: { [key: string]: number };
  vulnerabilityReason?: string;
  disabilityType?: string;
  disabilitySeverity?: string;
  disabilityDetails?: string;
  chronicDiseaseType?: string;
  chronicDiseaseDetails?: string;
  warInjuryType?: string;
  warInjuryDetails?: string;
  medicalFollowupRequired?: boolean;
  medicalFollowupFrequency?: string;
  medicalFollowupDetails?: string;

  // Head of family work and income
  isWorking?: boolean;
  job?: string;
  monthlyIncome?: number;
  monthlyIncomeRange?: string;

  wifeName?: string;
  wifeNationalId?: string;
  wifeDateOfBirth?: string;
  wifeAge?: number;
  wifeIsPregnant?: boolean;
  wifePregnancyMonth?: number;
  wifePregnancySpecialNeeds?: boolean;
  wifePregnancyFollowupDetails?: string;
  wifeIsWorking?: boolean;
  wifeOccupation?: string;
  wifeMedicalFollowupRequired?: boolean;
  wifeMedicalFollowupFrequency?: string;
  wifeMedicalFollowupDetails?: string;
  wifeDisabilityType?: string;
  wifeDisabilitySeverity?: string;
  wifeDisabilityDetails?: string;
  wifeChronicDiseaseType?: string;
  wifeChronicDiseaseDetails?: string;
  wifeWarInjuryType?: string;
  wifeWarInjuryDetails?: string;

  husbandName?: string;
  husbandNationalId?: string;
  husbandDateOfBirth?: string;
  husbandAge?: number;
  husbandIsWorking?: boolean;
  husbandOccupation?: string;
  husbandMedicalFollowupRequired?: boolean;
  husbandMedicalFollowupFrequency?: string;
  husbandMedicalFollowupDetails?: string;
  husbandDisabilityType?: string;
  husbandDisabilitySeverity?: string;
  husbandChronicDiseaseType?: string;
  husbandWarInjuryType?: string;

  idCardUrl?: string;
  medicalReportUrl?: string;
  signatureUrl?: string;

  originalAddressGovernorate?: string;
  originalAddressRegion?: string;
  originalAddressDetails?: string;
  originalAddressHousingType?: string;

  currentHousingType?: string;
  currentHousingIsSuitable?: boolean;
  currentHousingSanitaryFacilities?: 'نعم (دورة مياه خاصة)' | 'لا (مرافق مشتركة)';
  currentHousingWaterSource?: 'شبكة عامة' | 'صهاريج' | 'آبار' | 'آخر';
  currentHousingElectricityAccess?: 'شبكة عامة' | 'مولد' | 'طاقة شمسية' | 'لا يوجد' | 'آخر';
  currentHousingGovernorate?: string;
  currentHousingRegion?: string;
  currentHousingLandmark?: string;
  currentHousingSharingStatus?: 'سكن فردي' | 'سكن مشترك';
  currentHousingDetailedType?: string;
  currentHousingFurnished?: boolean;

  isResidentAbroad?: boolean;
  refugeeResidentAbroadCountry?: string;
  refugeeResidentAbroadCity?: string;
  refugeeResidentAbroadResidenceType?: string;

  maleCount?: number;
  femaleCount?: number;
  childCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  seniorCount?: number;
  disabledCount?: number;
  injuredCount?: number;
  pregnantWomenCount?: number;

  adminNotes?: string;
  nominationBody?: string;

  registeredDate?: string;
  lastUpdated?: string;
  members?: any[];
  aidHistory?: any[];
}

const FIELD_NAME_TRANSLATIONS: { [key: string]: string } = {
  'head_first_name': 'الاسم الأول',
  'head_father_name': 'اسم الأب',
  'head_grandfather_name': 'اسم الجد',
  'head_family_name': 'اسم العائلة',
  'national_id': 'الرقم الوطني',
  'gender': 'الجنس',
  'date_of_birth': 'تاريخ الميلاد',
  'marital_status': 'الحالة الاجتماعية',
  'widow_reason': 'سبب الوفاة',
  'head_role': 'صفة رب الأسرة',
  'phone_number': 'رقم الهاتف',
  'phone_secondary': 'رقم الهاتف البديل',
  'disability_type': 'نوع الإعاقة',
  'disability_severity': 'درجة الإعاقة',
  'disability_details': 'تفاصيل الإعاقة',
  'chronic_disease_type': 'المرض المزمن',
  'chronic_disease_details': 'تفاصيل المرض المزمن',
  'war_injury_type': 'إصابة الحرب',
  'war_injury_details': 'تفاصيل إصابة الحرب',
  'medical_followup_required': 'المتابعة الطبية مطلوبة',
  'medical_followup_frequency': 'تكرار المتابعة الطبية',
  'medical_followup_details': 'تفاصيل المتابعة الطبية',
  'is_working': 'حالة العمل',
  'job': 'الوظيفة',
  'monthly_income': 'الدخل الشهري',
  'monthly_income_range': 'نطاق الدخل الشهري',
  'wife_name': 'اسم الزوجة',
  'wife_national_id': 'الرقم الوطني للزوجة',
  'wife_date_of_birth': 'تاريخ ميلاد الزوجة',
  'wife_age': 'عمر الزوجة',
  'wife_is_pregnant': 'الزوجة حامل',
  'wife_pregnancy_month': 'شهر الحمل',
  'wife_pregnancy_special_needs': 'احتياجات خاصة للحمل',
  'wife_pregnancy_followup_details': 'تفاصيل متابعة الحمل',
  'wife_is_working': 'الزوجة تعمل',
  'wife_occupation': 'وظيفة الزوجة',
  'wife_medical_followup_required': 'الزوجة تحتاج متابعة طبية',
  'wife_medical_followup_frequency': 'تكرار المتابعة الطبية للزوجة',
  'wife_medical_followup_details': 'تفاصيل المتابعة الطبية للزوجة',
  'wife_disability_type': 'نوع إعاقة الزوجة',
  'wife_disability_severity': 'درجة إعاقة الزوجة',
  'wife_disability_details': 'تفاصيل إعاقة الزوجة',
  'wife_chronic_disease_type': 'المرض المزمن للزوجة',
  'wife_chronic_disease_details': 'تفاصيل المرض المزمن للزوجة',
  'wife_war_injury_type': 'إصابة حرب الزوجة',
  'wife_war_injury_details': 'تفاصيل إصابة حرب الزوجة',
  'husband_name': 'اسم الزوج',
  'husband_national_id': 'الرقم الوطني للزوج',
  'husband_date_of_birth': 'تاريخ ميلاد الزوج',
  'husband_age': 'عمر الزوج',
  'husband_is_working': 'الزوج يعمل',
  'husband_occupation': 'وظيفة الزوج',
  'husband_medical_followup_required': 'الزوج يحتاج متابعة طبية',
  'husband_medical_followup_frequency': 'تكرار المتابعة الطبية للزوج',
  'husband_medical_followup_details': 'تفاصيل المتابعة الطبية للزوج',
  'husband_disability_type': 'نوع إعاقة الزوج',
  'husband_disability_severity': 'درجة إعاقة الزوج',
  'husband_chronic_disease_type': 'المرض المزمن للزوج',
  'husband_war_injury_type': 'إصابة حرب الزوج',
  'original_address_governorate': 'محافظة العنوان الأصلي',
  'original_address_region': 'منطقة العنوان الأصلي',
  'original_address_details': 'تفاصيل العنوان الأصلي',
  'original_address_housing_type': 'نوع سكن العنوان الأصلي',
  'current_housing_type': 'نوع السكن الحالي',
  'current_housing_is_suitable': 'ملاءمة السكن الحالي',
  'current_housing_sanitary_facilities': 'المرافق الصحية',
  'current_housing_water_source': 'مصدر المياه',
  'current_housing_electricity_access': 'مصدر الكهرباء',
  'current_housing_governorate': 'محافظة السكن الحالي',
  'current_housing_region': 'منطقة السكن الحالي',
  'current_housing_landmark': 'علامة مميزة للسكن',
  'current_housing_sharing_status': 'حالة مشاركة السكن',
  'current_housing_detailed_type': 'نوع السكن التفصيلي',
  'current_housing_furnished': 'مفروش',
  'is_resident_abroad': 'لاجئ / مقيم بالخارج',
  'refugee_resident_abroad_country': 'الدولة',
  'refugee_resident_abroad_city': 'المدينة',
  'refugee_resident_abroad_residence_type': 'نوع الإقامة في الخارج',
  'id_card_url': 'صورة الهوية',
  'medical_report_url': 'التقرير الطبي',
  'signature_url': 'التوقيع',
  'family_members': 'إضافة/تعديل الأفراد',
  // Vulnerability breakdown fields
  'children': 'عدد الأطفال (تحت 12 سنة)',
  'seniors': 'كبار السن (فوق 60 سنة)',
  'disabilities': 'الإعاقات',
  'chronic_diseases': 'الأمراض المزمنة',
  'war_injuries': 'إصابات الحرب',
  'pregnancy': 'الحمل',
  'absence_of_provider': 'انعدام المعيل',
  'housing_type': 'نوع السكن',
  'income': 'الدخل الشهري',
  'displacement': 'عدد مرات النزوح',
  'orphans': 'الأيتام'
};

const STATUS_COLORS: { [key: string]: string } = {
  // Emergency status
  'جديد': 'bg-blue-50 text-blue-700 border-blue-200',
  'قيد المعالجة': 'bg-amber-50 text-amber-700 border-amber-200',
  'تم التحويل': 'bg-purple-50 text-purple-700 border-purple-200',
  'تم الحل': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'مرفوض': 'bg-red-50 text-red-700 border-red-200',
  // Complaint status
  'قيد المراجعة': 'bg-amber-50 text-amber-700 border-amber-200',
  'تم الرد': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'مغلق': 'bg-gray-50 text-gray-700 border-gray-200'
};

// ============================================================================
// CONSTANTS
// ============================================================================
const MARITAL_STATUS = {
  'أعزب': { label: 'أعزب', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'متزوج': { label: 'متزوج', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'مطلق': { label: 'مطلق', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'أرمل': { label: 'أرمل', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  'أسرة هشة': { label: 'أسرة هشة', color: 'bg-purple-50 text-purple-700 border-purple-200' }
};

const VULNERABILITY_LEVELS = {
  'عالي جداً': { label: 'عالي جداً', color: 'bg-red-50 text-red-700 border-red-200' },
  'عالي': { label: 'عالي', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'متوسط': { label: 'متوسط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'منخفض': { label: 'منخفض', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
};

const RELATION_TRANSLATIONS: Record<string, string> = {
  'الأب': 'الأب',
  'الأم': 'الأم',
  'الزوجة': 'الزوجة',
  'الزوج': 'الزوج',
  'الابن': 'الابن',
  'البنت': 'البنت',
  'الأخ': 'الأخ',
  'الأخت': 'الأخت',
  'الجد': 'الجد',
  'الجدة': 'الجدة',
  'الحفيد': 'الحفيد',
  'الحفيدة': 'الحفيدة',
  'العم': 'العم',
  'العمة': 'العمة',
  'الخال': 'الخال',
  'الخالة': 'الخالة',
  'ابن الأخ': 'ابن الأخ',
  'ابنة الأخ': 'ابنة الأخ',
  'ابن العم': 'ابن العم',
  'أخرى': 'أخرى'
};

const translateRelation = (relation: string): string => {
  return RELATION_TRANSLATIONS[relation] || relation;
};

const DISABILITY_TYPES: Record<string, string> = {
  'لا يوجد': 'لا يوجد',
  'حركية': 'حركية',
  'بصرية': 'بصرية',
  'سمعية': 'سمعية',
  'ذهنية': 'ذهنية',
  'أخرى': 'أخرى'
};

const DISABILITY_SEVERITY: Record<string, string> = {
  'بسيطة': 'بسيطة',
  'متوسطة': 'متوسطة',
  'شديدة': 'شديدة',
  'كلية': 'كلية'
};

const CHRONIC_DISEASE_TYPES: Record<string, string> = {
  'لا يوجد': 'لا يوجد',
  'سكري': 'سكري',
  'ضغط دم': 'ضغط دم',
  'قلب': 'قلب',
  'سرطان': 'سرطان',
  'ربو': 'ربو',
  'فشل كلوي': 'فشل كلوي',
  'مرض نفسي': 'مرض نفسي',
  'أخرى': 'أخرى'
};

const WAR_INJURY_TYPES: Record<string, string> = {
  'لا يوجد': 'لا يوجد',
  'بتر': 'بتر',
  'كسر': 'كسر',
  'شظية': 'شظية',
  'حرق': 'حرق',
  'رأس/وجه': 'رأس/وجه',
  'عمود فقري': 'عمود فقري',
  'أخرى': 'أخرى'
};

const HOUSING_DETAILED_TYPES: { [key: string]: string } = {
  'خيمة فردية': 'خيمة فردية',
  'خيمة مشتركة': 'خيمة مشتركة',
  'بيت كامل': 'بيت كامل',
  'غرفة في بيت': 'غرفة في بيت',
  'شقة مفروشة': 'شقة مفروشة',
  'شقة غير مفروشة': 'شقة غير مفروشة',
  'كارافان': 'كارافان',
  'أخرى': 'أخرى'
};

const INCOME_RANGES: { [key: string]: string } = {
  'بدون دخل': 'بدون دخل',
  'أقل من 100': 'أقل من 100',
  '100-300': '100-300',
  '300-500': '300-500',
  'أكثر من 500': 'أكثر من 500'
};

const WIDOW_REASONS: { [key: string]: string } = {
  'شهيد': 'شهيد',
  'وفاة طبيعية': 'وفاة طبيعية',
  'حادث': 'حادث',
  'مرض': 'مرض',
  'غير ذلك': 'غير ذلك'
};

const HEAD_ROLES: { [key: string]: string } = {
  'أب': 'أب (مسؤول عن جميع الأفراد والزوجة)',
  'أم': 'أم (معيلة للأطفال أو أرملة)',
  'زوجة': 'زوجة (في حال عجز الزوج أو تعدد الزوجات)'
};

const HOUSING_TYPES: { [key: string]: string } = {
  'خيمة': 'خيمة',
  'بيت إسمنتي': 'بيت إسمنتي',
  'شقة': 'شقة',
  'أخرى': 'أخرى'
};

const HOUSING_SHARING_STATUS: { [key: string]: string } = {
  'سكن فردي': 'سكن فردي',
  'سكن مشترك': 'سكن مشترك'
};

const SANITARY_FACILITIES: { [key: string]: string } = {
  'نعم (دورة مياه خاصة)': 'نعم (دورة مياه خاصة)',
  'لا (مرافق مشتركة)': 'لا (مرافق مشتركة)'
};

const WATER_SOURCES: { [key: string]: string } = {
  'شبكة عامة': 'شبكة عامة',
  'صهاريج': 'صهاريج',
  'آبار': 'آبار',
  'آخر': 'آخر'
};

const ELECTRICITY_ACCESS: { [key: string]: string } = {
  'شبكة عامة': 'شبكة عامة',
  'مولد': 'مولد',
  'طاقة شمسية': 'طاقة شمسية',
  'لا يوجد': 'لا يوجد',
  'آخر': 'آخر'
};

const RESIDENCE_TYPES: { [key: string]: string } = {
  'لاجئ': 'لاجئ',
  'مقيم نظامي': 'مقيم نظامي',
  'أخرى': 'أخرى'
};

const MEDICAL_FOLLOWUP_FREQUENCIES: { [key: string]: string } = {
  'يومي': 'يومي',
  'أسبوعي': 'أسبوعي',
  'شهري': 'شهري'
};

const TABS = [
  { id: 'basic', label: 'بطاقة الهوية', icon: Icons.User },
  { id: 'family', label: 'بيانات الأسرة', icon: Icons.Users },
  { id: 'housing', label: 'معلومات السكن', icon: Icons.Home },
  { id: 'health', label: 'الحالة الصحية', icon: Icons.Heart },
  { id: 'spouse', label: 'معلومات الزوج/ة', icon: Icons.Baby },
  { id: 'documents', label: 'الوثائق والمستندات', icon: Icons.Clipboard },
  { id: 'distributions', label: 'سجل التوزيع', icon: Icons.Package },
  { id: 'notifications', label: 'الإشعارات', icon: Icons.Bell },
  { id: 'emergency', label: 'الطوارئ', icon: Icons.Alert },
  { id: 'complaints', label: 'الشكاوى', icon: Icons.Document },
  { id: 'settings', label: 'الإعدادات', icon: Icons.Shield },
] as const;

type TabId = typeof TABS[number]['id'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const getFullName = (dp: DPProfile): string => {
  if (dp.headFirstName && dp.headFatherName && dp.headGrandfatherName && dp.headFamilyName) {
    return `${dp.headFirstName} ${dp.headFatherName} ${dp.headGrandfatherName} ${dp.headFamilyName}`;
  }
  return dp.headOfFamily;
};

const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// Helper functions to determine if head is female or male
const isFemaleHead = (headRole?: string, gender?: string) => {
  return headRole === 'أم' || headRole === 'زوجة' || gender === 'أنثى';
};

const isMaleHead = (headRole?: string, gender?: string) => {
  return headRole === 'أب' || gender === 'ذكر';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface DPPortalProps {
  onLogout?: () => void;
}

const DPPortal: React.FC<DPPortalProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [dp, setDp] = useState<DPProfile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [showDeleteComplaintConfirm, setShowDeleteComplaintConfirm] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(null);
  const [showDeleteReportConfirm, setShowDeleteReportConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState<DPProfile | null>(null);
  const [originalData, setOriginalData] = useState<DPProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editableFamilyMembers, setEditableFamilyMembers] = useState<FamilyMember[]>([]);
  
  // Member modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [tempMember, setTempMember] = useState<Partial<FamilyMember>>({});
  const [showViewMemberModal, setShowViewMemberModal] = useState(false);
  const [viewingMemberIndex, setViewingMemberIndex] = useState<number | null>(null);
  
  // Delete member confirmation state
  const [showDeleteMemberConfirm, setShowDeleteMemberConfirm] = useState(false);
  const [memberIndexToDelete, setMemberIndexToDelete] = useState<number | null>(null);

  // Housing dropdown states
  const [selectedOrigGovernorate, setSelectedOrigGovernorate] = useState<string>('');
  const [selectedOrigArea, setSelectedOrigArea] = useState<string>('');
  const [availableOrigAreas, setAvailableOrigAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);
  const [selectedCurrentGovernorate, setSelectedCurrentGovernorate] = useState<string>('');
  const [selectedCurrentArea, setSelectedCurrentArea] = useState<string>('');
  const [availableCurrentAreas, setAvailableCurrentAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

  // Logout states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Field permissions
  const [fieldPermissions, setFieldPermissions] = useState<{[key: string]: boolean}>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Emergency and Complaints states
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tabLoading, setTabLoading] = useState<{ [key: string]: boolean }>({});
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // New states for distributions, notifications, camp info, and special assistance
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [campInfo, setCampInfo] = useState<CampInfo | null>(null);
  const [specialAssistanceRequests, setSpecialAssistanceRequests] = useState<SpecialAssistanceRequest[]>([]);
  const [showSpecialAssistanceModal, setShowSpecialAssistanceModal] = useState(false);
  const [showTransferRequestModal, setShowTransferRequestModal] = useState(false);
  const [showVulnerabilityBreakdown, setShowVulnerabilityBreakdown] = useState(false);
  const [vulnerabilityBreakdown, setVulnerabilityBreakdown] = useState<{ [key: string]: number }>({});
  const [loadingCampInfo, setLoadingCampInfo] = useState(false);

  // Form states for new modals
  const [specialAssistanceForm, setSpecialAssistanceForm] = useState({
    assistanceType: 'طبية' as 'طبية' | 'مالية' | 'سكنية' | 'تعليمية' | 'أخرى',
    description: '',
    urgency: 'عادي' as 'عاجل جداً' | 'عاجل' | 'عادي'
  });
  const [transferRequestForm, setTransferRequestForm] = useState({
    toCampId: '',
    reason: ''
  });
  const [availableCamps, setAvailableCamps] = useState<any[]>([]);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);

  // Form states for modals
  const [emergencyForm, setEmergencyForm] = useState({
    emergencyType: '',
    description: '',
    urgency: 'عادي' as 'عاجل جداً' | 'عاجل' | 'عادي',
    location: ''
  });
  const [complaintForm, setComplaintForm] = useState({
    subject: '',
    description: '',
    category: 'عام' as 'عام' | 'صحي' | 'أمن' | 'مرافق' | 'أخرى',
    isAnonymous: false
  });

  // Ref to prevent duplicate API calls in Strict Mode (development)
  const dataLoadedRef = React.useRef(false);
  // Refs for caching tab data to prevent excessive API calls
  const distributionHistoryLoadedRef = useRef<{ timestamp: number; data: DistributionRecord[] } | null>(null);
  const notificationsLoadedRef = useRef<{ timestamp: number; data: Notification[] } | null>(null);
  const campInfoLoadedRef = useRef<{ timestamp: number; data: CampInfo | null } | null>(null);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  
  // Check if cached data is still valid
  const isCacheValid = (cachedData: { timestamp: number } | null) => {
    return cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION);
  };

  // Load data on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!dataLoadedRef.current) {
      loadDP();
      loadFamilyMembers();
      loadFieldPermissions();
      dataLoadedRef.current = true;
    }
    return () => {
      // Cleanup: reset ref on unmount
      dataLoadedRef.current = false;
    };
  }, []);

  // Update areas when governorate changes
  useEffect(() => {
    if (editableData?.originalAddressGovernorate) {
      const areas = getAreasByGovernorate(editableData.originalAddressGovernorate);
      setAvailableOrigAreas(areas);
      setSelectedOrigArea('');
    }
  }, [editableData?.originalAddressGovernorate]);

  useEffect(() => {
    if (editableData?.currentHousingGovernorate) {
      const areas = getAreasByGovernorate(editableData.currentHousingGovernorate);
      setAvailableCurrentAreas(areas);
      setSelectedCurrentArea('');
    }
  }, [editableData?.currentHousingGovernorate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditMode && !isSaving) {
          handleSave();
        }
      }
      if (e.key === 'Escape') {
        if (showMemberModal) {
          setShowMemberModal(false);
        } else if (isEditMode && hasUnsavedChanges) {
          handleCancel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, isSaving, hasUnsavedChanges, showMemberModal]);

  const loadDP = async () => {
    try {
      setLoading(true);
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        setLoading(false);
        return;
      }

      const profileData: any = await beneficiaryService.getFamilyProfile(familyId);

      if (profileData) {
        const transformedData: any = {
          ...profileData,
          // 4-part name structure
          headFirstName: profileData.head_first_name ?? profileData.headFirstName,
          headFatherName: profileData.head_father_name ?? profileData.headFatherName,
          headGrandfatherName: profileData.head_grandfather_name ?? profileData.headGrandfatherName,
          headFamilyName: profileData.head_family_name ?? profileData.headFamilyName,
          // Head of family basic info
          headOfFamily: profileData.head_of_family_name ?? profileData.headOfFamily,
          nationalId: profileData.head_of_family_national_id ?? profileData.nationalId,
          gender: profileData.head_of_family_gender ?? profileData.gender,
          dateOfBirth: profileData.head_of_family_date_of_birth ?? profileData.dateOfBirth,
          age: profileData.head_of_family_age ?? profileData.age,
          maritalStatus: profileData.head_of_family_marital_status ?? profileData.maritalStatus,
          widowReason: profileData.head_of_family_widow_reason ?? profileData.widowReason,
          headRole: profileData.head_of_family_role ?? profileData.headRole,
          phoneNumber: profileData.head_of_family_phone_number ?? profileData.phoneNumber,
          phoneSecondary: profileData.head_of_family_phone_secondary ?? profileData.phoneSecondary,
          // Ensure status is always in Arabic
          registrationStatus: 
            profileData.status === 'قيد الانتظار' ? 'قيد الانتظار' : 
            profileData.status === 'موافق' ? 'موافق' : 
            profileData.status === 'مرفوض' ? 'مرفوض' : 
            'قيد الانتظار',
          // Head of family health fields
          disabilityType: profileData.head_of_family_disability_type ?? profileData.disability_type ?? profileData.disabilityType,
          disabilitySeverity: profileData.head_of_family_disability_severity ?? profileData.disability_severity ?? profileData.disabilitySeverity,
          disabilityDetails: profileData.head_of_family_disability_details ?? profileData.disability_details ?? profileData.disabilityDetails,
          chronicDiseaseType: profileData.head_of_family_chronic_disease_type ?? profileData.chronic_disease_type ?? profileData.chronicDiseaseType,
          chronicDiseaseDetails: profileData.head_of_family_chronic_disease_details ?? profileData.chronic_disease_details ?? profileData.chronicDiseaseDetails,
          warInjuryType: profileData.head_of_family_war_injury_type ?? profileData.war_injury_type ?? profileData.warInjuryType,
          warInjuryDetails: profileData.head_of_family_war_injury_details ?? profileData.war_injury_details ?? profileData.warInjuryDetails,
          medicalFollowupRequired: profileData.head_of_family_medical_followup_required ?? profileData.medical_followup_required ?? profileData.medicalFollowupRequired,
          medicalFollowupFrequency: profileData.head_of_family_medical_followup_frequency ?? profileData.medical_followup_frequency ?? profileData.medicalFollowupFrequency,
          medicalFollowupDetails: profileData.head_of_family_medical_followup_details ?? profileData.medical_followup_details ?? profileData.medicalFollowupDetails,
          // Head of family work and income
          isWorking: profileData.head_of_family_is_working ?? profileData.is_working ?? profileData.isWorking,
          job: profileData.head_of_family_job ?? profileData.job,
          monthlyIncome: profileData.head_of_family_monthly_income ?? profileData.monthly_income ?? profileData.monthlyIncome,
          monthlyIncomeRange: profileData.head_of_family_monthly_income_range ?? profileData.monthly_income_range ?? profileData.monthlyIncomeRange,
          // Wife fields
          wifeName: profileData.wife_name ?? profileData.wifeName,
          wifeNationalId: profileData.wife_national_id ?? profileData.wifeNationalId,
          wifeDateOfBirth: profileData.wife_date_of_birth ?? profileData.wifeDateOfBirth,
          wifeAge: profileData.wife_age ?? profileData.wifeAge,
          wifeIsPregnant: profileData.wife_is_pregnant ?? profileData.wifeIsPregnant,
          wifePregnancyMonth: profileData.wife_pregnancy_month ?? profileData.wifePregnancyMonth,
          wifePregnancySpecialNeeds: profileData.wife_pregnancy_special_needs ?? profileData.wifePregnancySpecialNeeds,
          wifePregnancyFollowupDetails: profileData.wife_pregnancy_followup_details ?? profileData.wifePregnancyFollowupDetails,
          wifeIsWorking: profileData.wife_is_working ?? profileData.wifeIsWorking,
          wifeOccupation: profileData.wife_occupation ?? profileData.wifeOccupation,
          wifeMedicalFollowupRequired: profileData.wife_medical_followup_required ?? profileData.wifeMedicalFollowupRequired,
          wifeMedicalFollowupFrequency: profileData.wife_medical_followup_frequency ?? profileData.wifeMedicalFollowupFrequency,
          wifeMedicalFollowupDetails: profileData.wife_medical_followup_details ?? profileData.wifeMedicalFollowupDetails,
          wifeDisabilityType: profileData.wife_disability_type ?? profileData.wifeDisabilityType,
          wifeDisabilitySeverity: profileData.wife_disability_severity ?? profileData.wifeDisabilitySeverity,
          wifeDisabilityDetails: profileData.wife_disability_details ?? profileData.wifeDisabilityDetails,
          wifeChronicDiseaseType: profileData.wife_chronic_disease_type ?? profileData.wifeChronicDiseaseType,
          wifeChronicDiseaseDetails: profileData.wife_chronic_disease_details ?? profileData.wifeChronicDiseaseDetails,
          wifeWarInjuryType: profileData.wife_war_injury_type ?? profileData.wifeWarInjuryType,
          wifeWarInjuryDetails: profileData.wife_war_injury_details ?? profileData.wifeWarInjuryDetails,
          // Husband fields
          husbandName: profileData.husband_name ?? profileData.husbandName,
          husbandNationalId: profileData.husband_national_id ?? profileData.husbandNationalId,
          husbandDateOfBirth: profileData.husband_date_of_birth ?? profileData.husbandDateOfBirth,
          husbandAge: profileData.husband_age ?? profileData.husbandAge,
          husbandIsWorking: profileData.husband_is_working ?? profileData.husbandIsWorking,
          husbandOccupation: profileData.husband_occupation ?? profileData.husbandOccupation,
          husbandMedicalFollowupRequired: profileData.husband_medical_followup_required ?? profileData.husbandMedicalFollowupRequired,
          husbandMedicalFollowupFrequency: profileData.husband_medical_followup_frequency ?? profileData.husbandMedicalFollowupFrequency,
          husbandMedicalFollowupDetails: profileData.husband_medical_followup_details ?? profileData.husbandMedicalFollowupDetails,
          husbandDisabilityType: profileData.husband_disability_type ?? profileData.husbandDisabilityType,
          husbandDisabilitySeverity: profileData.husband_disability_severity ?? profileData.husbandDisabilitySeverity,
          husbandDisabilityDetails: profileData.husband_disability_details ?? profileData.husbandDisabilityDetails,
          husbandChronicDiseaseType: profileData.husband_chronic_disease_type ?? profileData.husbandChronicDiseaseType,
          husbandChronicDiseaseDetails: profileData.husband_chronic_disease_details ?? profileData.husbandChronicDiseaseDetails,
          husbandWarInjuryType: profileData.husband_war_injury_type ?? profileData.husbandWarInjuryType,
          husbandWarInjuryDetails: profileData.husband_war_injury_details ?? profileData.husbandWarInjuryDetails,
          // Documents
          idCardUrl: profileData.id_card_url || profileData.idCardUrl,
          medicalReportUrl: profileData.medical_report_url || profileData.medicalReportUrl,
          signatureUrl: profileData.signature_url || profileData.signatureUrl,
          // Original Address
          originalAddressGovernorate: profileData.original_address_governorate || profileData.originalAddressGovernorate,
          originalAddressRegion: profileData.original_address_region || profileData.originalAddressRegion,
          originalAddressDetails: profileData.original_address_details || profileData.originalAddressDetails,
          originalAddressHousingType: profileData.original_address_housing_type || profileData.originalAddressHousingType,
          // Current Housing
          currentHousingType: profileData.current_housing_type || profileData.currentHousingType,
          currentHousingIsSuitable: profileData.current_housing_is_suitable ?? profileData.currentHousingIsSuitable,
          currentHousingSanitaryFacilities: profileData.current_housing_sanitary_facilities || profileData.currentHousingSanitaryFacilities,
          currentHousingWaterSource: profileData.current_housing_water_source || profileData.currentHousingWaterSource,
          currentHousingElectricityAccess: profileData.current_housing_electricity_access || profileData.currentHousingElectricityAccess,
          currentHousingGovernorate: profileData.current_housing_governorate || profileData.currentHousingGovernorate,
          currentHousingRegion: profileData.current_housing_region || profileData.currentHousingRegion,
          currentHousingLandmark: profileData.current_housing_landmark || profileData.currentHousingLandmark,
          currentHousingSharingStatus: profileData.current_housing_sharing_status || profileData.currentHousingSharingStatus,
          currentHousingDetailedType: profileData.current_housing_detailed_type || profileData.currentHousingDetailedType,
          currentHousingFurnished: profileData.current_housing_furnished ?? profileData.currentHousingFurnished,
          unitNumber: profileData.current_housing_unit_number ?? profileData.unitNumber,
          campId: profileData.camp_id ?? profileData.campId,
          totalMembersCount: profileData.total_members_count ?? profileData.totalMembersCount,
          // Refugee/Resident Abroad
          isResidentAbroad: profileData.is_resident_abroad ?? profileData.isResidentAbroad ?? false,
          refugeeResidentAbroadCountry: profileData.refugee_resident_abroad_country || profileData.refugeeResidentAbroadCountry,
          refugeeResidentAbroadCity: profileData.refugee_resident_abroad_city || profileData.refugeeResidentAbroadCity,
          refugeeResidentAbroadResidenceType: profileData.refugee_resident_abroad_residence_type || profileData.refugeeResidentAbroadResidenceType,
          // Counts
          maleCount: profileData.male_count ?? profileData.maleCount,
          femaleCount: profileData.female_count ?? profileData.femaleCount,
          childCount: profileData.child_count ?? profileData.childCount,
          teenagerCount: profileData.teenager_count ?? profileData.teenagerCount,
          adultCount: profileData.adult_count ?? profileData.adultCount,
          seniorCount: profileData.senior_count ?? profileData.seniorCount,
          disabledCount: profileData.disabled_count ?? profileData.disabledCount,
          injuredCount: profileData.injured_count ?? profileData.injuredCount,
          pregnantWomenCount: profileData.pregnant_women_count ?? profileData.pregnantWomenCount,
          // Vulnerability fields
          vulnerabilityScore: profileData.vulnerability_score ?? profileData.vulnerabilityScore,
          vulnerabilityPriority: profileData.vulnerability_priority ?? profileData.vulnerabilityPriority,
          vulnerabilityBreakdown: profileData.vulnerability_breakdown ?? profileData.vulnerabilityBreakdown,
          vulnerabilityReason: profileData.vulnerability_reason ?? profileData.vulnerabilityReason,
          // Other
          adminNotes: profileData.admin_notes || profileData.adminNotes,
          nominationBody: profileData.nomination_body || profileData.nominationBody,
          registeredDate: profileData.registered_date || profileData.registeredDate,
          lastUpdated: profileData.last_updated || profileData.lastUpdated,
        };
        setDp(transformedData);
      } else {
        setToast({ message: 'فشل تحميل بيانات العائلة', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'فشل تحميل بيانات العائلة', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setFamilyMembers([]);
        return;
      }

      const members = await beneficiaryService.getFamilyMembers(familyId);
      setFamilyMembers(members);
    } catch (err: any) {
      setFamilyMembers([]);
    }
  };

  const loadFieldPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setFieldPermissions({});
        setLoadingPermissions(false);
        return;
      }

      const perms = await realDataService.getFieldPermissions(familyId);
      const permsMap: {[key: string]: boolean} = {};
      perms.forEach(p => {
        if (p.is_editable) {
          permsMap[p.field_name] = true;
        }
      });
      setFieldPermissions(permsMap);
    } catch (error: any) {
      console.error('Error loading field permissions:', error);
      // Default to no fields editable if loading fails
      setFieldPermissions({});
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Load tab-specific data when active tab changes
  useEffect(() => {
    if (activeTab === 'emergency' || activeTab === 'complaints') {
      loadTabData(activeTab);
    }
    if (activeTab === 'distributions') {
      loadDistributionHistory();
    }
    if (activeTab === 'notifications') {
      loadNotifications();
    }
    if (activeTab === 'settings') {
      loadCampInfo();
      loadSpecialAssistanceRequests();
      loadVulnerabilityBreakdown();
    }
  }, [activeTab]);

  const loadTabData = async (tabId: string) => {
    if (tabLoading[tabId]) return; // Prevent duplicate loading
    
    setTabLoading(prev => ({ ...prev, [tabId]: true }));
    
    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        setTabLoading(prev => ({ ...prev, [tabId]: false }));
        return;
      }

      switch (tabId) {
        case 'emergency':
          const emergencyData = await beneficiaryService.getEmergencyReports(familyId);
          setEmergencyReports(Array.isArray(emergencyData) ? emergencyData : []);
          break;
        case 'complaints':
          const complaintsData = await beneficiaryService.getComplaints(familyId);
          setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
          break;
      }
    } catch (err: any) {
      console.error(`Error loading ${tabId} data:`, err);
      setToast({ message: `فشل تحميل بيانات ${tabId}`, type: 'error' });
    } finally {
      setTabLoading(prev => ({ ...prev, [tabId]: false }));
    }
  };

  // New loading functions for distributions, notifications, camp info, and special assistance
  const loadDistributionHistory = async () => {
    if (tabLoading['distributions']) return;
    
    // Check if we have valid cached data
    if (isCacheValid(distributionHistoryLoadedRef.current)) {
      setDistributionHistory(distributionHistoryLoadedRef.current!.data);
      return;
    }
    
    setTabLoading(prev => ({ ...prev, ['distributions']: true }));
    try {
      const history = await beneficiaryService.getDistributionHistory();
      setDistributionHistory(history);
      // Cache the data
      distributionHistoryLoadedRef.current = {
        timestamp: Date.now(),
        data: history
      };
    } catch (err: any) {
      console.error('Error loading distribution history:', err);
      setToast({ message: 'فشل تحميل سجل التوزيع', type: 'error' });
    } finally {
      setTabLoading(prev => ({ ...prev, ['distributions']: false }));
    }
  };

  const loadNotifications = async () => {
    if (tabLoading['notifications']) return;
    
    // Check if we have valid cached data
    if (isCacheValid(notificationsLoadedRef.current)) {
      setNotifications(notificationsLoadedRef.current!.data);
      return;
    }
    
    setTabLoading(prev => ({ ...prev, ['notifications']: true }));
    try {
      const notifs = await beneficiaryService.getNotifications();
      setNotifications(notifs);
      // Cache the data
      notificationsLoadedRef.current = {
        timestamp: Date.now(),
        data: notifs
      };
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setToast({ message: 'فشل تحميل الإشعارات', type: 'error' });
    } finally {
      setTabLoading(prev => ({ ...prev, ['notifications']: false }));
    }
  };

  const loadCampInfo = async () => {
    if (loadingCampInfo) return;
    
    // Check if we have valid cached data
    if (isCacheValid(campInfoLoadedRef.current)) {
      setCampInfo(campInfoLoadedRef.current!.data);
      return;
    }
    
    setLoadingCampInfo(true);
    try {
      const camp = await beneficiaryService.getCampInfo();
      setCampInfo(camp);
      // Cache the data
      campInfoLoadedRef.current = {
        timestamp: Date.now(),
        data: camp
      };
    } catch (err: any) {
      console.error('Error loading camp info:', err);
      setCampInfo(null);
    } finally {
      setLoadingCampInfo(false);
    }
  };

  const loadSpecialAssistanceRequests = async () => {
    if (tabLoading['special_assistance']) return;
    setTabLoading(prev => ({ ...prev, ['special_assistance']: true }));
    try {
      const requests = await beneficiaryService.getSpecialAssistanceRequests();
      setSpecialAssistanceRequests(requests);
    } catch (err: any) {
      console.error('Error loading special assistance requests:', err);
    } finally {
      setTabLoading(prev => ({ ...prev, ['special_assistance']: false }));
    }
  };

  const loadVulnerabilityBreakdown = async () => {
    if (showVulnerabilityBreakdown) return;
    try {
      const breakdown = await beneficiaryService.getVulnerabilityBreakdown();
      setVulnerabilityBreakdown(breakdown);
    } catch (err: any) {
      console.error('Error loading vulnerability breakdown:', err);
    }
  };

  const loadAvailableCamps = async () => {
    try {
      const camps = await beneficiaryService.getCamps();
      setAvailableCamps(camps);
    } catch (err: any) {
      console.error('Error loading camps:', err);
    }
  };

  // Delete handlers for complaints and emergency reports
  const handleDeleteComplaint = (complaintId: string) => {
    setComplaintToDelete(complaintId);
    setShowDeleteComplaintConfirm(true);
  };

  const confirmDeleteComplaint = async () => {
    if (!complaintToDelete) return;

    try {
      // Optimistic update - remove from state immediately
      setComplaints(prev => prev.filter(c => c.id !== complaintToDelete));

      await makeAuthenticatedRequest(`/dp/complaints/${complaintToDelete}`, {
        method: 'DELETE'
      });
      setToast({ message: 'تم حذف الشكوى بنجاح', type: 'success' });
      // Refresh from server to ensure consistency
      loadTabData('complaints');
    } catch (err: any) {
      console.error('Error deleting complaint:', err);
      setToast({ message: err.message || 'فشل حذف الشكوى', type: 'error' });
      // Reload to restore original state if delete failed
      loadTabData('complaints');
    } finally {
      setShowDeleteComplaintConfirm(false);
      setComplaintToDelete(null);
    }
  };

  const handleDeleteEmergencyReport = (reportId: string) => {
    setReportToDelete(reportId);
    setShowDeleteReportConfirm(true);
  };

  const confirmDeleteEmergencyReport = async () => {
    if (!reportToDelete) return;

    try {
      // Optimistic update - remove from state immediately
      setEmergencyReports(prev => prev.filter(r => r.id !== reportToDelete));

      await makeAuthenticatedRequest(`/dp/emergency-reports/${reportToDelete}`, {
        method: 'DELETE'
      });
      setToast({ message: 'تم حذف البلاغ بنجاح', type: 'success' });
      // Refresh from server to ensure consistency
      loadTabData('emergency');
    } catch (err: any) {
      console.error('Error deleting emergency report:', err);
      setToast({ message: err.message || 'فشل حذف البلاغ', type: 'error' });
      // Reload to restore original state if delete failed
      loadTabData('emergency');
    } finally {
      setShowDeleteReportConfirm(false);
      setReportToDelete(null);
    }
  };

  // Submit handlers for modals
  const handleSubmitEmergencyReport = async () => {
    if (!emergencyForm.emergencyType || !emergencyForm.description) {
      setToast({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }

    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        return;
      }

      await makeAuthenticatedRequest('/dp/emergency-reports', {
        method: 'POST',
        body: JSON.stringify({
          emergency_type: emergencyForm.emergencyType,
          description: emergencyForm.description,
          urgency: emergencyForm.urgency,
          location: emergencyForm.location
        })
      });

      setToast({ message: 'تم إرسال البلاغ الطارئ بنجاح', type: 'success' });
      setShowEmergencyModal(false);
      setEmergencyForm({ emergencyType: '', description: '', urgency: 'عادي', location: '' });
      loadTabData('emergency');
    } catch (err: any) {
      console.error('Error submitting emergency report:', err);
      setToast({ message: err.message || 'فشل إرسال البلاغ الطارئ', type: 'error' });
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintForm.subject || !complaintForm.description) {
      setToast({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }

    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        return;
      }

      await makeAuthenticatedRequest('/dp/complaints', {
        method: 'POST',
        body: JSON.stringify({
          subject: complaintForm.subject,
          description: complaintForm.description,
          category: complaintForm.category,
          is_anonymous: complaintForm.isAnonymous
        })
      });

      setToast({ message: 'تم إرسال الشكوى بنجاح', type: 'success' });
      setShowComplaintModal(false);
      setComplaintForm({ subject: '', description: '', category: 'عام', isAnonymous: false });
      loadTabData('complaints');
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      setToast({ message: err.message || 'فشل إرسال الشكوى', type: 'error' });
    }
  };

  const handleSubmitSpecialAssistance = async () => {
    if (!specialAssistanceForm.description) {
      setToast({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }

    try {
      await beneficiaryService.submitSpecialAssistanceRequest(
        specialAssistanceForm.assistanceType,
        specialAssistanceForm.description,
        specialAssistanceForm.urgency
      );

      setToast({ message: 'تم إرسال طلب المساعدة بنجاح', type: 'success' });
      setShowSpecialAssistanceModal(false);
      setSpecialAssistanceForm({ assistanceType: 'medical', description: '', urgency: 'عادي' });
      loadSpecialAssistanceRequests();
    } catch (err: any) {
      console.error('Error submitting special assistance request:', err);
      setToast({ message: err.message || 'فشل إرسال طلب المساعدة', type: 'error' });
    }
  };

  const handleSubmitTransferRequest = async () => {
    if (!transferRequestForm.toCampId || !transferRequestForm.reason) {
      setToast({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }

    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        return;
      }

      await beneficiaryService.submitTransferRequest(
        familyId,
        transferRequestForm.reason,
        transferRequestForm.toCampId
      );

      setToast({ message: 'تم إرسال طلب الانتقال بنجاح', type: 'success' });
      setShowTransferRequestModal(false);
      setTransferRequestForm({ toCampId: '', reason: '' });
    } catch (err: any) {
      console.error('Error submitting transfer request:', err);
      setToast({ message: err.message || 'فشل إرسال طلب الانتقال', type: 'error' });
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    // Optimistic update - mark as read immediately
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    setMarkingNotificationId(notificationId);

    try {
      await beneficiaryService.markNotificationAsRead(notificationId);
      // Update cache directly with new state to avoid reload
      if (notificationsLoadedRef.current) {
        notificationsLoadedRef.current.data = notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        notificationsLoadedRef.current.timestamp = Date.now();
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Revert on error
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: false } : n
      ));
      setToast({ message: 'فشل تحديد الإشعار كمقروء', type: 'error' });
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    // Optimistic update - mark all as read immediately
    const previousNotifications = [...notifications];
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updatedNotifications);

    try {
      await beneficiaryService.markAllNotificationsAsRead();
      // Update cache directly with new state to avoid reload
      notificationsLoadedRef.current = {
        timestamp: Date.now(),
        data: updatedNotifications
      };
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Revert on error
      setNotifications(previousNotifications);
      setToast({ message: 'فشل تحديد كل الإشعارات كمقروءة', type: 'error' });
    }
  };

  const canEdit = () => {
    const currentUser = sessionService.getCurrentUser();
    return currentUser?.role === 'BENEFICIARY';
  };

  // Data cleaning functions
  const cleanWifeData = (data: DPProfile, originalChangedFields?: DPProfile): DPProfile => {
    const cleaned = { ...data };
    
    // Only clear wife's personal identity fields when name is EXPLICITLY cleared
    // Keep pregnancy, work, and health fields independent
    // Note: Don't clear if wifeName is just undefined (not in changedFields)
    if (originalChangedFields?.wifeName !== undefined && (!cleaned.wifeName || cleaned.wifeName.trim() === '')) {
      // Clear only personal identity fields
      cleaned.wifeNationalId = '';
      cleaned.wifeDateOfBirth = null; // Use null for database
      // Do NOT clear pregnancy, work, or health fields - they can exist independently
    } else {
      // When wife exists, validate and clean her data
      const wifeDisabilityType = cleaned.wifeDisabilityType?.trim() || '';
      if (wifeDisabilityType === 'لا يوجد' || wifeDisabilityType === 'لا توجد إعاقة') {
        cleaned.wifeDisabilityType = 'لا يوجد';
        cleaned.wifeDisabilitySeverity = null;
        cleaned.wifeDisabilityDetails = '';
      }
      const wifeChronicType = cleaned.wifeChronicDiseaseType?.trim() || '';
      if (wifeChronicType === 'لا يوجد' || wifeChronicType === 'لا يوجد مرض') {
        cleaned.wifeChronicDiseaseType = 'لا يوجد';
        cleaned.wifeChronicDiseaseDetails = '';
      }
      const wifeWarInjuryType = cleaned.wifeWarInjuryType?.trim() || '';
      if (wifeWarInjuryType === 'لا يوجد' || wifeWarInjuryType === 'لا توجد إصابة') {
        cleaned.wifeWarInjuryType = 'لا يوجد';
        cleaned.wifeWarInjuryDetails = '';
      }
      // ONLY clear medical followup fields if required was explicitly changed to false
      if (originalChangedFields?.wifeMedicalFollowupRequired === false) {
        cleaned.wifeMedicalFollowupFrequency = '';
        cleaned.wifeMedicalFollowupDetails = '';
      }
    }
    
    // ONLY clean pregnancy fields if is_pregnant was explicitly changed to false
    if (originalChangedFields?.wifeIsPregnant === false) {
      cleaned.wifePregnancyMonth = 0;
      cleaned.wifePregnancySpecialNeeds = false;
      cleaned.wifePregnancyFollowupDetails = '';
    }
    
    // ONLY clean work fields if is_working was explicitly changed to false
    if (originalChangedFields?.wifeIsWorking === false) {
      cleaned.wifeOccupation = '';
    }
    
    return cleaned;
  };

  const cleanHealthData = (data: DPProfile, originalChangedFields?: DPProfile): DPProfile => {
    const cleaned = { ...data };
    const disabilityType = cleaned.disabilityType?.trim() || '';
    if (disabilityType === 'لا يوجد' || disabilityType === 'لا توجد إعاقة') {
      cleaned.disabilityType = 'لا يوجد';
      cleaned.disabilitySeverity = null;
      cleaned.disabilityDetails = '';
    }
    const chronicType = cleaned.chronicDiseaseType?.trim() || '';
    if (chronicType === 'لا يوجد' || chronicType === 'لا يوجد مرض') {
      cleaned.chronicDiseaseType = 'لا يوجد';
      cleaned.chronicDiseaseDetails = '';
    }
    const warInjuryType = cleaned.warInjuryType?.trim() || '';
    if (warInjuryType === 'لا يوجد' || warInjuryType === 'لا توجد إصابة') {
      cleaned.warInjuryType = 'لا يوجد';
      cleaned.warInjuryDetails = '';
    }
    // ONLY clear medical followup fields if required was explicitly changed to false
    if (originalChangedFields?.medicalFollowupRequired === false) {
      cleaned.medicalFollowupFrequency = '';
      cleaned.medicalFollowupDetails = '';
    }
    // ONLY clear work fields if is_working was explicitly changed to false
    if (originalChangedFields?.isWorking === false) {
      cleaned.job = '';
      cleaned.monthlyIncome = 0;
      cleaned.monthlyIncomeRange = null;
    }
    return cleaned;
  };

  // Clean husband data - clear fields that are inconsistent with checkboxes
  const cleanHusbandData = (data: DPProfile, originalChangedFields?: DPProfile): DPProfile => {
    const cleaned = { ...data };

    // Only clear husband's personal identity fields when name is EXPLICITLY cleared
    // Keep work and health fields independent
    // Note: Don't clear if husbandName is just undefined (not in changedFields)
    if (originalChangedFields?.husbandName !== undefined && (!cleaned.husbandName || cleaned.husbandName.trim() === '')) {
      // Clear only personal identity fields
      cleaned.husbandNationalId = '';
      cleaned.husbandDateOfBirth = null; // Use null for database, not empty string
      // Do NOT clear work or health fields - they can exist independently
    } else {
      // When husband exists, validate and clean his data
      // ONLY clear work fields if is_working was explicitly changed to false
      if (originalChangedFields?.husbandIsWorking === false) {
        cleaned.husbandOccupation = '';
      }
      // Normalize and clear disability fields if no disability
      const husbandDisabilityType = cleaned.husbandDisabilityType?.trim() || '';
      if (husbandDisabilityType === 'لا يوجد' || husbandDisabilityType === 'لا توجد إعاقة') {
        cleaned.husbandDisabilityType = 'لا يوجد'; // Normalize
        cleaned.husbandDisabilitySeverity = null;
        cleaned.husbandDisabilityDetails = '';
      }
      // Clear chronic disease fields if no chronic disease
      const husbandChronicType = cleaned.husbandChronicDiseaseType?.trim() || '';
      if (husbandChronicType === 'لا يوجد' || husbandChronicType === 'لا يوجد مرض') {
        cleaned.husbandChronicDiseaseType = 'لا يوجد'; // Normalize
        cleaned.husbandChronicDiseaseDetails = '';
      }
      // Clear war injury fields if no war injury
      const husbandWarInjuryType = cleaned.husbandWarInjuryType?.trim() || '';
      if (husbandWarInjuryType === 'لا يوجد' || husbandWarInjuryType === 'لا توجد إصابة') {
        cleaned.husbandWarInjuryType = 'لا يوجد'; // Normalize
        cleaned.husbandWarInjuryDetails = '';
      }
      // ONLY clear medical followup fields if required was explicitly changed to false
      if (originalChangedFields?.husbandMedicalFollowupRequired === false) {
        cleaned.husbandMedicalFollowupFrequency = '';
        cleaned.husbandMedicalFollowupDetails = '';
      }
    }

    return cleaned;
  };

  // Clean individual family member data
  const cleanIndividualData = (member: FamilyMember): FamilyMember => {
    const cleaned = { ...member };

    // Normalize and clear disability fields if no disability
    const disabilityType = cleaned.disabilityType?.trim() || '';
    if (disabilityType === 'لا يوجد' || disabilityType === 'لا توجد إعاقة') {
      cleaned.disabilityType = 'لا يوجد' as any; // Normalize
      cleaned.disabilitySeverity = undefined;
      cleaned.disabilityDetails = undefined;
    }

    // Clear chronic disease fields if no chronic disease
    const chronicType = cleaned.chronicDiseaseType?.trim() || '';
    if (chronicType === 'لا يوجد' || chronicType === 'لا يوجد مرض') {
      cleaned.chronicDiseaseType = 'لا يوجد' as any; // Normalize
      cleaned.chronicDiseaseDetails = undefined;
    }

    // Clear war injury fields if no war injury
    if (!cleaned.hasWarInjury || cleaned.warInjuryType === 'لا يوجد') {
      cleaned.hasWarInjury = false;
      cleaned.warInjuryType = 'لا يوجد' as any; // Normalize
      cleaned.warInjuryDetails = undefined;
    }

    // Clear medical followup fields if not required
    if (!cleaned.medicalFollowupRequired) {
      cleaned.medicalFollowupFrequency = undefined;
      cleaned.medicalFollowupDetails = undefined;
    }

    // Clear education fields if not studying
    if (cleaned.isStudying === false || cleaned.isStudying === null) {
      cleaned.educationStage = undefined;
      cleaned.educationLevel = undefined;
    }

    // Clear work fields if not working
    if (cleaned.isWorking === false || cleaned.isWorking === null) {
      cleaned.occupation = undefined;
    }

    return cleaned;
  };

  const enterEditMode = () => {
    if (dp) {
      // Pass dp as the reference for cleaning (to preserve existing values)
      let cleanedData = cleanHealthData(dp, dp);
      cleanedData = cleanWifeData(cleanedData, dp);
      cleanedData = cleanHusbandData(cleanedData, dp);
      setEditableData(cleanedData);
      setOriginalData({ ...cleanedData }); // Store a copy of the original data
      setEditableFamilyMembers([...familyMembers]);
      setValidationErrors({});
      setIsEditMode(true);
      setHasUnsavedChanges(false);
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setEditableData(null);
    setOriginalData(null);
    setEditableFamilyMembers([]);
    setValidationErrors({});
    setHasUnsavedChanges(false);
    setShowCancelConfirm(false);
  };

  // Helper function to detect changes between original and editable data
  const hasChanges = (): boolean => {
    if (!originalData || !editableData) return false;
    
    // Compare all fields
    const keys = new Set([...Object.keys(originalData), ...Object.keys(editableData)]);
    for (const key of keys) {
      const origValue = (originalData as any)[key];
      const editValue = (editableData as any)[key];
      
      // Handle deep comparison for objects/arrays
      if (typeof origValue === 'object' || typeof editValue === 'object') {
        if (JSON.stringify(origValue) !== JSON.stringify(editValue)) {
          return true;
        }
      } else if (origValue !== editValue) {
        return true;
      }
    }
    return false;
  };

  // Get only the fields that have changed
  const getChangedFields = (): Partial<DPProfile> => {
    if (!originalData || !editableData) return {};
    
    const changedFields: Partial<DPProfile> = {};
    const keys = new Set([...Object.keys(originalData), ...Object.keys(editableData)]);
    
    for (const key of keys) {
      const origValue = (originalData as any)[key];
      const editValue = (editableData as any)[key];
      
      // Handle deep comparison for objects/arrays
      if (typeof origValue === 'object' || typeof editValue === 'object') {
        if (JSON.stringify(origValue) !== JSON.stringify(editValue)) {
          (changedFields as any)[key] = editValue;
        }
      } else if (origValue !== editValue) {
        (changedFields as any)[key] = editValue;
      }
    }
    
    return changedFields;
  };

  // Check if a field is editable based on permissions
  const isFieldEditable = (fieldName: string): boolean => {
    // During loading, default to false (nothing editable)
    if (loadingPermissions) return false;
    // If no permissions set, default to false (secure default)
    return fieldPermissions[fieldName] === true;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (editableData) {
      let newData = { ...editableData, [field]: value };

      // Clear related fields when setting to "لا يوجد"
      if (field === 'disabilityType' && value === 'لا يوجد') {
        newData.disabilitySeverity = '';
        newData.disabilityDetails = '';
      } else if (field === 'chronicDiseaseType' && value === 'لا يوجد') {
        newData.chronicDiseaseDetails = '';
      } else if (field === 'warInjuryType' && value === 'لا يوجد') {
        newData.warInjuryDetails = '';
      } else if (field === 'wifeDisabilityType' && value === 'لا يوجد') {
        newData.wifeDisabilitySeverity = '';
        newData.wifeDisabilityDetails = '';
      } else if (field === 'wifeChronicDiseaseType' && value === 'لا يوجد') {
        newData.wifeChronicDiseaseDetails = '';
      } else if (field === 'wifeWarInjuryType' && value === 'لا يوجد') {
        newData.wifeWarInjuryDetails = '';
      } else if (field === 'wifeIsPregnant' && value === false) {
        newData.wifePregnancyMonth = 0;
        newData.wifePregnancySpecialNeeds = false;
        newData.wifePregnancyFollowupDetails = '';
      } else if (field === 'wifeIsWorking' && value === false) {
        newData.wifeOccupation = '';
      } else if (field === 'isWorking' && value === false) {
        newData.job = '';
        newData.monthlyIncome = 0;
        newData.monthlyIncomeRange = null;
      } else if (field === 'medicalFollowupRequired' && value === false) {
        newData.medicalFollowupFrequency = '';
        newData.medicalFollowupDetails = '';
      } else if (field === 'wifeMedicalFollowupRequired' && value === false) {
        newData.wifeMedicalFollowupFrequency = '';
        newData.wifeMedicalFollowupDetails = '';
      } else if (field === 'husbandMedicalFollowupRequired' && value === false) {
        newData.husbandMedicalFollowupFrequency = '';
        newData.husbandMedicalFollowupDetails = '';
      } else if (field === 'husbandIsWorking' && value === false) {
        newData.husbandOccupation = '';
      } else if (field === 'husbandDisabilityType' && value === 'لا يوجد') {
        newData.husbandDisabilitySeverity = '';
        newData.husbandDisabilityDetails = '';
      } else if (field === 'husbandChronicDiseaseType' && value === 'لا يوجد') {
        newData.husbandChronicDiseaseDetails = '';
      } else if (field === 'husbandWarInjuryType' && value === 'لا يوجد') {
        newData.husbandWarInjuryDetails = '';
      } else if (field === 'wifeName' && (!value || value.trim() === '')) {
        // Clear wife's personal fields when name is cleared
        newData.wifeNationalId = '';
        newData.wifeDateOfBirth = null; // Use null for database
      } else if (field === 'husbandName' && (!value || value.trim() === '')) {
        // Clear husband's personal fields when name is cleared
        newData.husbandNationalId = '';
        newData.husbandDateOfBirth = null; // Use null for database
      }

      setEditableData(newData);
      setHasUnsavedChanges(true);
      if (validationErrors[field]) {
        setValidationErrors({ ...validationErrors, [field]: '' });
      }

      // Sync governorate values
      if (field === 'originalAddressGovernorate') {
        setSelectedOrigGovernorate(value);
        setSelectedOrigArea('');
      } else if (field === 'currentHousingGovernorate') {
        setSelectedCurrentGovernorate(value);
        setSelectedCurrentArea('');
      } else if (field === 'originalAddressRegion') {
        setSelectedOrigArea(value);
      } else if (field === 'currentHousingRegion') {
        setSelectedCurrentArea(value);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!editableData) return false;

    if (!editableData.headFirstName?.trim()) errors.headFirstName = 'الاسم الأول مطلوب';
    if (!editableData.headFatherName?.trim()) errors.headFatherName = 'اسم الأب مطلوب';
    if (!editableData.headGrandfatherName?.trim()) errors.headGrandfatherName = 'اسم الجد مطلوب';
    if (!editableData.headFamilyName?.trim()) errors.headFamilyName = 'اسم العائلة مطلوب';
    if (!editableData.nationalId?.trim()) errors.nationalId = 'الرقم الوطني مطلوب';
    if (!editableData.gender) errors.gender = 'الجنس مطلوب';
    if (!editableData.dateOfBirth) errors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    if (!editableData.maritalStatus) errors.maritalStatus = 'الحالة الاجتماعية مطلوبة';
    if (!editableData.phoneNumber?.trim()) errors.phoneNumber = 'رقم الهاتف مطلوب';

    if (editableData.nationalId && !/^\d+$/.test(editableData.nationalId)) {
      errors.nationalId = 'الرقم الوطني يجب أن يحتوي على أرقام فقط';
    }
    if (editableData.phoneNumber && !/^[\d+\-\s()]+$/.test(editableData.phoneNumber)) {
      errors.phoneNumber = 'رقم الهاتف غير صحيح';
    }
    if (editableData.dateOfBirth && new Date(editableData.dateOfBirth) > new Date()) {
      errors.dateOfBirth = 'تاريخ الميلاد لا يمكن أن يكون في المستقبل';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editableData) return;

    // Check if there are any actual changes
    if (!hasChanges()) {
      setToast({ message: 'لا توجد تغييرات لحفظها', type: 'info' });
      exitEditMode();
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        setIsSaving(false);
        return;
      }

      // Get only the fields that have changed
      const changedFields = getChangedFields();

      console.log('[DPPortal] === SAVE DEBUG ===');
      console.log('[DPPortal] Changed fields (wife):', {
        wifeName: changedFields.wifeName,
        wifeNationalId: changedFields.wifeNationalId,
        wifeDateOfBirth: changedFields.wifeDateOfBirth,
      });
      console.log('[DPPortal] Editable wife data:', {
        wifeName: editableData?.wifeName,
        wifeNationalId: editableData?.wifeNationalId,
        wifeDateOfBirth: editableData?.wifeDateOfBirth,
      });
      console.log('[DPPortal] Original wife data:', {
        wifeName: originalData?.wifeName,
        wifeNationalId: originalData?.wifeNationalId,
        wifeDateOfBirth: originalData?.wifeDateOfBirth,
      });

      // Store original changed fields before cleaning for reference
      const originalChangedFields = { ...changedFields };

      // Clean health data to ensure disability/chronic/war injury fields are properly cleared
      // when "لا يوجد" is selected (handles timing issues with state updates)
      let cleanedData = cleanHealthData(changedFields as any, originalChangedFields as any);
      cleanedData = cleanWifeData(cleanedData as any, originalChangedFields as any);
      cleanedData = cleanHusbandData(cleanedData as any, originalChangedFields as any);

      // Helper to conditionally include fields only if they exist in changedFields
      const includeField = <T extends object, K extends keyof T>(obj: T, key: K, camelKey: K): Partial<T> => {
        if ((changedFields as any)[camelKey] !== undefined) {
          let value = (cleanedData as any)[camelKey];
          // Convert empty strings to null for severity fields (database constraint)
          if (key.includes('_severity') && value === '') {
            value = null;
          }
          return { [key]: value };
        }
        return {};
      };

      // Prepare full update data with snake_case field names matching database schema
      // Only fields that exist in changedFields will be included
      const fullUpdateData: any = {
        // Head of family 4-part name - include only if changed
        ...includeField({} as any, 'head_first_name', 'headFirstName'),
        ...includeField({} as any, 'head_father_name', 'headFatherName'),
        ...includeField({} as any, 'head_grandfather_name', 'headGrandfatherName'),
        ...includeField({} as any, 'head_family_name', 'headFamilyName'),
        ...includeField({} as any, 'head_of_family_national_id', 'nationalId'),
        ...includeField({} as any, 'head_of_family_gender', 'gender'),
        ...includeField({} as any, 'head_of_family_date_of_birth', 'dateOfBirth'),
        ...includeField({} as any, 'head_of_family_marital_status', 'maritalStatus'),
        ...includeField({} as any, 'head_of_family_widow_reason', 'widowReason'),
        ...includeField({} as any, 'head_of_family_role', 'headRole'),
        ...includeField({} as any, 'head_of_family_phone_number', 'phoneNumber'),
        ...includeField({} as any, 'head_of_family_phone_secondary', 'phoneSecondary'),
        ...includeField({} as any, 'head_of_family_disability_type', 'disabilityType'),
        ...includeField({} as any, 'head_of_family_disability_severity', 'disabilitySeverity'),
        ...includeField({} as any, 'head_of_family_disability_details', 'disabilityDetails'),
        ...includeField({} as any, 'head_of_family_chronic_disease_type', 'chronicDiseaseType'),
        ...includeField({} as any, 'head_of_family_chronic_disease_details', 'chronicDiseaseDetails'),
        ...includeField({} as any, 'head_of_family_war_injury_type', 'warInjuryType'),
        ...includeField({} as any, 'head_of_family_war_injury_details', 'warInjuryDetails'),
        ...includeField({} as any, 'head_of_family_medical_followup_required', 'medicalFollowupRequired'),
        ...includeField({} as any, 'head_of_family_medical_followup_frequency', 'medicalFollowupFrequency'),
        ...includeField({} as any, 'head_of_family_medical_followup_details', 'medicalFollowupDetails'),
        ...includeField({} as any, 'head_of_family_is_working', 'isWorking'),
        ...includeField({} as any, 'head_of_family_job', 'job'),
        ...includeField({} as any, 'head_of_family_monthly_income', 'monthlyIncome'),
        ...includeField({} as any, 'head_of_family_monthly_income_range', 'monthlyIncomeRange'),

        // Wife information - include only if changed
        ...includeField({} as any, 'wife_name', 'wifeName'),
        ...includeField({} as any, 'wife_national_id', 'wifeNationalId'),
        ...includeField({} as any, 'wife_date_of_birth', 'wifeDateOfBirth'),
        ...includeField({} as any, 'wife_is_pregnant', 'wifeIsPregnant'),
        ...includeField({} as any, 'wife_pregnancy_month', 'wifePregnancyMonth'),
        ...includeField({} as any, 'wife_pregnancy_special_needs', 'wifePregnancySpecialNeeds'),
        ...includeField({} as any, 'wife_pregnancy_followup_details', 'wifePregnancyFollowupDetails'),
        ...includeField({} as any, 'wife_is_working', 'wifeIsWorking'),
        ...includeField({} as any, 'wife_occupation', 'wifeOccupation'),
        ...includeField({} as any, 'wife_medical_followup_required', 'wifeMedicalFollowupRequired'),
        ...includeField({} as any, 'wife_medical_followup_frequency', 'wifeMedicalFollowupFrequency'),
        ...includeField({} as any, 'wife_medical_followup_details', 'wifeMedicalFollowupDetails'),
        ...includeField({} as any, 'wife_disability_type', 'wifeDisabilityType'),
        ...includeField({} as any, 'wife_disability_severity', 'wifeDisabilitySeverity'),
        ...includeField({} as any, 'wife_disability_details', 'wifeDisabilityDetails'),
        ...includeField({} as any, 'wife_chronic_disease_type', 'wifeChronicDiseaseType'),
        ...includeField({} as any, 'wife_chronic_disease_details', 'wifeChronicDiseaseDetails'),
        ...includeField({} as any, 'wife_war_injury_type', 'wifeWarInjuryType'),
        ...includeField({} as any, 'wife_war_injury_details', 'wifeWarInjuryDetails'),

        // Husband information (for female-headed households) - include only if changed
        ...includeField({} as any, 'husband_name', 'husbandName'),
        ...includeField({} as any, 'husband_national_id', 'husbandNationalId'),
        ...includeField({} as any, 'husband_date_of_birth', 'husbandDateOfBirth'),
        ...includeField({} as any, 'husband_is_working', 'husbandIsWorking'),
        ...includeField({} as any, 'husband_occupation', 'husbandOccupation'),
        ...includeField({} as any, 'husband_medical_followup_required', 'husbandMedicalFollowupRequired'),
        ...includeField({} as any, 'husband_medical_followup_frequency', 'husbandMedicalFollowupFrequency'),
        ...includeField({} as any, 'husband_medical_followup_details', 'husbandMedicalFollowupDetails'),
        ...includeField({} as any, 'husband_disability_type', 'husbandDisabilityType'),
        ...includeField({} as any, 'husband_disability_severity', 'husbandDisabilitySeverity'),
        ...includeField({} as any, 'husband_disability_details', 'husbandDisabilityDetails'),
        ...includeField({} as any, 'husband_chronic_disease_type', 'husbandChronicDiseaseType'),
        ...includeField({} as any, 'husband_chronic_disease_details', 'husbandChronicDiseaseDetails'),
        ...includeField({} as any, 'husband_war_injury_type', 'husbandWarInjuryType'),
        ...includeField({} as any, 'husband_war_injury_details', 'husbandWarInjuryDetails'),

        // Original housing
        original_address_governorate: changedFields.originalAddressGovernorate,
        original_address_region: changedFields.originalAddressRegion,
        original_address_details: changedFields.originalAddressDetails,
        original_address_housing_type: changedFields.originalAddressHousingType,

        // Current housing
        current_housing_type: changedFields.currentHousingType,
        current_housing_sharing_status: changedFields.currentHousingSharingStatus,
        current_housing_detailed_type: changedFields.currentHousingDetailedType,
        current_housing_furnished: changedFields.currentHousingFurnished,
        current_housing_unit_number: changedFields.unitNumber,
        current_housing_is_suitable_for_family_size: changedFields.currentHousingIsSuitable,
        current_housing_sanitary_facilities: changedFields.currentHousingSanitaryFacilities,
        current_housing_water_source: changedFields.currentHousingWaterSource,
        current_housing_electricity_access: changedFields.currentHousingElectricityAccess,
        current_housing_governorate: changedFields.currentHousingGovernorate,
        current_housing_region: changedFields.currentHousingRegion,
        current_housing_landmark: changedFields.currentHousingLandmark,

        // Refugee/resident abroad
        is_resident_abroad: changedFields.isResidentAbroad,
        refugee_resident_abroad_country: changedFields.refugeeResidentAbroadCountry,
        refugee_resident_abroad_city: changedFields.refugeeResidentAbroadCity,
        refugee_resident_abroad_residence_type: changedFields.refugeeResidentAbroadResidenceType,

        // Vulnerability
        vulnerability_reason: changedFields.vulnerabilityReason,

        // Admin fields
        admin_notes: changedFields.adminNotes,
        nominationBody: changedFields.nominationBody,

        // Document URLs
        id_card_url: changedFields.idCardUrl,
        medical_report_url: changedFields.medicalReportUrl,
        signature_url: changedFields.signatureUrl
      };

      // Remove undefined fields (fields that weren't changed)
      Object.keys(fullUpdateData).forEach(key => {
        if (fullUpdateData[key] === undefined) {
          delete fullUpdateData[key];
        }
      });

      // Remove undefined/null fields to avoid overwriting with null
      // BUT keep empty strings for disability/chronic/war injury fields and boolean false for checkboxes
      const fieldsBeforeFiltering = { ...fullUpdateData };
      Object.keys(fullUpdateData).forEach(key => {
        if (fullUpdateData[key] === null) {
          const healthFields = [
            // Head of family health fields
            'head_of_family_disability_type', 'head_of_family_disability_severity', 'head_of_family_disability_details',
            'head_of_family_chronic_disease_type', 'head_of_family_chronic_disease_details',
            'head_of_family_war_injury_type', 'head_of_family_war_injury_details',
            'head_of_family_medical_followup_frequency', 'head_of_family_medical_followup_details',
            'head_of_family_job', 'head_of_family_monthly_income_range',
            'head_of_family_medical_followup_required', 'head_of_family_is_working',
            // Wife fields
            'wife_name', 'wife_national_id', 'wife_date_of_birth',
            'wife_disability_type', 'wife_disability_severity', 'wife_disability_details',
            'wife_chronic_disease_type', 'wife_chronic_disease_details',
            'wife_war_injury_type', 'wife_war_injury_details',
            'wife_medical_followup_frequency', 'wife_medical_followup_details',
            'wife_occupation',
            'wife_is_pregnant', 'wife_pregnancy_month', 'wife_pregnancy_special_needs', 'wife_pregnancy_followup_details',
            'wife_is_working', 'wife_medical_followup_required',
            // Husband fields
            'husband_name', 'husband_national_id', 'husband_date_of_birth',
            'husband_disability_type', 'husband_disability_severity', 'husband_disability_details',
            'husband_chronic_disease_type', 'husband_chronic_disease_details',
            'husband_war_injury_type', 'husband_war_injury_details',
            'husband_medical_followup_frequency', 'husband_medical_followup_details',
            'husband_occupation',
            'husband_is_working', 'husband_medical_followup_required'
          ];
          if (!healthFields.includes(key)) {
            delete fullUpdateData[key];
          }
        }

        // ALSO: Remove non-editable fields based on permissions
        if (!isFieldEditable(key)) {
          delete fullUpdateData[key];
        }
      });

      const filteredOutFields = Object.keys(fieldsBeforeFiltering).filter(
        key => !(key in fullUpdateData)
      );
      
      console.log('[DPPortal] Wife fields in fullUpdateData:', {
        wife_name: fullUpdateData.wife_name,
        wife_national_id: fullUpdateData.wife_national_id,
        wife_date_of_birth: fullUpdateData.wife_date_of_birth,
      });
      console.log('[DPPortal] Filtered out fields:', filteredOutFields);

      // Update family profile directly
      await realDataService.updateDP(familyId, fullUpdateData);

      setToast({ message: 'تم حفظ التغييرات بنجاح', type: 'success' });
      exitEditMode();
      await loadDP();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل حفظ التغييرات', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      exitEditMode();
    }
  };

  const confirmCancel = () => {
    exitEditMode();
    setToast({ message: 'تم إلغاء التغييرات', type: 'info' });
  };

  // Logout handlers
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    sessionService.clearTokens();
    navigate('/login');
    setToast({ message: 'تم تسجيل الخروج بنجاح', type: 'success' });
  };

  // Family member management
  const openAddMemberModal = () => {
    setTempMember({
      id: `temp_${Date.now()}`,
      firstName: '',
      fatherName: '',
      grandfatherName: '',
      familyName: '',
      name: '',
      nationalId: '',
      gender: 'ذكر',
      dateOfBirth: '',
      age: 0,
      relation: 'الابن',
      // Education & Work
      isStudying: false,
      isWorking: false,
      educationStage: undefined,
      educationLevel: undefined,
      occupation: undefined,
      phoneNumber: undefined,
      // Marital Status
      maritalStatus: 'أعزب/عزباء',
      // Health - Disability
      disabilityType: 'لا يوجد',
      disabilitySeverity: undefined,
      disabilityDetails: undefined,
      // Health - Chronic Disease
      chronicDiseaseType: 'لا يوجد',
      chronicDiseaseDetails: undefined,
      // Health - War Injury
      hasWarInjury: false,
      warInjuryType: 'لا يوجد',
      warInjuryDetails: undefined,
      // Medical Follow-up
      medicalFollowupRequired: false,
      medicalFollowupFrequency: undefined,
      medicalFollowupDetails: undefined,
      // Soft Delete
      isDeleted: false,
      deletedAt: undefined
    });
    setEditingMemberIndex(null);
    setShowMemberModal(true);
  };

  const openEditMemberModal = (index: number) => {
    setTempMember({ ...editableFamilyMembers[index] });
    setEditingMemberIndex(index);
    setShowMemberModal(true);
  };

  const openViewMemberModal = (index: number) => {
    setViewingMemberIndex(index);
    setShowViewMemberModal(true);
  };

  const saveMember = async () => {
    // Validation
    if (!tempMember.firstName || !tempMember.fatherName || !tempMember.familyName ||
        !tempMember.gender || !tempMember.dateOfBirth || !tempMember.relation) {
      setToast({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }

    if (!tempMember.nationalId) {
      setToast({ message: 'الرقم الوطني مطلوب', type: 'error' });
      return;
    }

    // Validate national ID format (8-9 digits)
    const nationalIdRegex = /^\d{8,9}$/;
    if (!nationalIdRegex.test(tempMember.nationalId)) {
      setToast({ message: 'الرقم الوطني يجب أن يتكون من 8-9 أرقام', type: 'error' });
      return;
    }

    // Calculate age from date of birth
    const calculatedAge = calculateAge(tempMember.dateOfBirth);
    const memberToSave = {
      ...tempMember,
      age: calculatedAge,
      // Compute full name from 4 parts
      name: `${tempMember.firstName || ''} ${tempMember.fatherName || ''} ${tempMember.grandfatherName || ''} ${tempMember.familyName || ''}`.trim()
    };

    try {
      const currentUser = sessionService.getCurrentUser();
      const familyId = currentUser?.familyId;

      if (!familyId) {
        setToast({ message: 'لم يتم العثور على معرف العائلة', type: 'error' });
        return;
      }

      if (editingMemberIndex !== null) {
        // Update existing member
        const existingMember = editableFamilyMembers[editingMemberIndex];

        if (existingMember.id && !existingMember.id.startsWith('temp_')) {
          // Clean member data before saving
          const cleanedMember = cleanIndividualData(memberToSave);

          // Save to backend via beneficiaryService (which handles snake_case conversion)
          setIsSaving(true);

          await beneficiaryService.updateFamilyMember(existingMember.id, cleanedMember);

          // Update local state with cleaned member
          const updated = [...editableFamilyMembers];
          updated[editingMemberIndex] = {
            ...cleanedMember,
            id: existingMember.id
          };
          setEditableFamilyMembers(updated);
          setToast({ message: 'تم تعديل بيانات الفرد بنجاح', type: 'success' });
          setIsSaving(false);
        } else {
          // Local only (temp member)
          const updated = [...editableFamilyMembers];
          updated[editingMemberIndex] = memberToSave as FamilyMember;
          setEditableFamilyMembers(updated);
          setToast({ message: 'تم تعديل بيانات الفرد', type: 'success' });
        }
      } else {
        // Add new member
        // Clean member data before saving
        const cleanedMember = cleanIndividualData(memberToSave);

        setIsSaving(true);

        // beneficiaryService handles the snake_case conversion internally
        const response = await beneficiaryService.addFamilyMember(familyId, cleanedMember);

        // Add to local state with backend ID
        const newMember: FamilyMember = {
          ...cleanedMember,
          id: response.id || `temp_${Date.now()}`
        } as FamilyMember;

        setEditableFamilyMembers([...editableFamilyMembers, newMember]);
        setToast({ message: 'تم إضافة الفرد بنجاح', type: 'success' });
        setIsSaving(false);
      }

      setShowMemberModal(false);
      setHasUnsavedChanges(true);
    } catch (error: any) {
      console.error('Save member error:', error);
      setToast({
        message: error.message || 'حدث خطأ أثناء حفظ البيانات',
        type: 'error'
      });
      setIsSaving(false);
    }
  };

  const deleteMember = async (index: number) => {
    try {
      const memberToDelete = editableFamilyMembers[index];

      if (memberToDelete.id && !memberToDelete.id.startsWith('temp_')) {
        // Call backend API to delete
        await beneficiaryService.deleteFamilyMember(memberToDelete.id);
        setToast({ message: 'تم حذف الفرد بنجاح', type: 'success' });
      } else {
        setToast({ message: 'تم حذف الفرد', type: 'success' });
      }

      // Reload family members from backend
      await loadFamilyMembers();
      setShowMemberModal(false);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      setToast({ message: error.message || 'حدث خطأ أثناء حذف الفرد', type: 'error' });
    }
  };

  // Show delete confirmation modal
  const confirmDeleteMember = (index: number) => {
    setMemberIndexToDelete(index);
    setShowDeleteMemberConfirm(true);
  };

  // Handle confirmed delete
  const handleConfirmDeleteMember = async () => {
    if (memberIndexToDelete === null) return;
    
    await deleteMember(memberIndexToDelete);
    setShowDeleteMemberConfirm(false);
    setMemberIndexToDelete(null);
  };

  const handleMemberChange = (field: string, value: any) => {
    const updated = {
      ...tempMember,
      [field]: value
    };

    // Auto-calculate age when date of birth changes
    if (field === 'dateOfBirth' && value) {
      updated.age = calculateAge(value);
    }

    // Clear education fields when not studying
    if (field === 'isStudying' && value === false) {
      updated.educationStage = undefined;
      updated.educationLevel = undefined;
    }

    // Clear work fields when not working
    if (field === 'isWorking' && value === false) {
      updated.occupation = undefined;
    }

    // Clear related fields when disability is set to "لا يوجد"
    if (field === 'disabilityType' && value === 'لا يوجد') {
      updated.disabilitySeverity = undefined;
      updated.disabilityDetails = undefined;
    }

    // Clear chronic disease details when set to "لا يوجد"
    if (field === 'chronicDiseaseType' && value === 'لا يوجد') {
      updated.chronicDiseaseDetails = undefined;
    }

    // Clear war injury fields when checkbox is unchecked OR type is "لا يوجد"
    if (field === 'hasWarInjury' && value === false) {
      updated.warInjuryType = 'لا يوجد';
      updated.warInjuryDetails = undefined;
    } else if (field === 'warInjuryType' && value === 'لا يوجد') {
      updated.warInjuryDetails = undefined;
    }

    // Clear medical followup fields when checkbox is unchecked
    if (field === 'medicalFollowupRequired' && value === false) {
      updated.medicalFollowupFrequency = undefined;
      updated.medicalFollowupDetails = undefined;
    }

    setTempMember(updated);
  };

  // Show if spouse tab should be visible
  // In edit mode: show if married (not single)
  // In view mode: show if spouse name exists
  const showSpouseTab = isEditMode && editableData
    ? editableData.maritalStatus !== 'أعزب' && editableData.maritalStatus !== 'أعزب/عزباء'
    : dp && (dp.wifeName || dp.husbandName);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          {/* Header Skeleton */}
          <div className="bg-slate-900 rounded-[3rem] p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-8 bg-slate-700 rounded w-1/3"></div>
                <div className="h-4 bg-slate-700 rounded w-1/4"></div>
              </div>
            </div>
          </div>
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-gray-500 font-bold">العائلة غير موجودة</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              العودة للصفحة السابقة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayData = isEditMode && editableData ? editableData : dp;
  const currentFamilyMembers = isEditMode ? editableFamilyMembers : familyMembers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans" dir="rtl">
      {/* Font injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
        .font-sans { font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <ConfirmModal
        isOpen={showDeleteComplaintConfirm}
        title="تأكيد حذف الشكوى"
        message="هل أنت متأكد من حذف هذه الشكوى؟"
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={confirmDeleteComplaint}
        onCancel={() => {
          setShowDeleteComplaintConfirm(false);
          setComplaintToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={showDeleteReportConfirm}
        title="تأكيد حذف البلاغ"
        message="هل أنت متأكد من حذف هذا البلاغ؟"
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={confirmDeleteEmergencyReport}
        onCancel={() => {
          setShowDeleteReportConfirm(false);
          setReportToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={showDeleteMemberConfirm}
        title="تأكيد حذف الفرد"
        message="هل أنت متأكد من حذف هذا الفرد من الأسرة؟"
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={handleConfirmDeleteMember}
        onCancel={() => {
          setShowDeleteMemberConfirm(false);
          setMemberIndexToDelete(null);
        }}
      />

      {/* ====================================================================
          GLASSMORPHISM HEADER
      ==================================================================== */}
      <header className="relative bg-slate-900 overflow-hidden">
        {/* Decorative abstract shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-emerald-500/30 to-green-500/30 rounded-full blur-3xl"></div>
          <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="url(#gridGradient)" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>

        {/* Glassmorphism effect */}
        <div className="relative backdrop-blur-sm bg-slate-900/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Back button + Title */}
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all flex-shrink-0 backdrop-blur-sm"
                  title="العودة للصفحة السابقة"
                >
                  <Icons.ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-teal-400 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Icons.User className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="truncate">{isEditMode ? 'تعديل بيانات العائلة' : 'تفاصيل العائلة'}</span>
                  </h1>
                  <p className="text-white/70 text-xs sm:text-sm font-bold mt-1 truncate">
                    {getFullName(dp)}
                  </p>
                </div>
              </div>

              {/* Edit Mode Actions - Desktop */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end flex-shrink-0 hidden sm:flex">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                      <Icons.X className="w-5 h-5" />
                      إلغاء
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                    >
                      {isSaving ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Icons.Save className="w-5 h-5" />
                      )}
                      {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                  </>
                ) : (
                  canEdit() && (
                    <button
                      onClick={enterEditMode}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      <Icons.Edit className="w-5 h-5" />
                      تعديل
                    </button>
                  )
                )}
                {/* Logout Button - Always visible in desktop */}
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-xl font-bold transition-all flex items-center gap-2 backdrop-blur-sm border border-red-500/30"
                >
                  <Icons.LogOut className="w-5 h-5" />
                  تسجيل الخروج
                </button>
              </div>
            </div>

            {/* Mobile Logout Button - Visible only on mobile */}
            <div className="sm:hidden mt-4 w-full">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-xl font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-red-500/30"
              >
                <Icons.LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>

            {/* Unsaved changes indicator */}
            {isEditMode && hasUnsavedChanges && (
              <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                <Icons.Alert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-amber-200 font-bold text-sm">توجد تغييرات غير محفوظة. يرجى الحفظ قبل الخروج.</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================================
          STICKY TABBED NAVIGATION
      ==================================================================== */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.id === 'spouse' && !showSpouseTab;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/10'
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ====================================================================
          MAIN CONTENT - BENTO GRID
      ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32">
        
        {/* ===================== IDENTITY TAB ===================== */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            


            {/* Registration Status */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.Clipboard className="w-4 h-4" />
                </div>
                حالة التسجيل
              </h3>
              <div className={`inline-block px-6 py-3 rounded-2xl font-black text-lg ${
                dp.registrationStatus === 'قيد الانتظار' ? 'bg-amber-100 text-amber-700' :
                dp.registrationStatus === 'موافق' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-700'
              }`}>
                {dp.registrationStatus === 'قيد الانتظار' ? 'قيد الانتظار' :
                 dp.registrationStatus === 'موافق' ? 'موافق' : 'مرفوض'}
              </div>
            </div>

            {/* Personal Information */}
            <div className="md:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.User className="w-4 h-4" />
                </div>
                المعلومات الشخصية
              </h3>
              {isEditMode && editableData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الأول</label>
                    {isFieldEditable('head_first_name') ? (
                      <>
                        <input
                          type="text"
                          value={editableData.headFirstName || ''}
                          onChange={(e) => handleFieldChange('headFirstName', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.headFirstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                        />
                        {validationErrors.headFirstName && <p className="text-red-500 text-xs mt-1">{validationErrors.headFirstName}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.headFirstName || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم الأب</label>
                    {isFieldEditable('head_father_name') ? (
                      <>
                        <input
                          type="text"
                          value={editableData.headFatherName || ''}
                          onChange={(e) => handleFieldChange('headFatherName', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.headFatherName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                        />
                        {validationErrors.headFatherName && <p className="text-red-500 text-xs mt-1">{validationErrors.headFatherName}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.headFatherName || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم الجد</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_grandfather_name') ? (
                        <>
                          <input
                            type="text"
                            value={editableData.headGrandfatherName || ''}
                            onChange={(e) => handleFieldChange('headGrandfatherName', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.headGrandfatherName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                          />
                          {validationErrors.headGrandfatherName && <p className="text-red-500 text-xs mt-1">{validationErrors.headGrandfatherName}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.headGrandfatherName || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span>{dp.headGrandfatherName}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم العائلة</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_family_name') ? (
                        <>
                          <input
                            type="text"
                            value={editableData.headFamilyName || ''}
                            onChange={(e) => handleFieldChange('headFamilyName', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.headFamilyName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                          />
                          {validationErrors.headFamilyName && <p className="text-red-500 text-xs mt-1">{validationErrors.headFamilyName}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.headFamilyName || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span>{dp.headFamilyName}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الرقم الوطني</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_of_family_national_id') ? (
                        <>
                          <input
                            type="text"
                            value={editableData.nationalId || ''}
                            onChange={(e) => handleFieldChange('nationalId', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none dir-ltr ${validationErrors.nationalId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                            dir="ltr"
                          />
                          {validationErrors.nationalId && <p className="text-red-500 text-xs mt-1">{validationErrors.nationalId}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold dir-ltr">{editableData.nationalId || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span className="dir-ltr">{dp.nationalId}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الجنس</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_of_family_gender') ? (
                        <>
                          <select
                            value={editableData.gender || ''}
                            onChange={(e) => handleFieldChange('gender', e.target.value as 'ذكر' | 'أنثى')}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.gender ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                          >
                            <option value="">اختر الجنس</option>
                            <option value="ذكر">ذكر</option>
                            <option value="أنثى">أنثى</option>
                          </select>
                          {validationErrors.gender && <p className="text-red-500 text-xs mt-1">{validationErrors.gender}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.gender || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span>{dp.gender}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_of_family_date_of_birth') ? (
                        <>
                          <input
                            type="date"
                            value={editableData.dateOfBirth || ''}
                            onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.dateOfBirth ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                          />
                          {validationErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.dateOfBirth || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span>{dp.dateOfBirth}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العمر</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-black">
                      {calculateAge(editableData.dateOfBirth)} سنة
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الحالة الاجتماعية</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_of_family_marital_status') ? (
                        <>
                          <select
                            value={editableData.maritalStatus || ''}
                            onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${validationErrors.maritalStatus ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                          >
                            <option value="">اختر الحالة</option>
                            {Object.entries(MARITAL_STATUS).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                          {validationErrors.maritalStatus && <p className="text-red-500 text-xs mt-1">{validationErrors.maritalStatus}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.maritalStatus || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span>{dp.maritalStatus}</span>
                    )}
                  </div>

                  {/* Widow Reason - Show only when marital status is Widow */}
                  {editableData.maritalStatus === 'أرمل' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">سبب الوفاة</label>
                      {isEditMode && editableData ? (
                        isFieldEditable('head_of_family_widow_reason') ? (
                          <>
                            <select
                              value={editableData.widowReason || ''}
                              onChange={(e) => handleFieldChange('widowReason', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">اختر السبب</option>
                              {Object.entries(WIDOW_REASONS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            {validationErrors.widowReason && <p className="text-red-500 text-xs mt-1">{validationErrors.widowReason}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.widowReason || '-'}</span>
                          </div>
                        )
                      ) : (
                        <span>{dp.widowReason}</span>
                      )}
                    </div>
                  )}

                  {/* Head Role - Show only when NOT single */}
                  {editableData.maritalStatus && editableData.maritalStatus !== 'أعزب' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">صفة ربّ الأسرة</label>
                      {isEditMode && editableData ? (
                        isFieldEditable('head_of_family_role') ? (
                          <>
                            <select
                              value={editableData.headRole || ''}
                              onChange={(e) => handleFieldChange('headRole', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">اختر الصفة</option>
                              {Object.entries(HEAD_ROLES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            {validationErrors.headRole && <p className="text-red-500 text-xs mt-1">{validationErrors.headRole}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{dp.headRole ? HEAD_ROLES[dp.headRole] || dp.headRole : '-'}</span>
                          </div>
                        )
                      ) : (
                        <span>{dp.headRole}</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">الاسم الكامل</span>
                    <span className="font-black text-gray-800">{getFullName(dp)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">الرقم الوطني</span>
                    <span className="font-black text-gray-800 dir-ltr">{dp.nationalId}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">الجنس</span>
                    <span className="font-black text-gray-800">{dp.gender}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">تاريخ الميلاد</span>
                    <span className="font-black text-gray-800">{dp.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">العمر</span>
                    <span className="font-black text-gray-800">{dp.age} سنوات</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-500 font-bold text-sm">الحالة الاجتماعية</span>
                    <span className={`px-4 py-1.5 rounded-full font-black text-sm ${MARITAL_STATUS[dp.maritalStatus as keyof typeof MARITAL_STATUS]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {MARITAL_STATUS[dp.maritalStatus as keyof typeof MARITAL_STATUS]?.label || dp.maritalStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.Phone className="w-4 h-4" />
                </div>
                معلومات الاتصال
              </h3>
              {isEditMode && editableData ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_of_family_phone_number') ? (
                        <>
                          <input
                            type="tel"
                            value={editableData.phoneNumber || ''}
                            onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none dir-ltr ${validationErrors.phoneNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
                            dir="ltr"
                          />
                          {validationErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold dir-ltr">{editableData.phoneNumber || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span className="dir-ltr">{dp.phoneNumber}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف البديل</label>
                    {isEditMode && editableData ? (
                      isFieldEditable('head_of_family_phone_secondary') ? (
                        <>
                          <input
                            type="tel"
                            value={editableData.phoneSecondary || ''}
                            onChange={(e) => handleFieldChange('phoneSecondary', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none dir-ltr"
                            dir="ltr"
                          />
                          {validationErrors.phoneSecondary && <p className="text-red-500 text-xs mt-1">{validationErrors.phoneSecondary}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold dir-ltr">{editableData.phoneSecondary || '-'}</span>
                        </div>
                      )
                    ) : (
                      <span className="dir-ltr">{dp.phoneSecondary}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">رقم الهاتف</span>
                    <span className="font-black text-gray-800 dir-ltr">{dp.phoneNumber}</span>
                  </div>
                  {dp.phoneSecondary && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">الهاتف البديل</span>
                      <span className="font-black text-gray-800 dir-ltr">{dp.phoneSecondary}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Work Information */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <Icons.Clipboard className="w-4 h-4" />
                </div>
                العمل والدخل
              </h3>
              {isEditMode && editableData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {isFieldEditable('head_of_family_is_working') ? (
                      <>
                        <input
                          type="checkbox"
                          id="isWorking"
                          checked={editableData.isWorking || false}
                          onChange={(e) => handleFieldChange('isWorking', e.target.checked)}
                          className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="isWorking" className="text-sm font-bold text-gray-700">يعمل حالياً</label>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.isWorking ? 'نعم' : 'لا'}</span>
                      </div>
                    )}
                  </div>
                  {editableData.isWorking && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">الوظيفة</label>
                        {isFieldEditable('head_of_family_job') ? (
                          <>
                            <input
                              type="text"
                              value={editableData.job || ''}
                              onChange={(e) => handleFieldChange('job', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              placeholder="المهنة"
                            />
                            {validationErrors.job && <p className="text-red-500 text-xs mt-1">{validationErrors.job}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.job || '-'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">الدخل الشهري التقريبي</label>
                        {isFieldEditable('head_of_family_monthly_income') ? (
                          <>
                            <input
                              type="number"
                              value={editableData.monthlyIncome || ''}
                              onChange={(e) => handleFieldChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              placeholder="0"
                              step="0.01"
                              min="0"
                            />
                            {validationErrors.monthlyIncome && <p className="text-red-500 text-xs mt-1">{validationErrors.monthlyIncome}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.monthlyIncome || '-'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نطاق الدخل الشهري</label>
                        {isFieldEditable('head_of_family_monthly_income_range') ? (
                          <>
                            <select
                              value={editableData.monthlyIncomeRange || ''}
                              onChange={(e) => handleFieldChange('monthlyIncomeRange', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="">اختر النطاق</option>
                              <option value="بدون دخل">بدون دخل</option>
                              <option value="أقل من 100">أقل من 100 شيكل</option>
                              <option value="100-300">100 - 300 شيكل</option>
                              <option value="300-500">300 - 500 شيكل</option>
                              <option value="أكثر من 500">أكثر من 500 شيكل</option>
                            </select>
                            {validationErrors.monthlyIncomeRange && <p className="text-red-500 text-xs mt-1">{validationErrors.monthlyIncomeRange}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.monthlyIncomeRange || '-'}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {dp.isWorking !== undefined && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">يعمل حالياً</span>
                      <span className={`px-3 py-1 rounded-full font-black text-sm ${dp.isWorking ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {dp.isWorking ? 'نعم' : 'لا'}
                      </span>
                    </div>
                  )}
                  {dp.isWorking && dp.job && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">الوظيفة</span>
                      <span className="font-black text-gray-800">{dp.job}</span>
                    </div>
                  )}
                  {dp.isWorking && dp.monthlyIncome !== undefined && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">الدخل الشهري</span>
                      <span className="font-black text-gray-800">{dp.monthlyIncome} شيكل</span>
                    </div>
                  )}
                  {dp.isWorking && dp.monthlyIncomeRange && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">نطاق الدخل</span>
                      <span className="font-black text-gray-800">{dp.monthlyIncomeRange}</span>
                    </div>
                  )}
                  {!dp.isWorking && (
                    <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات العمل</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* ===================== FAMILY TAB ===================== */}
        {activeTab === 'family' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Family Composition Stats */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6 mb-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.Users className="w-4 h-4" />
                </div>
                تركيب الأسرة
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">ذكور</p>
                  <p className="font-black text-emerald-700 text-3xl">{dp.maleCount || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">إناث</p>
                  <p className="font-black text-pink-700 text-3xl">{dp.femaleCount || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">أطفال</p>
                  <p className="font-black text-amber-700 text-3xl">{dp.childCount || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">كبار السن</p>
                  <p className="font-black text-emerald-700 text-3xl">{dp.seniorCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Family Members Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Icons.Users className="w-4 h-4" />
                  </div>
                  أفراد العائلة ({currentFamilyMembers.length})
                </h3>
                {isEditMode && isFieldEditable('family_members') && (
                  <button
                    onClick={openAddMemberModal}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <Icons.Plus className="w-4 h-4" />
                    إضافة فرد
                  </button>
                )}
                {isEditMode && !isFieldEditable('family_members') && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border-2 border-gray-200">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-gray-500 font-bold text-sm">لا يمكن إضافة أفراد</span>
                  </div>
                )}
              </div>
              {currentFamilyMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الاسم الكامل</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الرقم الوطني</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الجنس</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">تاريخ الميلاد</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">العمر</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الصلة</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الحالة الصحية</th>
                        {isEditMode && (
                          <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">إجراءات</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentFamilyMembers.map((member, index) => (
                        <tr key={member.id || index} className="hover:bg-gray-50 transition-all">
                          <td className="px-4 py-3 text-sm font-black text-gray-800">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-black text-gray-800">{member.name || `${member.firstName} ${member.fatherName} ${member.grandfatherName} ${member.familyName}`.trim()}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-600 dir-ltr">{member.nationalId || '-'}</td>
                          <td className="px-4 py-3 text-sm font-black text-gray-800">
                            <span className={`px-2 py-1 rounded-lg text-xs ${
                              member.gender === 'ذكر' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                            }`}>
                              {member.gender === 'ذكر' ? 'ذكر' : 'أنثى'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-600">{member.dateOfBirth || '-'}</td>
                          <td className="px-4 py-3 text-sm font-black text-gray-800">{member.age || '-'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-600">
                            {translateRelation(member.relation)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {member.disabilityType && member.disabilityType.trim() !== 'لا يوجد' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                  إعاقة
                                </span>
                              )}
                              {member.chronicDiseaseType && member.chronicDiseaseType.trim() !== 'لا يوجد' && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                                  مرض مزمن
                                </span>
                              )}
                              {member.hasWarInjury && member.warInjuryType && member.warInjuryType.trim() !== 'لا يوجد' && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                                  إصابة حرب
                                </span>
                              )}
                              {member.medicalFollowupRequired && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                                  متابعة طبية
                                </span>
                              )}
                              {(!member.disabilityType || member.disabilityType.trim() === 'لا يوجد') && 
                               (!member.chronicDiseaseType || member.chronicDiseaseType.trim() === 'لا يوجد') && 
                               !member.hasWarInjury && 
                               !member.medicalFollowupRequired && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                                  سليم
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {/* View Button - Always Visible */}
                              <button
                                onClick={() => openViewMemberModal(index)}
                                className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all"
                                title="عرض"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              {/* Edit & Delete Buttons - Only in Edit Mode AND if family_members permission is enabled */}
                              {isEditMode && isFieldEditable('family_members') && (
                                <>
                                  <button
                                    onClick={() => openEditMemberModal(index)}
                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                                    title="تعديل"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteMember(index)}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                                    title="حذف"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              {/* Show locked indicator when in edit mode but no permission */}
                              {isEditMode && !isFieldEditable('family_members') && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-400 rounded-lg" title="لا يمكن التعديل أو الحذف">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 font-bold text-sm">لا توجد بيانات أفراد العائلة</p>
                  {isEditMode && (
                    <button
                      onClick={openAddMemberModal}
                      className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                    >
                      إضافة فرد جديد
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== HOUSING TAB ===================== */}
        {activeTab === 'housing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Current Housing */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.Home className="w-4 h-4" />
                </div>
                السكن الحالي
              </h3>
              {isEditMode && editableData ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">نوع السكن</label>
                    {isFieldEditable('current_housing_type') ? (
                      <>
                        <select
                          value={editableData.currentHousingType || ''}
                          onChange={(e) => handleFieldChange('currentHousingType', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر النوع</option>
                          <option value="خيمة">خيمة</option>
                          <option value="بيت إسمنتي">بيت إسمنتي</option>
                          <option value="شقة">شقة</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                        {validationErrors.currentHousingType && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingType}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingType || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المحافظة</label>
                    {isFieldEditable('current_housing_governorate') ? (
                      <>
                        <select
                          value={editableData.currentHousingGovernorate || ''}
                          onChange={(e) => handleFieldChange('currentHousingGovernorate', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر المحافظة</option>
                          {GAZA_LOCATIONS.map((gov) => (
                            <option key={gov.name} value={gov.arabic_name}>{gov.arabic_name}</option>
                          ))}
                        </select>
                        {validationErrors.currentHousingGovernorate && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingGovernorate}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingGovernorate || '-'}</span>
                      </div>
                    )}
                  </div>
                  {editableData.currentHousingGovernorate && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المنطقة</label>
                      {isFieldEditable('current_housing_region') ? (
                        <>
                          <select
                            value={editableData.currentHousingRegion || ''}
                            onChange={(e) => handleFieldChange('currentHousingRegion', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="">اختر المنطقة</option>
                            {availableCurrentAreas.map((area) => (
                              <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                            ))}
                          </select>
                          {validationErrors.currentHousingRegion && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingRegion}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.currentHousingRegion || '-'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">علامة مميزة</label>
                    {isFieldEditable('current_housing_landmark') ? (
                      <>
                        <input
                          type="text"
                          value={editableData.currentHousingLandmark || ''}
                          onChange={(e) => handleFieldChange('currentHousingLandmark', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          placeholder="مثال: بالقرب من المسجد، أمام المدرسة..."
                        />
                        {validationErrors.currentHousingLandmark && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingLandmark}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingLandmark || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الوحدة/الخيمة</label>
                    {isFieldEditable('current_housing_unit_number') ? (
                      <>
                        <input
                          type="text"
                          value={editableData.unitNumber || ''}
                          onChange={(e) => handleFieldChange('unitNumber', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          placeholder="رقم الوحدة أو الخيمة"
                        />
                        {validationErrors.unitNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.unitNumber}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.unitNumber || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة السكن مناسبة</label>
                    {isFieldEditable('current_housing_is_suitable_for_family_size') ? (
                      <>
                        <select
                          value={editableData.currentHousingIsSuitable ? 'نعم' : 'لا'}
                          onChange={(e) => handleFieldChange('currentHousingIsSuitable', e.target.value === 'نعم')}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="نعم">نعم</option>
                          <option value="لا">لا</option>
                        </select>
                        {validationErrors.currentHousingIsSuitable && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingIsSuitable}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingIsSuitable ? 'نعم' : 'لا'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المرافق الصحية</label>
                    {isFieldEditable('current_housing_sanitary_facilities') ? (
                      <>
                        <select
                          value={editableData.currentHousingSanitaryFacilities || ''}
                          onChange={(e) => handleFieldChange('currentHousingSanitaryFacilities', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر المرافق الصحية</option>
                          <option value="نعم (دورة مياه خاصة)">نعم (دورة مياه خاصة)</option>
                          <option value="لا (مرافق مشتركة)">لا (مرافق مشتركة)</option>
                        </select>
                        {validationErrors.currentHousingSanitaryFacilities && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingSanitaryFacilities}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingSanitaryFacilities || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">مصدر المياه</label>
                    {isFieldEditable('current_housing_water_source') ? (
                      <>
                        <select
                          value={editableData.currentHousingWaterSource || ''}
                          onChange={(e) => handleFieldChange('currentHousingWaterSource', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر مصدر المياه</option>
                          <option value="شبكة عامة">شبكة عامة</option>
                          <option value="صهاريج">صهاريج</option>
                          <option value="آبار">آبار</option>
                          <option value="آخر">آخر</option>
                        </select>
                        {validationErrors.currentHousingWaterSource && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingWaterSource}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingWaterSource || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">مصدر الكهرباء</label>
                    {isFieldEditable('current_housing_electricity_access') ? (
                      <>
                        <select
                          value={editableData.currentHousingElectricityAccess || ''}
                          onChange={(e) => handleFieldChange('currentHousingElectricityAccess', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر مصدر الكهرباء</option>
                          <option value="شبكة عامة">شبكة عامة</option>
                          <option value="مولد">مولد</option>
                          <option value="طاقة شمسية">طاقة شمسية</option>
                          <option value="لا يوجد">لا يوجد</option>
                          <option value="آخر">آخر</option>
                        </select>
                        {validationErrors.currentHousingElectricityAccess && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingElectricityAccess}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingElectricityAccess || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة المشاركة</label>
                    {isFieldEditable('current_housing_sharing_status') ? (
                      <>
                        <select
                          value={editableData.currentHousingSharingStatus || ''}
                          onChange={(e) => handleFieldChange('currentHousingSharingStatus', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر حالة المشاركة</option>
                          <option value="سكن فردي">سكن فردي</option>
                          <option value="سكن مشترك">سكن مشترك</option>
                        </select>
                        {validationErrors.currentHousingSharingStatus && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingSharingStatus}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingSharingStatus || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">مفروش</label>
                    {isFieldEditable('current_housing_furnished') ? (
                      <>
                        <select
                          value={editableData.currentHousingFurnished ? 'نعم' : 'لا'}
                          onChange={(e) => handleFieldChange('currentHousingFurnished', e.target.value === 'نعم')}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="نعم">نعم</option>
                          <option value="لا">لا</option>
                        </select>
                        {validationErrors.currentHousingFurnished && <p className="text-red-500 text-xs mt-1">{validationErrors.currentHousingFurnished}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.currentHousingFurnished ? 'نعم' : 'لا'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {dp.currentHousingType && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">نوع السكن</span>
                      <span className="font-black text-gray-800">{HOUSING_TYPES[dp.currentHousingType as keyof typeof HOUSING_TYPES] || dp.currentHousingType}</span>
                    </div>
                  )}
                  {dp.currentHousingGovernorate && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المحافظة</span>
                      <span className="font-black text-gray-800">{dp.currentHousingGovernorate}</span>
                    </div>
                  )}
                  {dp.currentHousingRegion && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المنطقة</span>
                      <span className="font-black text-gray-800">{dp.currentHousingRegion}</span>
                    </div>
                  )}
                  {dp.currentHousingLandmark && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">علامة مميزة</span>
                      <span className="font-black text-gray-800">{dp.currentHousingLandmark}</span>
                    </div>
                  )}
                  {dp.unitNumber && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-500 font-bold text-sm">رقم الوحدة/الخيمة</span>
                      <span className="font-black text-gray-800">{dp.unitNumber}</span>
                    </div>
                  )}
                  {dp.currentHousingIsSuitable !== undefined && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">السكن مناسب</span>
                      <span className={`px-4 py-1.5 rounded-full font-black text-sm ${dp.currentHousingIsSuitable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {dp.currentHousingIsSuitable ? 'نعم' : 'لا'}
                      </span>
                    </div>
                  )}
                  {dp.currentHousingSanitaryFacilities && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المرافق الصحية</span>
                      <span className="font-black text-gray-800">
                        {dp.currentHousingSanitaryFacilities}
                      </span>
                    </div>
                  )}
                  {dp.currentHousingWaterSource && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">مصدر المياه</span>
                      <span className="font-black text-gray-800">
                        {dp.currentHousingWaterSource}
                      </span>
                    </div>
                  )}
                  {dp.currentHousingElectricityAccess && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">مصدر الكهرباء</span>
                      <span className="font-black text-gray-800">
                        {dp.currentHousingElectricityAccess}
                      </span>
                    </div>
                  )}
                  {dp.currentHousingSharingStatus && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">حالة المشاركة</span>
                      <span className="font-black text-gray-800">
                        {dp.currentHousingSharingStatus}
                      </span>
                    </div>
                  )}
                  {dp.currentHousingFurnished !== undefined && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">مفروش</span>
                      <span className={`px-4 py-1.5 rounded-full font-black text-sm ${dp.currentHousingFurnished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {dp.currentHousingFurnished ? 'نعم' : 'لا'}
                      </span>
                    </div>
                  )}
                  {!dp.currentHousingType && !dp.currentHousingGovernorate && !dp.currentHousingLandmark && (
                    <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات السكن الحالي</p>
                  )}
                </div>
              )}
            </div>

            {/* Original Address */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <Icons.MapPin className="w-4 h-4" />
                </div>
                العنوان الأصلي
              </h3>
              {isEditMode && editableData ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المحافظة</label>
                    {isFieldEditable('original_address_governorate') ? (
                      <>
                        <select
                          value={editableData.originalAddressGovernorate || ''}
                          onChange={(e) => handleFieldChange('originalAddressGovernorate', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر المحافظة</option>
                          {GAZA_LOCATIONS.map((gov) => (
                            <option key={gov.name} value={gov.arabic_name}>{gov.arabic_name}</option>
                          ))}
                        </select>
                        {validationErrors.originalAddressGovernorate && <p className="text-red-500 text-xs mt-1">{validationErrors.originalAddressGovernorate}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.originalAddressGovernorate || '-'}</span>
                      </div>
                    )}
                  </div>
                  {editableData.originalAddressGovernorate && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المنطقة</label>
                      {isFieldEditable('original_address_region') ? (
                        <>
                          <select
                            value={editableData.originalAddressRegion || ''}
                            onChange={(e) => handleFieldChange('originalAddressRegion', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="">اختر المنطقة</option>
                            {availableOrigAreas.map((area) => (
                              <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                            ))}
                          </select>
                          {validationErrors.originalAddressRegion && <p className="text-red-500 text-xs mt-1">{validationErrors.originalAddressRegion}</p>}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.originalAddressRegion || '-'}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل العنوان</label>
                    {isFieldEditable('original_address_details') ? (
                      <>
                        <textarea
                          value={editableData.originalAddressDetails || ''}
                          onChange={(e) => handleFieldChange('originalAddressDetails', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          rows={3}
                          placeholder="اكتب تفاصيل العنوان الأصلي..."
                        />
                        {validationErrors.originalAddressDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.originalAddressDetails}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.originalAddressDetails || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">نوع السكن الأصلي</label>
                    {isFieldEditable('original_address_housing_type') ? (
                      <>
                        <select
                          value={editableData.originalAddressHousingType || ''}
                          onChange={(e) => handleFieldChange('originalAddressHousingType', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر النوع</option>
                          <option value="ملك">ملك</option>
                          <option value="إيجار">إيجار</option>
                        </select>
                        {validationErrors.originalAddressHousingType && <p className="text-red-500 text-xs mt-1">{validationErrors.originalAddressHousingType}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.originalAddressHousingType || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {dp.originalAddressGovernorate && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المحافظة</span>
                      <span className="font-black text-gray-800">{dp.originalAddressGovernorate}</span>
                    </div>
                  )}
                  {dp.originalAddressRegion && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المنطقة</span>
                      <span className="font-black text-gray-800">{dp.originalAddressRegion}</span>
                    </div>
                  )}
                  {dp.originalAddressDetails && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">تفاصيل العنوان</span>
                      <span className="font-black text-gray-800">{dp.originalAddressDetails}</span>
                    </div>
                  )}
                  {dp.originalAddressHousingType && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">نوع السكن</span>
                      <span className="font-black text-gray-800">{dp.originalAddressHousingType}</span>
                    </div>
                  )}
                  {!dp.originalAddressGovernorate && !dp.originalAddressRegion && (
                    <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات العنوان الأصلي</p>
                  )}
                </div>
              )}
            </div>

            {/* Refugee/Resident Abroad */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Icons.MapPin className="w-4 h-4" />
                </div>
                لاجئ / مقيم بالخارج
              </h3>
              {isEditMode && editableData ? (
                <div className="space-y-4">
                  {/* Toggle for Is Resident Abroad */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100" dir="rtl">
                    <div className="flex items-center gap-3 gap-reverse">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icons.MapPin className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <label className="block text-sm font-black text-gray-800">لاجئ / مقيم بالخارج</label>
                        <p className="text-xs text-gray-500">هل الفرد لاجئ أو مقيم حالياً خارج فلسطين</p>
                      </div>
                    </div>
                    {isFieldEditable('is_resident_abroad') ? (
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = !(editableData.isResidentAbroad ?? false);
                          // Update all fields in a single state update
                          setEditableData({
                            ...editableData,
                            isResidentAbroad: newValue,
                            // Clear detail fields when turning off
                            refugeeResidentAbroadCountry: newValue ? editableData.refugeeResidentAbroadCountry : '',
                            refugeeResidentAbroadCity: newValue ? editableData.refugeeResidentAbroadCity : '',
                            refugeeResidentAbroadResidenceType: newValue ? editableData.refugeeResidentAbroadResidenceType : '',
                          });
                          setHasUnsavedChanges(true);
                        }}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${
                          editableData.isResidentAbroad ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                        aria-pressed={editableData.isResidentAbroad}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            editableData.isResidentAbroad ? '-translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <span className={`px-4 py-2 text-sm font-bold rounded-full ${editableData.isResidentAbroad ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {editableData.isResidentAbroad ? 'نعم' : 'لا'}
                      </span>
                    )}
                  </div>

                  {/* Detail fields - only shown when isResidentAbroad is true */}
                  {editableData.isResidentAbroad && (
                    <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الدولة</label>
                    {isFieldEditable('refugee_resident_abroad_country') ? (
                      <>
                        <input
                          type="text"
                          value={editableData.refugeeResidentAbroadCountry || ''}
                          onChange={(e) => handleFieldChange('refugeeResidentAbroadCountry', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          placeholder="اسم الدولة"
                        />
                        {validationErrors.refugeeResidentAbroadCountry && <p className="text-red-500 text-xs mt-1">{validationErrors.refugeeResidentAbroadCountry}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.refugeeResidentAbroadCountry || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المدينة</label>
                    {isFieldEditable('refugee_resident_abroad_city') ? (
                      <>
                        <input
                          type="text"
                          value={editableData.refugeeResidentAbroadCity || ''}
                          onChange={(e) => handleFieldChange('refugeeResidentAbroadCity', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                          placeholder="اسم المدينة"
                        />
                        {validationErrors.refugeeResidentAbroadCity && <p className="text-red-500 text-xs mt-1">{validationErrors.refugeeResidentAbroadCity}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.refugeeResidentAbroadCity || '-'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإقامة</label>
                    {isFieldEditable('refugee_resident_abroad_residence_type') ? (
                      <>
                        <select
                          value={editableData.refugeeResidentAbroadResidenceType || ''}
                          onChange={(e) => handleFieldChange('refugeeResidentAbroadResidenceType', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">اختر النوع</option>
                          <option value="لاجئ">لاجئ</option>
                          <option value="مقيم نظامي">مقيم نظامي</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                        {validationErrors.refugeeResidentAbroadResidenceType && <p className="text-red-500 text-xs mt-1">{validationErrors.refugeeResidentAbroadResidenceType}</p>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-gray-500 font-bold">{editableData.refugeeResidentAbroadResidenceType || '-'}</span>
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100" dir="rtl">
                    <div className="flex items-center gap-3 gap-reverse">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icons.MapPin className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-gray-800 text-right">حالة الإقامة بالخارج</span>
                    </div>
                    {dp.isResidentAbroad ? (
                      <span className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full">
                        نعم - لاجئ / مقيم بالخارج
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-full">
                        لا - مقيم في فلسطين
                      </span>
                    )}
                  </div>

                  {/* Detail fields - only shown when isResidentAbroad is true */}
                  {dp.isResidentAbroad && (
                    <>
                  {dp.refugeeResidentAbroadCountry && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">الدولة</span>
                      <span className="font-black text-gray-800">{dp.refugeeResidentAbroadCountry}</span>
                    </div>
                  )}
                  {dp.refugeeResidentAbroadCity && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المدينة</span>
                      <span className="font-black text-gray-800">{dp.refugeeResidentAbroadCity}</span>
                    </div>
                  )}
                  {dp.refugeeResidentAbroadResidenceType && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">نوع الإقامة</span>
                      <span className="font-black text-gray-800">{dp.refugeeResidentAbroadResidenceType}</span>
                    </div>
                  )}
                    </>
                  )}
                  {!dp.isResidentAbroad && (
                    <p className="text-gray-500 text-sm font-bold text-center py-4">الفرد مقيم في فلسطين - لا توجد بيانات خارجية</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== HEALTH TAB ===================== */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Head of Family Health */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                  <Icons.Heart className="w-4 h-4" />
                </div>
                صحة رب الأسرة
              </h3>
              {isEditMode && editableData ? (
                <div className="space-y-6">
                  {/* Disability Section */}
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                      <Icons.Alert className="w-5 h-5" />
                      الإعاقة
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإعاقة</label>
                        {isFieldEditable('head_of_family_disability_type') ? (
                          <>
                            <select
                              value={editableData.disabilityType || 'لا يوجد'}
                              onChange={(e) => handleFieldChange('disabilityType', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                              {Object.entries(DISABILITY_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            {validationErrors.disabilityType && <p className="text-red-500 text-xs mt-1">{validationErrors.disabilityType}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.disabilityType || '-'}</span>
                          </div>
                        )}
                      </div>
                      {editableData.disabilityType && editableData.disabilityType !== 'لا يوجد' && (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">درجة الإعاقة</label>
                            {isFieldEditable('head_of_family_disability_severity') ? (
                              <>
                                <select
                                  value={editableData.disabilitySeverity || ''}
                                  onChange={(e) => handleFieldChange('disabilitySeverity', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                >
                                  <option value="">اختر الدرجة</option>
                                  {Object.entries(DISABILITY_SEVERITY).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                  ))}
                                </select>
                                {validationErrors.disabilitySeverity && <p className="text-red-500 text-xs mt-1">{validationErrors.disabilitySeverity}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.disabilitySeverity || '-'}</span>
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                            {isFieldEditable('head_of_family_disability_details') ? (
                              <>
                                <textarea
                                  value={editableData.disabilityDetails || ''}
                                  onChange={(e) => handleFieldChange('disabilityDetails', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  rows={3}
                                  placeholder="اكتب تفاصيل الإعاقة..."
                                />
                                {validationErrors.disabilityDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.disabilityDetails}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.disabilityDetails || '-'}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chronic Disease Section */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <h4 className="font-black text-orange-800 mb-4 flex items-center gap-2">
                      <Icons.Heart className="w-5 h-5" />
                      المرض المزمن
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع المرض</label>
                        {isFieldEditable('head_of_family_chronic_disease_type') ? (
                          <>
                            <select
                              value={editableData.chronicDiseaseType || 'لا يوجد'}
                              onChange={(e) => handleFieldChange('chronicDiseaseType', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                              {Object.entries(CHRONIC_DISEASE_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            {validationErrors.chronicDiseaseType && <p className="text-red-500 text-xs mt-1">{validationErrors.chronicDiseaseType}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.chronicDiseaseType || '-'}</span>
                          </div>
                        )}
                      </div>
                      {editableData.chronicDiseaseType && editableData.chronicDiseaseType !== 'لا يوجد' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض</label>
                          {isFieldEditable('head_of_family_chronic_disease_details') ? (
                            <>
                              <textarea
                                value={editableData.chronicDiseaseDetails || ''}
                                onChange={(e) => handleFieldChange('chronicDiseaseDetails', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                rows={3}
                                placeholder="اكتب تفاصيل المرض المزمن..."
                              />
                              {validationErrors.chronicDiseaseDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.chronicDiseaseDetails}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.chronicDiseaseDetails || '-'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* War Injury Section */}
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <h4 className="font-black text-purple-800 mb-4 flex items-center gap-2">
                      <Icons.Alert className="w-5 h-5" />
                      إصابة الحرب
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإصابة</label>
                        {isFieldEditable('head_of_family_war_injury_type') ? (
                          <>
                            <select
                              value={editableData.warInjuryType || 'لا يوجد'}
                              onChange={(e) => handleFieldChange('warInjuryType', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                            >
                              {Object.entries(WAR_INJURY_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            {validationErrors.warInjuryType && <p className="text-red-500 text-xs mt-1">{validationErrors.warInjuryType}</p>}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-gray-500 font-bold">{editableData.warInjuryType || '-'}</span>
                          </div>
                        )}
                      </div>
                      {editableData.warInjuryType && editableData.warInjuryType !== 'لا يوجد' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة</label>
                          {isFieldEditable('head_of_family_war_injury_details') ? (
                            <>
                              <textarea
                                value={editableData.warInjuryDetails || ''}
                                onChange={(e) => handleFieldChange('warInjuryDetails', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                rows={3}
                                placeholder="اكتب تفاصيل إصابة الحرب..."
                              />
                              {validationErrors.warInjuryDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.warInjuryDetails}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.warInjuryDetails || '-'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Followup Section */}
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                      <Icons.Clipboard className="w-5 h-5" />
                      المتابعة الطبية
                    </h4>
                    <div className="flex items-center gap-2 mb-4">
                      {isFieldEditable('head_of_family_medical_followup_required') ? (
                        <>
                          <input
                            type="checkbox"
                            id="medicalFollowupRequired"
                            checked={editableData.medicalFollowupRequired || false}
                            onChange={(e) => handleFieldChange('medicalFollowupRequired', e.target.checked)}
                            className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                          />
                          <label htmlFor="medicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-500 font-bold">{editableData.medicalFollowupRequired ? 'نعم' : 'لا'}</span>
                        </div>
                      )}
                    </div>
                    {editableData.medicalFollowupRequired && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                          {isFieldEditable('head_of_family_medical_followup_frequency') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.medicalFollowupFrequency || ''}
                                onChange={(e) => handleFieldChange('medicalFollowupFrequency', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                placeholder="مثال: شهرياً، أسبوعياً..."
                              />
                              {validationErrors.medicalFollowupFrequency && <p className="text-red-500 text-xs mt-1">{validationErrors.medicalFollowupFrequency}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.medicalFollowupFrequency || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                          {isFieldEditable('head_of_family_medical_followup_details') ? (
                            <>
                              <textarea
                                value={editableData.medicalFollowupDetails || ''}
                                onChange={(e) => handleFieldChange('medicalFollowupDetails', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                rows={3}
                                placeholder="اكتب تفاصيل المتابعة الطبية..."
                              />
                              {validationErrors.medicalFollowupDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.medicalFollowupDetails}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.medicalFollowupDetails || '-'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {dp.disabilityType && dp.disabilityType !== 'لا يوجد' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="font-black text-red-800 mb-2">الإعاقة</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                          <p className="font-black text-gray-800">{dp.disabilityType}</p>
                        </div>
                        {dp.disabilitySeverity && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">الدرجة</p>
                            <p className="font-black text-gray-800">{dp.disabilitySeverity}</p>
                          </div>
                        )}
                      </div>
                      {dp.disabilityDetails && (
                        <p className="text-gray-700 text-sm mt-2">{dp.disabilityDetails}</p>
                      )}
                    </div>
                  )}
                  {dp.chronicDiseaseType && dp.chronicDiseaseType !== 'لا يوجد' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <p className="font-black text-orange-800 mb-2">المرض المزمن</p>
                      <p className="font-black text-gray-800">{dp.chronicDiseaseType}</p>
                      {dp.chronicDiseaseDetails && (
                        <p className="text-gray-700 text-sm mt-2">{dp.chronicDiseaseDetails}</p>
                      )}
                    </div>
                  )}
                  {dp.warInjuryType && dp.warInjuryType !== 'لا يوجد' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="font-black text-purple-800 mb-2">إصابة الحرب</p>
                      <p className="font-black text-gray-800">{dp.warInjuryType}</p>
                      {dp.warInjuryDetails && (
                        <p className="text-gray-700 text-sm mt-2">{dp.warInjuryDetails}</p>
                      )}
                    </div>
                  )}
                  {dp.medicalFollowupRequired && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="font-black text-red-800 mb-2">المتابعة الطبية</p>
                      {dp.medicalFollowupFrequency && (
                        <p className="text-gray-700 font-bold">التكرار: {dp.medicalFollowupFrequency}</p>
                      )}
                      {dp.medicalFollowupDetails && (
                        <p className="text-gray-700 text-sm mt-2">{dp.medicalFollowupDetails}</p>
                      )}
                    </div>
                  )}
                  {!dp.disabilityType && !dp.chronicDiseaseType && !dp.warInjuryType && !dp.medicalFollowupRequired ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                      <Icons.Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-black text-emerald-800">رب الأسرة بصحة جيدة</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm font-bold text-center py-8">لا توجد بيانات صحية</p>
                  )}
                </div>
              )}
            </div>

            {/* Female Head Pregnancy - Health Tab (same as spouse tab) */}
            {isFemaleHead(dp.headRole, dp.gender) && (
            <div className="bg-pink-50 border-2 border-pink-200 rounded-[2rem] p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-black text-pink-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
                  <Icons.Baby className="w-4 h-4" />
                </div>
                معلومات الحمل (رب أسرة أنثى)
              </h3>
              {isEditMode && editableData ? (
                <div className="bg-white rounded-xl p-4 border border-pink-100">
                  <h4 className="font-black text-pink-700 mb-3">معلومات الحمل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {isFieldEditable('wife_is_pregnant') ? (
                        <>
                          <input
                            type="checkbox"
                            id="wifeIsPregnant"
                            checked={editableData.wifeIsPregnant || false}
                            onChange={(e) => handleFieldChange('wifeIsPregnant', e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <label htmlFor="wifeIsPregnant" className="text-sm font-bold text-gray-700">حامل حالياً</label>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="font-bold">{editableData.wifeIsPregnant ? 'نعم' : 'لا'}</span>
                        </div>
                      )}
                    </div>
                    {editableData.wifeIsPregnant && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">شهر الحمل</label>
                          {isFieldEditable('wife_pregnancy_month') ? (
                            <>
                              <input
                                type="number"
                                value={editableData.wifePregnancyMonth || ''}
                                onChange={(e) => handleFieldChange('wifePregnancyMonth', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                placeholder="شهر الحمل"
                                min="1"
                                max="9"
                              />
                              {validationErrors.wifePregnancyMonth && <p className="text-red-500 text-xs mt-1">{validationErrors.wifePregnancyMonth}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">شهر {editableData.wifePregnancyMonth || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isFieldEditable('wife_pregnancy_special_needs') ? (
                            <>
                              <input
                                type="checkbox"
                                id="wifePregnancySpecialNeeds"
                                checked={editableData.wifePregnancySpecialNeeds || false}
                                onChange={(e) => handleFieldChange('wifePregnancySpecialNeeds', e.target.checked)}
                                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                              />
                              <label htmlFor="wifePregnancySpecialNeeds" className="text-sm font-bold text-gray-700">احتياجات خاصة</label>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="font-bold">{editableData.wifePregnancySpecialNeeds ? 'نعم' : 'لا'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.wifePregnancySpecialNeeds && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                            {isFieldEditable('wife_pregnancy_followup_details') ? (
                              <>
                                <textarea
                                  value={editableData.wifePregnancyFollowupDetails || ''}
                                  onChange={(e) => handleFieldChange('wifePregnancyFollowupDetails', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  placeholder="تفاصيل المتابعة الخاصة بالحمل"
                                  rows={2}
                                />
                                {validationErrors.wifePregnancyFollowupDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.wifePregnancyFollowupDetails}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.wifePregnancyFollowupDetails || '-'}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-pink-100">
                  <h4 className="font-black text-pink-700 mb-3">معلومات الحمل</h4>
                  <div className="space-y-2">
                    {dp.wifeIsPregnant ? (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm">حامل</span>
                          <span className="px-3 py-1 rounded-full font-black text-sm bg-pink-100 text-pink-700">نعم</span>
                        </div>
                        {dp.wifePregnancyMonth !== undefined && dp.wifePregnancyMonth > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500 font-bold text-sm">شهر الحمل</span>
                            <span className="font-black text-gray-800">{dp.wifePregnancyMonth} أشهر</span>
                          </div>
                        )}
                        {dp.wifePregnancySpecialNeeds && (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-500 font-bold text-sm">احتياجات خاصة</span>
                              <span className="px-3 py-1 rounded-full font-black text-sm bg-pink-100 text-pink-700">نعم</span>
                            </div>
                            {dp.wifePregnancyFollowupDetails && (
                              <div className="py-2">
                                <span className="text-gray-500 font-bold text-sm block mb-1">تفاصيل المتابعة</span>
                                <span className="font-black text-gray-800">{dp.wifePregnancyFollowupDetails}</span>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 font-bold text-sm text-center py-4">لا توجد بيانات حمل</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Family Health Stats */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.Activity className="w-4 h-4" />
                </div>
                إحصائيات صحية للأسرة
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">ذوي إعاقة</p>
                  <p className="font-black text-red-700 text-2xl">{dp.disabledCount || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">مصابين</p>
                  <p className="font-black text-purple-700 text-2xl">{dp.injuredCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Family Member Health Details */}
            {familyMembers && familyMembers.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Icons.Heart className="w-4 h-4" />
                  </div>
                  الحالة الصحية للأفراد
                </h3>
                <div className="space-y-4">
                  {familyMembers.map((member) => {
                    const hasHealthCondition = 
                      member.disabilityType !== 'لا يوجد' ||
                      member.chronicDiseaseType !== 'لا يوجد' ||
                      member.hasWarInjury ||
                      member.medicalFollowupRequired;

                    if (!hasHealthCondition) return null;

                    return (
                      <div key={member.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icons.User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-black text-gray-800">{member.name || `${member.firstName} ${member.fatherName} ${member.grandfatherName} ${member.familyName}`}</p>
                            <p className="text-xs text-gray-500 font-bold">{member.relation} • {member.age} سنة</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {member.disabilityType && member.disabilityType !== 'لا يوجد' && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              <span className="font-bold text-gray-700">إعاقة {member.disabilityType}</span>
                              {member.disabilitySeverity && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-black">{member.disabilitySeverity}</span>
                              )}
                            </div>
                          )}
                          {member.chronicDiseaseType && member.chronicDiseaseType !== 'لا يوجد' && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              <span className="font-bold text-gray-700">مرض مزمن: {member.chronicDiseaseType}</span>
                            </div>
                          )}
                          {member.hasWarInjury && member.warInjuryType && member.warInjuryType !== 'لا يوجد' && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              <span className="font-bold text-gray-700">إصابة حرب: {member.warInjuryType}</span>
                            </div>
                          )}
                          {member.medicalFollowupRequired && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                              <span className="font-bold text-gray-700">متابعة طبية: {member.medicalFollowupFrequency || 'مستمرة'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!familyMembers.some(m => 
                  m.disabilityType !== 'لا يوجد' ||
                  m.chronicDiseaseType !== 'لا يوجد' ||
                  m.hasWarInjury ||
                  m.medicalFollowupRequired
                ) && (
                  <div className="text-center py-8 bg-emerald-50 rounded-xl">
                    <Icons.Check className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                    <p className="font-black text-emerald-800">جميع أفراد الأسرة بصحة جيدة</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================== SPOUSE TAB ===================== */}
        {activeTab === 'spouse' && showSpouseTab && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMaleHead(isEditMode && editableData ? editableData.headRole : dp.headRole, isEditMode && editableData ? editableData.gender : dp.gender) ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Icons.Baby className="w-4 h-4" />
                </div>
                {isMaleHead(isEditMode && editableData ? editableData.headRole : dp.headRole, isEditMode && editableData ? editableData.gender : dp.gender) ? 'معلومات الزوجة' : 'معلومات الزوج'}
              </h3>

              {isEditMode && editableData ? (
                <div className="space-y-6">
                  {/* Wife Basic Info - Only for Male Heads */}
                  {isMaleHead(editableData.headRole, editableData.gender) ? (
                    <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-4">
                      <h4 className="font-black text-pink-800 mb-4 flex items-center gap-2">
                        <Icons.User className="w-5 h-5" />
                        بيانات الزوجة
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
                          {isFieldEditable('wife_name') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.wifeName || ''}
                                onChange={(e) => handleFieldChange('wifeName', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                              />
                              {validationErrors.wifeName && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeName}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeName || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">الرقم الوطني</label>
                          {isFieldEditable('wife_national_id') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.wifeNationalId || ''}
                                onChange={(e) => handleFieldChange('wifeNationalId', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none dir-ltr"
                                dir="ltr"
                              />
                              {validationErrors.wifeNationalId && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeNationalId}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold dir-ltr">{editableData.wifeNationalId || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد</label>
                          {isFieldEditable('wife_date_of_birth') ? (
                            <>
                              <input
                                type="date"
                                value={editableData.wifeDateOfBirth || ''}
                                onChange={(e) => handleFieldChange('wifeDateOfBirth', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                              />
                              {validationErrors.wifeDateOfBirth && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeDateOfBirth}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeDateOfBirth || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">العمر</label>
                          <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-black">
                            {editableData.wifeDateOfBirth ? calculateAge(editableData.wifeDateOfBirth) : '-'} سنة
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Husband Basic Info - Only for Female Heads */}
                  {isFemaleHead(editableData.headRole, editableData.gender) ? (
                    <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                      <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                        <Icons.User className="w-5 h-5" />
                        بيانات الزوج
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
                          {isFieldEditable('husband_name') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.husbandName || ''}
                                onChange={(e) => handleFieldChange('husbandName', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                              />
                              {validationErrors.husbandName && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandName}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandName || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">الرقم الوطني</label>
                          {isFieldEditable('husband_national_id') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.husbandNationalId || ''}
                                onChange={(e) => handleFieldChange('husbandNationalId', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none dir-ltr"
                                dir="ltr"
                              />
                              {validationErrors.husbandNationalId && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandNationalId}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold dir-ltr">{editableData.husbandNationalId || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد</label>
                          {isFieldEditable('husband_date_of_birth') ? (
                            <>
                              <input
                                type="date"
                                value={editableData.husbandDateOfBirth || ''}
                                onChange={(e) => handleFieldChange('husbandDateOfBirth', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                              />
                              {validationErrors.husbandDateOfBirth && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandDateOfBirth}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandDateOfBirth || '-'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">العمر</label>
                          <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-black">
                            {editableData.husbandDateOfBirth ? calculateAge(editableData.husbandDateOfBirth) : '-'} سنة
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Pregnancy Info - Only for Male Heads with Wife */}
                  {isMaleHead(editableData.headRole, editableData.gender) && editableData.wifeName && (
                    <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-4">
                      <h4 className="font-black text-pink-800 mb-4 flex items-center gap-2">
                        <Icons.Baby className="w-5 h-5" />
                        معلومات الحمل
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          {isFieldEditable('wife_is_pregnant') ? (
                            <>
                              <input
                                type="checkbox"
                                id="wifeIsPregnant"
                                checked={editableData.wifeIsPregnant || false}
                                onChange={(e) => handleFieldChange('wifeIsPregnant', e.target.checked)}
                                className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                              />
                              <label htmlFor="wifeIsPregnant" className="text-sm font-bold text-gray-700">حامل حالياً</label>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="font-bold">{editableData.wifeIsPregnant ? 'نعم' : 'لا'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.wifeIsPregnant && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">شهر الحمل</label>
                              {isFieldEditable('wife_pregnancy_month') ? (
                                <>
                                  <input
                                    type="number"
                                    value={editableData.wifePregnancyMonth || ''}
                                    onChange={(e) => handleFieldChange('wifePregnancyMonth', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    placeholder="شهر الحمل"
                                    min="1"
                                    max="9"
                                  />
                                  {validationErrors.wifePregnancyMonth && <p className="text-red-500 text-xs mt-1">{validationErrors.wifePregnancyMonth}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">شهر {editableData.wifePregnancyMonth || '-'}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isFieldEditable('wife_pregnancy_special_needs') ? (
                                <>
                                  <input
                                    type="checkbox"
                                    id="wifePregnancySpecialNeeds"
                                    checked={editableData.wifePregnancySpecialNeeds || false}
                                    onChange={(e) => handleFieldChange('wifePregnancySpecialNeeds', e.target.checked)}
                                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                                  />
                                  <label htmlFor="wifePregnancySpecialNeeds" className="text-sm font-bold text-gray-700">احتياجات خاصة</label>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="font-bold">{editableData.wifePregnancySpecialNeeds ? 'نعم' : 'لا'}</span>
                                </div>
                              )}
                            </div>
                            {editableData.wifePregnancySpecialNeeds && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                                {isFieldEditable('wife_pregnancy_followup_details') ? (
                                  <>
                                    <textarea
                                      value={editableData.wifePregnancyFollowupDetails || ''}
                                      onChange={(e) => handleFieldChange('wifePregnancyFollowupDetails', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                      placeholder="تفاصيل المتابعة الخاصة بالحمل"
                                      rows={2}
                                    />
                                    {validationErrors.wifePregnancyFollowupDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.wifePregnancyFollowupDetails}</p>}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-gray-500 font-bold">{editableData.wifePregnancyFollowupDetails || '-'}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Wife Work Info - Only for Male Heads */}
                  {isMaleHead(editableData.headRole, editableData.gender) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                        <Icons.Clipboard className="w-5 h-5" />
                        معلومات عمل الزوجة
                      </h4>
                      <div className="flex items-center gap-2 mb-4">
                        {isFieldEditable('wife_is_working') ? (
                          <>
                            <input
                              type="checkbox"
                              id="wifeIsWorking"
                              checked={editableData.wifeIsWorking || false}
                              onChange={(e) => handleFieldChange('wifeIsWorking', e.target.checked)}
                              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <label htmlFor="wifeIsWorking" className="text-sm font-bold text-gray-700">تعمل حالياً</label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-bold">{editableData.wifeIsWorking ? 'نعم' : 'لا'}</span>
                          </div>
                        )}
                      </div>
                      {editableData.wifeIsWorking && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">الوظيفة</label>
                          {isFieldEditable('wife_occupation') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.wifeOccupation || ''}
                                onChange={(e) => handleFieldChange('wifeOccupation', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                                placeholder="اكتب اسم الوظيفة..."
                              />
                              {validationErrors.wifeOccupation && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeOccupation}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeOccupation || '-'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Husband Work Info - Only for Female Heads */}
                  {isFemaleHead(editableData.headRole, editableData.gender) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                        <Icons.Clipboard className="w-5 h-5" />
                        معلومات عمل الزوج
                      </h4>
                      <div className="flex items-center gap-2 mb-4">
                        {isFieldEditable('husband_is_working') ? (
                          <>
                            <input
                              type="checkbox"
                              id="husbandIsWorking"
                              checked={editableData.husbandIsWorking || false}
                              onChange={(e) => handleFieldChange('husbandIsWorking', e.target.checked)}
                              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <label htmlFor="husbandIsWorking" className="text-sm font-bold text-gray-700">يعمل حالياً</label>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-bold">{editableData.husbandIsWorking ? 'نعم' : 'لا'}</span>
                          </div>
                        )}
                      </div>
                      {editableData.husbandIsWorking && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">الوظيفة</label>
                          {isFieldEditable('husband_occupation') ? (
                            <>
                              <input
                                type="text"
                                value={editableData.husbandOccupation || ''}
                                onChange={(e) => handleFieldChange('husbandOccupation', e.target.value)}
                                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                                placeholder="اكتب اسم الوظيفة..."
                              />
                              {validationErrors.husbandOccupation && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandOccupation}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandOccupation || '-'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wife Health Info - Only for Male Heads */}
                  {isMaleHead(editableData.headRole, editableData.gender) && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                        <Icons.Heart className="w-5 h-5" />
                        الحالة الصحية للزوجة
                      </h4>
                      <div className="space-y-4">
                        {/* Disability */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">الإعاقة</label>
                          {isFieldEditable('wife_disability_type') ? (
                            <>
                              <select
                                value={editableData.wifeDisabilityType || 'لا يوجد'}
                                onChange={(e) => handleFieldChange('wifeDisabilityType', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              >
                                {Object.entries(DISABILITY_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              {validationErrors.wifeDisabilityType && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeDisabilityType}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeDisabilityType || '-'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.wifeDisabilityType && editableData.wifeDisabilityType !== 'لا يوجد' && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">درجة الإعاقة</label>
                              {isFieldEditable('wife_disability_severity') ? (
                                <>
                                  <select
                                    value={editableData.wifeDisabilitySeverity || ''}
                                    onChange={(e) => handleFieldChange('wifeDisabilitySeverity', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  >
                                    <option value="">اختر الدرجة</option>
                                    {Object.entries(DISABILITY_SEVERITY).map(([key, label]) => (
                                      <option key={key} value={key}>{label}</option>
                                    ))}
                                  </select>
                                  {validationErrors.wifeDisabilitySeverity && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeDisabilitySeverity}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.wifeDisabilitySeverity || '-'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                              {isFieldEditable('wife_disability_details') ? (
                                <>
                                  <textarea
                                    value={editableData.wifeDisabilityDetails || ''}
                                    onChange={(e) => handleFieldChange('wifeDisabilityDetails', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    rows={2}
                                    placeholder="تفاصيل الإعاقة..."
                                  />
                                  {validationErrors.wifeDisabilityDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeDisabilityDetails}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.wifeDisabilityDetails || '-'}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Chronic Disease */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">المرض المزمن</label>
                          {isFieldEditable('wife_chronic_disease_type') ? (
                            <>
                              <select
                                value={editableData.wifeChronicDiseaseType || 'لا يوجد'}
                                onChange={(e) => handleFieldChange('wifeChronicDiseaseType', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              >
                                {Object.entries(CHRONIC_DISEASE_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              {validationErrors.wifeChronicDiseaseType && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeChronicDiseaseType}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeChronicDiseaseType || '-'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.wifeChronicDiseaseType && editableData.wifeChronicDiseaseType !== 'لا يوجد' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض</label>
                            {isFieldEditable('wife_chronic_disease_details') ? (
                              <>
                                <textarea
                                  value={editableData.wifeChronicDiseaseDetails || ''}
                                  onChange={(e) => handleFieldChange('wifeChronicDiseaseDetails', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  rows={2}
                                  placeholder="تفاصيل المرض المزمن..."
                                />
                                {validationErrors.wifeChronicDiseaseDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeChronicDiseaseDetails}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.wifeChronicDiseaseDetails || '-'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* War Injury */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">إصابة الحرب</label>
                          {isFieldEditable('wife_war_injury_type') ? (
                            <>
                              <select
                                value={editableData.wifeWarInjuryType || 'لا يوجد'}
                                onChange={(e) => handleFieldChange('wifeWarInjuryType', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              >
                                {Object.entries(WAR_INJURY_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              {validationErrors.wifeWarInjuryType && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeWarInjuryType}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeWarInjuryType || '-'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.wifeWarInjuryType && editableData.wifeWarInjuryType !== 'لا يوجد' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة</label>
                            {isFieldEditable('wife_war_injury_details') ? (
                              <>
                                <textarea
                                  value={editableData.wifeWarInjuryDetails || ''}
                                  onChange={(e) => handleFieldChange('wifeWarInjuryDetails', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  rows={2}
                                  placeholder="تفاصيل إصابة الحرب..."
                                />
                                {validationErrors.wifeWarInjuryDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeWarInjuryDetails}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.wifeWarInjuryDetails || '-'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medical Followup */}
                        <div className="flex items-center gap-2 mt-4">
                          {isFieldEditable('wife_medical_followup_required') ? (
                            <>
                              <input
                                type="checkbox"
                                id="wifeMedicalFollowupRequired"
                                checked={editableData.wifeMedicalFollowupRequired || false}
                                onChange={(e) => handleFieldChange('wifeMedicalFollowupRequired', e.target.checked)}
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                              />
                              <label htmlFor="wifeMedicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.wifeMedicalFollowupRequired ? 'نعم' : 'لا'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.wifeMedicalFollowupRequired && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                              {isFieldEditable('wife_medical_followup_frequency') ? (
                                <>
                                  <input
                                    type="text"
                                    value={editableData.wifeMedicalFollowupFrequency || ''}
                                    onChange={(e) => handleFieldChange('wifeMedicalFollowupFrequency', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    placeholder="مثال: شهرياً، أسبوعياً..."
                                  />
                                  {validationErrors.wifeMedicalFollowupFrequency && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeMedicalFollowupFrequency}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.wifeMedicalFollowupFrequency || '-'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                              {isFieldEditable('wife_medical_followup_details') ? (
                                <>
                                  <textarea
                                    value={editableData.wifeMedicalFollowupDetails || ''}
                                    onChange={(e) => handleFieldChange('wifeMedicalFollowupDetails', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    rows={2}
                                    placeholder="تفاصيل المتابعة الطبية..."
                                  />
                                  {validationErrors.wifeMedicalFollowupDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.wifeMedicalFollowupDetails}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.wifeMedicalFollowupDetails || '-'}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Husband Health Info - Only for Female Heads */}
                  {isFemaleHead(editableData.headRole, editableData.gender) && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                        <Icons.Heart className="w-5 h-5" />
                        الحالة الصحية للزوج
                      </h4>
                      <div className="space-y-4">
                        {/* Disability */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">الإعاقة</label>
                          {isFieldEditable('husband_disability_type') ? (
                            <>
                              <select
                                value={editableData.husbandDisabilityType || 'لا يوجد'}
                                onChange={(e) => handleFieldChange('husbandDisabilityType', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              >
                                {Object.entries(DISABILITY_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              {validationErrors.husbandDisabilityType && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandDisabilityType}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandDisabilityType || '-'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.husbandDisabilityType && editableData.husbandDisabilityType !== 'لا يوجد' && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">درجة الإعاقة</label>
                              {isFieldEditable('husband_disability_severity') ? (
                                <>
                                  <select
                                    value={editableData.husbandDisabilitySeverity || ''}
                                    onChange={(e) => handleFieldChange('husbandDisabilitySeverity', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  >
                                    <option value="">اختر الدرجة</option>
                                    {Object.entries(DISABILITY_SEVERITY).map(([key, label]) => (
                                      <option key={key} value={key}>{label}</option>
                                    ))}
                                  </select>
                                  {validationErrors.husbandDisabilitySeverity && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandDisabilitySeverity}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.husbandDisabilitySeverity || '-'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                              {isFieldEditable('husband_disability_details') ? (
                                <>
                                  <textarea
                                    value={editableData.husbandDisabilityDetails || ''}
                                    onChange={(e) => handleFieldChange('husbandDisabilityDetails', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    rows={2}
                                    placeholder="تفاصيل الإعاقة..."
                                  />
                                  {validationErrors.husbandDisabilityDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandDisabilityDetails}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.husbandDisabilityDetails || '-'}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Chronic Disease */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">المرض المزمن</label>
                          {isFieldEditable('husband_chronic_disease_type') ? (
                            <>
                              <select
                                value={editableData.husbandChronicDiseaseType || 'لا يوجد'}
                                onChange={(e) => handleFieldChange('husbandChronicDiseaseType', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              >
                                {Object.entries(CHRONIC_DISEASE_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              {validationErrors.husbandChronicDiseaseType && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandChronicDiseaseType}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandChronicDiseaseType || '-'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.husbandChronicDiseaseType && editableData.husbandChronicDiseaseType !== 'لا يوجد' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض</label>
                            {isFieldEditable('husband_chronic_disease_details') ? (
                              <>
                                <textarea
                                  value={editableData.husbandChronicDiseaseDetails || ''}
                                  onChange={(e) => handleFieldChange('husbandChronicDiseaseDetails', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  rows={2}
                                  placeholder="تفاصيل المرض المزمن..."
                                />
                                {validationErrors.husbandChronicDiseaseDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandChronicDiseaseDetails}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.husbandChronicDiseaseDetails || '-'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* War Injury */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">إصابة الحرب</label>
                          {isFieldEditable('husband_war_injury_type') ? (
                            <>
                              <select
                                value={editableData.husbandWarInjuryType || 'لا يوجد'}
                                onChange={(e) => handleFieldChange('husbandWarInjuryType', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                              >
                                {Object.entries(WAR_INJURY_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              {validationErrors.husbandWarInjuryType && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandWarInjuryType}</p>}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandWarInjuryType || '-'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.husbandWarInjuryType && editableData.husbandWarInjuryType !== 'لا يوجد' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة</label>
                            {isFieldEditable('husband_war_injury_details') ? (
                              <>
                                <textarea
                                  value={editableData.husbandWarInjuryDetails || ''}
                                  onChange={(e) => handleFieldChange('husbandWarInjuryDetails', e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                  rows={2}
                                  placeholder="تفاصيل إصابة الحرب..."
                                />
                                {validationErrors.husbandWarInjuryDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandWarInjuryDetails}</p>}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-gray-500 font-bold">{editableData.husbandWarInjuryDetails || '-'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medical Followup */}
                        <div className="flex items-center gap-2 mt-4">
                          {isFieldEditable('husband_medical_followup_required') ? (
                            <>
                              <input
                                type="checkbox"
                                id="husbandMedicalFollowupRequired"
                                checked={editableData.husbandMedicalFollowupRequired || false}
                                onChange={(e) => handleFieldChange('husbandMedicalFollowupRequired', e.target.checked)}
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                              />
                              <label htmlFor="husbandMedicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-gray-500 font-bold">{editableData.husbandMedicalFollowupRequired ? 'نعم' : 'لا'}</span>
                            </div>
                          )}
                        </div>
                        {editableData.husbandMedicalFollowupRequired && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                              {isFieldEditable('husband_medical_followup_frequency') ? (
                                <>
                                  <input
                                    type="text"
                                    value={editableData.husbandMedicalFollowupFrequency || ''}
                                    onChange={(e) => handleFieldChange('husbandMedicalFollowupFrequency', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    placeholder="مثال: شهرياً، أسبوعياً..."
                                  />
                                  {validationErrors.husbandMedicalFollowupFrequency && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandMedicalFollowupFrequency}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.husbandMedicalFollowupFrequency || '-'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                              {isFieldEditable('husband_medical_followup_details') ? (
                                <>
                                  <textarea
                                    value={editableData.husbandMedicalFollowupDetails || ''}
                                    onChange={(e) => handleFieldChange('husbandMedicalFollowupDetails', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                                    rows={2}
                                    placeholder="تفاصيل المتابعة الطبية..."
                                  />
                                  {validationErrors.husbandMedicalFollowupDetails && <p className="text-red-500 text-xs mt-1">{validationErrors.husbandMedicalFollowupDetails}</p>}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span className="text-gray-500 font-bold">{editableData.husbandMedicalFollowupDetails || '-'}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : dp.wifeName || dp.husbandName ? (
                <div className="space-y-6">
                  {/* Wife Basic Info - View Mode (Male Heads) */}
                  {isMaleHead(dp.headRole, dp.gender) && dp.wifeName && (
                    <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-4">
                      <h4 className="font-black text-pink-800 mb-4 flex items-center gap-2">
                        <Icons.User className="w-5 h-5" />
                        بيانات الزوجة
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الاسم</p>
                          <p className="font-black text-gray-800">{dp.wifeName}</p>
                        </div>
                        {dp.wifeNationalId && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">الرقم الوطني</p>
                            <p className="font-black text-gray-800 dir-ltr">{dp.wifeNationalId}</p>
                          </div>
                        )}
                        {dp.wifeDateOfBirth && (
                          <>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">تاريخ الميلاد</p>
                              <p className="font-black text-gray-800">{dp.wifeDateOfBirth}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">العمر</p>
                              <p className="font-black text-gray-800">{calculateAge(dp.wifeDateOfBirth)} سنة</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Husband Basic Info - View Mode (Female Heads) */}
                  {isFemaleHead(dp.headRole, dp.gender) && dp.husbandName && (
                    <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                      <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                        <Icons.User className="w-5 h-5" />
                        بيانات الزوج
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الاسم</p>
                          <p className="font-black text-gray-800">{dp.husbandName}</p>
                        </div>
                        {dp.husbandNationalId && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">الرقم الوطني</p>
                            <p className="font-black text-gray-800 dir-ltr">{dp.husbandNationalId}</p>
                          </div>
                        )}
                        {dp.husbandDateOfBirth && (
                          <>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">تاريخ الميلاد</p>
                              <p className="font-black text-gray-800">{dp.husbandDateOfBirth}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">العمر</p>
                              <p className="font-black text-gray-800">{calculateAge(dp.husbandDateOfBirth)} سنة</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pregnancy Info - View Mode (Male Heads with Wife) */}
                  {isMaleHead(dp.headRole, dp.gender) && dp.wifeIsPregnant && (
                    <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-4">
                      <h4 className="font-black text-pink-800 mb-3 flex items-center gap-2">
                        <Icons.Baby className="w-5 h-5" />
                        معلومات الحمل
                      </h4>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="px-4 py-2 bg-pink-200 text-pink-800 rounded-full font-black text-sm">
                          شهر {dp.wifePregnancyMonth}
                        </span>
                        {dp.wifePregnancySpecialNeeds && (
                          <span className="px-4 py-2 bg-red-200 text-red-800 rounded-full font-black text-sm flex items-center gap-2">
                            <Icons.Alert className="w-4 h-4" />
                            احتياجات خاصة
                          </span>
                        )}
                      </div>
                      {dp.wifePregnancyFollowupDetails && (
                        <p className="text-gray-700 text-sm">{dp.wifePregnancyFollowupDetails}</p>
                      )}
                    </div>
                  )}

                  {/* Wife Work Info - View Mode (Male Heads) */}
                  {isMaleHead(dp.headRole, dp.gender) && dp.wifeIsWorking && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <h4 className="font-black text-amber-800 mb-3 flex items-center gap-2">
                        <Icons.Clipboard className="w-5 h-5" />
                        معلومات عمل الزوجة
                      </h4>
                      <div>
                        <p className="text-gray-500 text-xs font-bold mb-1">الوظيفة</p>
                        <p className="font-black text-gray-800">{dp.wifeOccupation}</p>
                      </div>
                    </div>
                  )}

                  {/* Husband Work Info - View Mode (Female Heads) */}
                  {isFemaleHead(dp.headRole, dp.gender) && dp.husbandIsWorking && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <h4 className="font-black text-amber-800 mb-3 flex items-center gap-2">
                        <Icons.Clipboard className="w-5 h-5" />
                        معلومات عمل الزوج
                      </h4>
                      <div>
                        <p className="text-gray-500 text-xs font-bold mb-1">الوظيفة</p>
                        <p className="font-black text-gray-800">{dp.husbandOccupation}</p>
                      </div>
                    </div>
                  )}

                  {/* Wife Health Info - View Mode (Male Heads) */}
                  {isMaleHead(dp.headRole, dp.gender) && (
                    <>
                      {(dp.wifeDisabilityType && dp.wifeDisabilityType !== 'لا يوجد') ||
                       (dp.wifeChronicDiseaseType && dp.wifeChronicDiseaseType !== 'لا يوجد') ||
                       (dp.wifeWarInjuryType && dp.wifeWarInjuryType !== 'لا يوجد') ||
                       dp.wifeMedicalFollowupRequired ? (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                          <h4 className="font-black text-red-800 mb-3 flex items-center gap-2">
                            <Icons.Heart className="w-5 h-5" />
                            الحالة الصحية للزوجة
                          </h4>
                          <div className="space-y-3">
                            {dp.wifeDisabilityType && dp.wifeDisabilityType !== 'لا يوجد' && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">الإعاقة</p>
                                <p className="font-black text-gray-800">{dp.wifeDisabilityType}</p>
                                {dp.wifeDisabilitySeverity && <p className="text-gray-600 text-sm">الدرجة: {dp.wifeDisabilitySeverity}</p>}
                              </div>
                            )}
                            {dp.wifeChronicDiseaseType && dp.wifeChronicDiseaseType !== 'لا يوجد' && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">المرض المزمن</p>
                                <p className="font-black text-gray-800">{dp.wifeChronicDiseaseType}</p>
                              </div>
                            )}
                            {dp.wifeWarInjuryType && dp.wifeWarInjuryType !== 'لا يوجد' && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">إصابة الحرب</p>
                                <p className="font-black text-gray-800">{dp.wifeWarInjuryType}</p>
                              </div>
                            )}
                            {dp.wifeMedicalFollowupRequired && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">المتابعة الطبية</p>
                                <p className="font-black text-gray-800">مطلوبة</p>
                                {dp.wifeMedicalFollowupFrequency && <p className="text-gray-600 text-sm">التكرار: {dp.wifeMedicalFollowupFrequency}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        dp.wifeName && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                            <Icons.Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                            <p className="font-black text-emerald-800">الزوجة بصحة جيدة</p>
                          </div>
                        )
                      )}
                    </>
                  )}

                  {/* Husband Health Info - View Mode (Female Heads) */}
                  {isFemaleHead(dp.headRole, dp.gender) && (
                    <>
                      {(dp.husbandDisabilityType && dp.husbandDisabilityType !== 'لا يوجد') ||
                       (dp.husbandChronicDiseaseType && dp.husbandChronicDiseaseType !== 'لا يوجد') ||
                       (dp.husbandWarInjuryType && dp.husbandWarInjuryType !== 'لا يوجد') ||
                       dp.husbandMedicalFollowupRequired ? (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                          <h4 className="font-black text-red-800 mb-3 flex items-center gap-2">
                            <Icons.Heart className="w-5 h-5" />
                            الحالة الصحية للزوج
                          </h4>
                          <div className="space-y-3">
                            {dp.husbandDisabilityType && dp.husbandDisabilityType !== 'لا يوجد' && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">الإعاقة</p>
                                <p className="font-black text-gray-800">{dp.husbandDisabilityType}</p>
                                {dp.husbandDisabilitySeverity && <p className="text-gray-600 text-sm">الدرجة: {dp.husbandDisabilitySeverity}</p>}
                              </div>
                            )}
                            {dp.husbandChronicDiseaseType && dp.husbandChronicDiseaseType !== 'لا يوجد' && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">المرض المزمن</p>
                                <p className="font-black text-gray-800">{dp.husbandChronicDiseaseType}</p>
                              </div>
                            )}
                            {dp.husbandWarInjuryType && dp.husbandWarInjuryType !== 'لا يوجد' && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">إصابة الحرب</p>
                                <p className="font-black text-gray-800">{dp.husbandWarInjuryType}</p>
                              </div>
                            )}
                            {dp.husbandMedicalFollowupRequired && (
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">المتابعة الطبية</p>
                                <p className="font-black text-gray-800">مطلوبة</p>
                                {dp.husbandMedicalFollowupFrequency && <p className="text-gray-600 text-sm">التكرار: {dp.husbandMedicalFollowupFrequency}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        dp.husbandName && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                            <Icons.Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                            <p className="font-black text-emerald-800">الزوج بصحة جيدة</p>
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              ) : null}

              {!dp.wifeName && !dp.husbandName && (
                <p className="text-gray-500 text-sm font-bold text-center py-8">لا توجد بيانات الزوج/ة</p>
              )}
            </div>
          </div>
        )}

        {/* ===================== DOCUMENTS TAB ===================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isEditMode && editableData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ID Card URL - Edit Mode with FileUpload */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <Icons.Document className="w-4 h-4" />
                    </div>
                    البطاقة الشخصية
                  </h3>
                  {isFieldEditable('id_card_url') ? (
                    <FileUpload
                      existingFileUrl={editableData.idCardUrl}
                      onRemoveFile={() => handleFieldChange('idCardUrl', '')}
                      onFileUpload={(url) => handleFieldChange('idCardUrl', url)}
                      allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                      maxSizeInMB={5}
                      bucketName="id-cards"
                      folderPath="beneficiary-documents"
                      label="صورة الهوية الشخصية"
                      buttonLabel="رفع الصورة"
                      optional={true}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-gray-500 font-bold">هذا الحقل غير قابل للتعديل</span>
                    </div>
                  )}
                </div>

                {/* Medical Report URL - Edit Mode with FileUpload */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                      <Icons.Clipboard className="w-4 h-4" />
                    </div>
                    التقرير الطبي
                  </h3>
                  {isFieldEditable('medical_report_url') ? (
                    <FileUpload
                      existingFileUrl={editableData.medicalReportUrl}
                      onRemoveFile={() => handleFieldChange('medicalReportUrl', '')}
                      onFileUpload={(url) => handleFieldChange('medicalReportUrl', url)}
                      allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                      maxSizeInMB={5}
                      bucketName="medical-reports"
                      folderPath="beneficiary-documents"
                      label="صورة التقرير الطبي"
                      buttonLabel="رفع التقرير"
                      optional={true}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-gray-500 font-bold">هذا الحقل غير قابل للتعديل</span>
                    </div>
                  )}
                </div>

                {/* Signature URL - Edit Mode with FileUpload */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <Icons.Edit className="w-4 h-4" />
                    </div>
                    التوقيع
                  </h3>
                  {isFieldEditable('signature_url') ? (
                    <FileUpload
                      existingFileUrl={editableData.signatureUrl}
                      onRemoveFile={() => handleFieldChange('signatureUrl', '')}
                      onFileUpload={(url) => handleFieldChange('signatureUrl', url)}
                      allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                      maxSizeInMB={5}
                      bucketName="signatures"
                      folderPath="beneficiary-documents"
                      label="صورة التوقيع"
                      buttonLabel="رفع التوقيع"
                      optional={true}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-gray-500 font-bold">هذا الحقل غير قابل للتعديل</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Icons.Alert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-black text-amber-800 text-sm">ملاحظة مهمة</p>
                      <p className="text-amber-700 text-sm mt-1">
                        يرجى رفع صور واضحة. الحد الأقصى لحجم الملف هو 5 ميغابايت. الأنواع المسموحة: JPG, PNG, PDF.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ID Card - View Mode */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <Icons.Document className="w-4 h-4" />
                    </div>
                    البطاقة الشخصية
                  </h3>
                  {dp.idCardUrl ? (
                    <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                      <img src={dp.idCardUrl} alt="البطاقة الشخصية" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center">
                      <p className="text-gray-400 font-bold text-sm">لا توجد صورة</p>
                    </div>
                  )}
                </div>

                {/* Medical Report - View Mode */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                      <Icons.Clipboard className="w-4 h-4" />
                    </div>
                    التقرير الطبي
                  </h3>
                  {dp.medicalReportUrl ? (
                    <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                      <img src={dp.medicalReportUrl} alt="التقرير الطبي" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center">
                      <p className="text-gray-400 font-bold text-sm">لا توجد صورة</p>
                    </div>
                  )}
                </div>

                {/* Signature - View Mode */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <Icons.Edit className="w-4 h-4" />
                    </div>
                    التوقيع
                  </h3>
                  {dp.signatureUrl ? (
                    <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                      <img src={dp.signatureUrl} alt="التوقيع" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center">
                      <p className="text-gray-400 font-bold text-sm">لا توجد صورة</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== DISTRIBUTIONS TAB ===================== */}
        {activeTab === 'distributions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.Package className="w-4 h-4" />
                </div>
                سجل التوزيع
              </h3>
              {tabLoading['distributions'] ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="text-gray-500 font-bold mt-4">جاري تحميل سجل التوزيع...</p>
                </div>
              ) : distributionHistory.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <Icons.Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-black text-gray-500 text-lg">لا يوجد توزيعات حتى الآن</p>
                  <p className="text-gray-400 text-sm mt-2">سيتم عرض سجل المساعدات هنا عند توفرها</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {distributionHistory.map((dist) => (
                    <div key={dist.id} className="bg-gray-50 rounded-2xl border-2 border-gray-100 p-4 hover:border-emerald-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-black text-gray-800 text-lg mb-1">{dist.aidType}</p>
                          {dist.campaignName ? (
                            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg inline-block mb-2">
                              <Icons.Package className="w-3 h-3" />
                              <p className="text-xs font-bold">{dist.campaignName}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mb-2">بدون حملة</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          dist.status === 'تم التسليم'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {dist.status || 'قيد الانتظار'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-bold">الكمية:</span>
                          <span className="font-black text-emerald-700 text-lg">{dist.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-bold">تاريخ التوزيع:</span>
                          <span className="font-bold text-gray-600 dir-ltr text-sm">{new Date(dist.date).toLocaleDateString('ar-EG')}</span>
                        </div>
                        {dist.notes && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-sm text-gray-500 font-bold">ملاحظات:</span>
                            <p className="text-sm text-gray-600 mt-1">{dist.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== NOTIFICATIONS TAB ===================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Icons.Bell className="w-4 h-4" />
                  </div>
                  الإشعارات
                </h3>
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={handleMarkAllNotificationsAsRead}
                    disabled={markingNotificationId !== null}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              {tabLoading['notifications'] ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 font-bold mt-4">جاري تحميل الإشعارات...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <Icons.Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-black text-gray-500 text-lg">لا توجد إشعارات جديدة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        notif.isRead
                          ? 'bg-gray-50 border-gray-100'
                          : 'bg-blue-50 border-blue-200'
                      } ${markingNotificationId === notif.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-black ${
                              notif.type === 'distribution' ? 'bg-emerald-100 text-emerald-700' :
                              notif.type === 'complaint_response' ? 'bg-purple-100 text-purple-700' :
                              notif.type === 'transfer_update' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {notif.type === 'distribution' ? 'توزيع' :
                               notif.type === 'complaint_response' ? 'رد على شكوى' :
                               notif.type === 'transfer_update' ? 'تحديث انتقال' :
                               'نظام'}
                            </span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="font-black text-gray-800 mb-1">{notif.title}</p>
                          <p className="text-sm text-gray-600">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2 dir-ltr">
                            {new Date(notif.createdAt).toLocaleString('ar-EG')}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkNotificationAsRead(notif.id)}
                            disabled={markingNotificationId === notif.id}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {markingNotificationId === notif.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                <span>جاري التحميل...</span>
                              </>
                            ) : (
                              'تحديد كمقروء'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== EMERGENCY TAB ===================== */}
        {activeTab === 'emergency' && (
          <EmergencyTab
            emergencyReports={emergencyReports}
            loading={tabLoading['emergency'] || false}
            onRefresh={() => loadTabData('emergency')}
            onNewReport={() => setShowEmergencyModal(true)}
            onDelete={handleDeleteEmergencyReport}
          />
        )}

        {/* ===================== COMPLAINTS TAB ===================== */}
        {activeTab === 'complaints' && (
          <ComplaintsTab
            complaints={complaints}
            loading={tabLoading['complaints'] || false}
            onRefresh={() => loadTabData('complaints')}
            onNewComplaint={() => setShowComplaintModal(true)}
            onDelete={handleDeleteComplaint}
          />
        )}

        {/* ===================== SETTINGS TAB ===================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Account Settings */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Icons.User className="w-4 h-4" />
                </div>
                إعدادات الحساب
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 font-bold text-sm mb-1">اسم رب الأسرة</p>
                  <p className="font-black text-gray-800">{getFullName(dp)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 font-bold text-sm mb-1">الرقم الوطني</p>
                  <p className="font-black text-gray-800 dir-ltr">{dp?.nationalId || 'غير متوفر'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 font-bold text-sm mb-1">رقم الهاتف</p>
                  <p className="font-black text-gray-800">{dp?.phoneNumber || 'غير متوفر'}</p>
                </div>
                {dp?.phoneSecondary && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 font-bold text-sm mb-1">رقم الهاتف البديل</p>
                    <p className="font-black text-gray-800">{dp.phoneSecondary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Camp Information Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Icons.Building className="w-4 h-4" />
                </div>
                معلومات المخيم
              </h3>
              {loadingCampInfo ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 font-bold mt-2 text-sm">جاري تحميل معلومات المخيم...</p>
                </div>
              ) : campInfo ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-blue-600 font-bold text-sm mb-1">اسم المخيم</p>
                    <p className="font-black text-gray-800 text-lg">{campInfo.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-500 font-bold text-sm mb-1">المحافظة</p>
                      <p className="font-black text-gray-800">{campInfo.location.governorate}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-500 font-bold text-sm mb-1">المنطقة</p>
                      <p className="font-black text-gray-800">{campInfo.location.area}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 font-bold text-sm mb-1">العنوان</p>
                    <p className="font-black text-gray-800">{campInfo.location.address}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-500 font-bold text-sm mb-1">مدير المخيم</p>
                      <p className="font-black text-gray-800">{campInfo.managerName}</p>
                    </div>
                    {campInfo.managerContact && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-gray-500 font-bold text-sm mb-1">رقم التواصل</p>
                        <p className="font-black text-gray-800">{campInfo.managerContact}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 font-bold text-sm mb-1">الحالة</p>
                    <p className="font-black text-gray-800">{campInfo.status}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Icons.Building className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold text-sm">لا تتوفر معلومات المخيم</p>
                </div>
              )}
            </div>



            {/* Transfer Request Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Icons.Repeat className="w-4 h-4" />
                  </div>
                  طلبات الانتقال
                </h3>
                <button
                  onClick={() => {
                    loadAvailableCamps();
                    setShowTransferRequestModal(true);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Icons.Plus className="w-4 h-4" />
                  طلب جديد
                </button>
              </div>
              <p className="text-gray-600 font-bold text-sm mb-4">
                يمكنك تقديم طلب انتقال لمخيم آخر مع ذكر السبب. سيتم مراجعة الطلب من قبل الإدارة.
              </p>
            </div>

            {/* Special Assistance Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-900/5 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Icons.Hand className="w-4 h-4" />
                  </div>
                  طلبات المساعدة الخاصة
                </h3>
                <button
                  onClick={() => setShowSpecialAssistanceModal(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Icons.Plus className="w-4 h-4" />
                  طلب جديد
                </button>
              </div>
              <p className="text-gray-600 font-bold text-sm mb-4">
                يمكنك تقديم طلب مساعدة خاصة (طبية، مالية، سكنية، تعليمية، أخرى).
              </p>
              {specialAssistanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {specialAssistanceRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-black ${
                          (req.assistanceType === 'medical' || req.assistanceType === 'طبية') ? 'bg-red-100 text-red-700' :
                          (req.assistanceType === 'financial' || req.assistanceType === 'مالية') ? 'bg-emerald-100 text-emerald-700' :
                          (req.assistanceType === 'housing' || req.assistanceType === 'سكنية') ? 'bg-blue-100 text-blue-700' :
                          (req.assistanceType === 'educational' || req.assistanceType === 'تعليمية') ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {(req.assistanceType === 'medical' || req.assistanceType === 'طبية') ? 'طبية' :
                           (req.assistanceType === 'financial' || req.assistanceType === 'مالية') ? 'مالية' :
                           (req.assistanceType === 'housing' || req.assistanceType === 'سكنية') ? 'سكنية' :
                           (req.assistanceType === 'educational' || req.assistanceType === 'تعليمية') ? 'تعليمية' :
                           'أخرى'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-black ${
                          req.status === 'جديد' ? 'bg-blue-100 text-blue-700' :
                          req.status === 'قيد المراجعة' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'تمت الموافقة' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'مرفوض' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-bold mb-1">{req.description}</p>
                      <p className="text-xs text-gray-400 dir-ltr">
                        {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Icons.Hand className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold text-sm">لا توجد طلبات مساعدة</p>
                </div>
              )}
            </div>

            {/* Logout Section */}
            <div className="bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-900/5 p-6">
              <h3 className="text-lg font-black text-red-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                  <Icons.LogOut className="w-4 h-4" />
                </div>
                تسجيل الخروج
              </h3>
              <p className="text-gray-600 font-bold text-sm mb-4">
                هل تريد تسجيل الخروج من الحساب؟
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
              >
                <Icons.LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>

            {/* App Info */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] border border-slate-700 shadow-xl p-6 text-white">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Icons.Shield className="w-4 h-4" />
                </div>
                حول التطبيق
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-white/70">نظام إدارة المساعدات الإنسانية</p>
                <p className="font-bold text-white/50 text-xs">إصدار 1.0.0</p>
                <p className="font-bold text-white/50 text-xs mt-4">
                  جميع الحقوق محفوظة © 2026
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          MOBILE FLOATING ACTION BUTTON (FAB) - Edit Trigger
      ==================================================================== */}
      {!isEditMode && canEdit() && (
        <button
          onClick={enterEditMode}
          className="sm:hidden fixed bottom-24 left-6 w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-xl shadow-emerald-900/30 flex items-center justify-center z-40 hover:scale-110 transition-transform"
        >
          <Icons.Edit className="w-6 h-6" />
        </button>
      )}

      {/* ====================================================================
          MOBILE STICKY BOTTOM ACTION BAR - Edit Mode
      ==================================================================== */}
      {isEditMode && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 safe-area-pb">
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Icons.X className="w-5 h-5" />
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              {isSaving ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Icons.Save className="w-5 h-5" />
              )}
              {isSaving ? 'حفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MEMBER ADD/EDIT MODAL
      ==================================================================== */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800">
                {editingMemberIndex !== null ? 'تعديل بيانات الفرد' : 'إضافة فرد جديد'}
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                disabled={isSaving}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              {/* Section 1: Basic Information (المعلومات الأساسية) */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  المعلومات الأساسية
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 4-Part Name Fields */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الأول *</label>
                    <input
                      type="text"
                      value={tempMember.firstName || ''}
                      onChange={(e) => handleMemberChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="الاسم الأول"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم الأب *</label>
                    <input
                      type="text"
                      value={tempMember.fatherName || ''}
                      onChange={(e) => handleMemberChange('fatherName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="اسم الأب"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم الجد</label>
                    <input
                      type="text"
                      value={tempMember.grandfatherName || ''}
                      onChange={(e) => handleMemberChange('grandfatherName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="اسم الجد"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم العائلة *</label>
                    <input
                      type="text"
                      value={tempMember.familyName || ''}
                      onChange={(e) => handleMemberChange('familyName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="اسم العائلة"
                    />
                  </div>

                  {/* National ID */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الرقم الوطني *</label>
                    <input
                      type="text"
                      value={tempMember.nationalId || ''}
                      onChange={(e) => handleMemberChange('nationalId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="أدخل الرقم الوطني (8-9 أرقام)"
                      dir="ltr"
                    />
                  </div>

                  {/* Gender */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الجنس *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleMemberChange('gender', 'ذكر')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                          tempMember.gender === 'ذكر'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemberChange('gender', 'أنثى')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                          tempMember.gender === 'أنثى'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        أنثى
                      </button>
                    </div>
                  </div>

                  {/* Date of Birth & Age */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد *</label>
                    <input
                      type="date"
                      value={tempMember.dateOfBirth || ''}
                      onChange={(e) => handleMemberChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العمر</label>
                    <input
                      type="number"
                      value={tempMember.age || ''}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                      placeholder="يتم الحساب تلقائياً"
                    />
                    <p className="text-xs text-gray-500 mt-1">يتم حساب العمر تلقائياً من تاريخ الميلاد</p>
                  </div>

                  {/* Relation to Head */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الصلة برأس العائلة *</label>
                    <select
                      value={tempMember.relation || ''}
                      onChange={(e) => handleMemberChange('relation', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">اختر الصلة</option>
                      <option value="الابن">الابن</option>
                      <option value="البنت">البنت</option>
                      <option value="الجد">الجد</option>
                      <option value="الجدة">الجدة</option>
                      <option value="الحفيد">الحفيد</option>
                      <option value="الحفيدة">الحفيدة</option>
                      <option value="العم">العم</option>
                      <option value="العمة">العمة</option>
                      <option value="الخال">الخال</option>
                      <option value="الخالة">الخالة</option>
                      <option value="ابن الأخ">ابن الأخ</option>
                      <option value="ابنة الأخ">ابنة الأخ</option>
                      <option value="ابن العم">ابن العم</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Education & Work (التعليم والعمل) */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-black text-green-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  التعليم والعمل
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Is Studying */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isStudying"
                      checked={tempMember.isStudying || false}
                      onChange={(e) => handleMemberChange('isStudying', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isStudying" className="text-sm font-bold text-gray-700">هل يدرس؟</label>
                  </div>

                  {/* Education Stage */}
                  {tempMember.isStudying && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المرحلة الدراسية</label>
                      <select
                        value={tempMember.educationStage || 'لا يدرس'}
                        onChange={(e) => handleMemberChange('educationStage', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="لا يدرس">لا يدرس</option>
                        <option value="ابتدائي">ابتدائي</option>
                        <option value="إعدادي/ثانوي">إعدادي/ثانوي</option>
                        <option value="جامعي">جامعي</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  )}

                  {/* Is Working */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isWorking"
                      checked={tempMember.isWorking || false}
                      onChange={(e) => handleMemberChange('isWorking', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isWorking" className="text-sm font-bold text-gray-700">هل يعمل؟</label>
                  </div>

                  {/* Occupation */}
                  {tempMember.isWorking && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المهنة</label>
                      <input
                        type="text"
                        value={tempMember.occupation || ''}
                        onChange={(e) => handleMemberChange('occupation', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="المهنة"
                      />
                    </div>
                  )}

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={tempMember.phoneNumber || ''}
                      onChange={(e) => handleMemberChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Marital Status (الحالة الاجتماعية) */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-black text-purple-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  الحالة الاجتماعية
                </h4>

                <div>
                  <select
                    value={tempMember.maritalStatus || 'أعزب/عزباء'}
                    onChange={(e) => handleMemberChange('maritalStatus', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="أعزب/عزباء">أعزب/عزباء</option>
                    <option value="متزوج/ة">متزوج/ة</option>
                    <option value="أرمل/ة">أرمل/ة</option>
                    <option value="مطلق/ة">مطلق/ة</option>
                    <option value="حالة خاصة">حالة خاصة</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Health Status (الحالة الصحية) */}
              <div className="bg-amber-50 rounded-xl p-4">
                <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  الحالة الصحية
                </h4>

                <div className="space-y-4">
                  {/* Disability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإعاقة</label>
                      <select
                        value={tempMember.disabilityType || 'لا يوجد'}
                        onChange={(e) => handleMemberChange('disabilityType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="لا يوجد">لا يوجد</option>
                        <option value="حركية">حركية</option>
                        <option value="بصرية">بصرية</option>
                        <option value="سمعية">سمعية</option>
                        <option value="ذهنية">ذهنية</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                    {tempMember.disabilityType && tempMember.disabilityType.trim() !== 'لا يوجد' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">درجة الإعاقة</label>
                        <select
                          value={tempMember.disabilitySeverity || ''}
                          onChange={(e) => handleMemberChange('disabilitySeverity', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">اختر الشدة</option>
                          <option value="بسيطة">بسيطة</option>
                          <option value="متوسطة">متوسطة</option>
                          <option value="شديدة">شديدة</option>
                          <option value="كلية">كلية</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {tempMember.disabilityType && tempMember.disabilityType.trim() !== 'لا يوجد' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                      <textarea
                        value={tempMember.disabilityDetails || ''}
                        onChange={(e) => handleMemberChange('disabilityDetails', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اكتب تفاصيل الإعاقة..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Chronic Disease */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المرض المزمن</label>
                      <select
                        value={tempMember.chronicDiseaseType || 'لا يوجد'}
                        onChange={(e) => handleMemberChange('chronicDiseaseType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="لا يوجد">لا يوجد</option>
                        <option value="سكري">سكري</option>
                        <option value="ضغط دم">ضغط دم</option>
                        <option value="قلب">قلب</option>
                        <option value="سرطان">سرطان</option>
                        <option value="ربو">ربو</option>
                        <option value="فشل كلوي">فشل كلوي</option>
                        <option value="مرض نفسي">مرض نفسي</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  </div>
                  {tempMember.chronicDiseaseType && tempMember.chronicDiseaseType.trim() !== 'لا يوجد' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض المزمن</label>
                      <textarea
                        value={tempMember.chronicDiseaseDetails || ''}
                        onChange={(e) => handleMemberChange('chronicDiseaseDetails', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اكتب تفاصيل المرض المزمن..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* War Injury */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="hasWarInjury"
                        checked={tempMember.hasWarInjury || false}
                        onChange={(e) => handleMemberChange('hasWarInjury', e.target.checked)}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <label htmlFor="hasWarInjury" className="text-sm font-bold text-gray-700">إصابة حرب</label>
                    </div>
                    {tempMember.hasWarInjury && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإصابة</label>
                          <select
                            value={tempMember.warInjuryType || 'لا يوجد'}
                            onChange={(e) => handleMemberChange('warInjuryType', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          >
                            <option value="لا يوجد">لا يوجد</option>
                            <option value="بتر">بتر</option>
                            <option value="كسر">كسر</option>
                            <option value="شظية">شظية</option>
                            <option value="حرق">حرق</option>
                            <option value="رأس/وجه">رأس/وجه</option>
                            <option value="عمود فقري">عمود فقري</option>
                            <option value="أخرى">أخرى</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة</label>
                          <textarea
                            value={tempMember.warInjuryDetails || ''}
                            onChange={(e) => handleMemberChange('warInjuryDetails', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            placeholder="اكتب تفاصيل الإصابة..."
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Medical Follow-up (المتابعة الطبية) */}
              <div className="bg-red-50 rounded-xl p-4">
                <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  المتابعة الطبية
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="medicalFollowupRequired"
                      checked={tempMember.medicalFollowupRequired || false}
                      onChange={(e) => handleMemberChange('medicalFollowupRequired', e.target.checked)}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="medicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                  </div>

                  {tempMember.medicalFollowupRequired && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                        <input
                          type="text"
                          value={tempMember.medicalFollowupFrequency || ''}
                          onChange={(e) => handleMemberChange('medicalFollowupFrequency', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          placeholder="مثال: شهرياً، أسبوعياً..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                        <textarea
                          value={tempMember.medicalFollowupDetails || ''}
                          onChange={(e) => handleMemberChange('medicalFollowupDetails', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          placeholder="اكتب تفاصيل المتابعة الطبية..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              {editingMemberIndex !== null && (
                <button
                  onClick={() => confirmDeleteMember(editingMemberIndex)}
                  disabled={isSaving}
                  className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-all disabled:opacity-50"
                >
                  حذف
                </button>
              )}
              <button
                onClick={() => setShowMemberModal(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveMember}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  editingMemberIndex !== null ? 'حفظ التعديلات' : 'إضافة'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW MEMBER MODAL
      ==================================================================== */}
      {showViewMemberModal && viewingMemberIndex !== null && currentFamilyMembers[viewingMemberIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                عرض بيانات الفرد
              </h3>
              <button
                onClick={() => setShowViewMemberModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              {(() => {
                const member = currentFamilyMembers[viewingMemberIndex];
                return (
                  <>
                    {/* Section 1: Basic Information */}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        المعلومات الأساسية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الاسم الكامل</p>
                          <p className="font-black text-gray-800">{member.name || `${member.firstName} ${member.fatherName} ${member.grandfatherName} ${member.familyName}`.trim()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الرقم الوطني</p>
                          <p className="font-black text-gray-800 dir-ltr">{member.nationalId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الجنس</p>
                          <p className="font-black text-gray-800">{member.gender === 'ذكر' ? 'ذكر' : 'أنثى'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">تاريخ الميلاد</p>
                          <p className="font-black text-gray-800">{member.dateOfBirth || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">العمر</p>
                          <p className="font-black text-gray-800">{member.age || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الصلة</p>
                          <p className="font-black text-gray-800">{translateRelation(member.relation)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Education & Work */}
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-black text-green-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        التعليم والعمل
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">هل يدرس؟</p>
                          <p className="font-black text-gray-800">{member.isStudying ? 'نعم' : 'لا'}</p>
                        </div>
                        {member.isStudying && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">المرحلة الدراسية</p>
                            <p className="font-black text-gray-800">{member.educationStage || '-'}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">هل يعمل؟</p>
                          <p className="font-black text-gray-800">{member.isWorking ? 'نعم' : 'لا'}</p>
                        </div>
                        {member.isWorking && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">المهنة</p>
                            <p className="font-black text-gray-800">{member.occupation || '-'}</p>
                          </div>
                        )}
                        {member.phoneNumber && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">رقم الهاتف</p>
                            <p className="font-black text-gray-800 dir-ltr">{member.phoneNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Marital Status */}
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="font-black text-purple-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        الحالة الاجتماعية
                      </h4>
                      <div>
                        <p className="text-gray-500 text-xs font-bold mb-1">الحالة الاجتماعية</p>
                        <p className="font-black text-gray-800">
                          {member.maritalStatus || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Section 4: Health Status */}
                    <div className="bg-amber-50 rounded-xl p-4">
                      <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        الحالة الصحية
                      </h4>
                      <div className="space-y-4">
                        {/* Disability */}
                        {member.disabilityType && member.disabilityType.trim() !== 'لا يوجد' && (
                          <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                            <p className="font-black text-red-800 mb-2">الإعاقة</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                                <p className="font-black text-gray-800">{member.disabilityType}</p>
                              </div>
                              {member.disabilitySeverity && (
                                <div>
                                  <p className="text-gray-500 text-xs font-bold mb-1">الدرجة</p>
                                  <p className="font-black text-gray-800">{member.disabilitySeverity}</p>
                                </div>
                              )}
                            </div>
                            {member.disabilityDetails && (
                              <div className="mt-2">
                                <p className="text-gray-500 text-xs font-bold mb-1">التفاصيل</p>
                                <p className="text-gray-700 text-sm">{member.disabilityDetails}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Chronic Disease */}
                        {member.chronicDiseaseType && member.chronicDiseaseType.trim() !== 'لا يوجد' && (
                          <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                            <p className="font-black text-orange-800 mb-2">المرض المزمن</p>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                              <p className="font-black text-gray-800">{member.chronicDiseaseType}</p>
                            </div>
                            {member.chronicDiseaseDetails && (
                              <div className="mt-2">
                                <p className="text-gray-500 text-xs font-bold mb-1">التفاصيل</p>
                                <p className="text-gray-700 text-sm">{member.chronicDiseaseDetails}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* War Injury */}
                        {member.hasWarInjury && member.warInjuryType && member.warInjuryType.trim() !== 'لا يوجد' && (
                          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
                            <p className="font-black text-purple-800 mb-2">إصابة حرب</p>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                              <p className="font-black text-gray-800">{member.warInjuryType}</p>
                            </div>
                            {member.warInjuryDetails && (
                              <div className="mt-2">
                                <p className="text-gray-500 text-xs font-bold mb-1">التفاصيل</p>
                                <p className="text-gray-700 text-sm">{member.warInjuryDetails}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* No conditions */}
                        {(!member.disabilityType || member.disabilityType === 'لا يوجد') &&
                         (!member.chronicDiseaseType || member.chronicDiseaseType === 'لا يوجد') &&
                         (!member.hasWarInjury || !member.warInjuryType || member.warInjuryType === 'لا يوجد') && (
                          <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد حالات صحية</p>
                        )}
                      </div>
                    </div>

                    {/* Section 5: Medical Follow-up */}
                    {member.medicalFollowupRequired && (
                      <div className="bg-red-50 rounded-xl p-4">
                        <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          المتابعة الطبية
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">تكرار المتابعة</p>
                            <p className="font-black text-gray-800">{member.medicalFollowupFrequency || '-'}</p>
                          </div>
                          {member.medicalFollowupDetails && (
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">تفاصيل المتابعة</p>
                              <p className="text-gray-700 text-sm">{member.medicalFollowupDetails}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowViewMemberModal(false)}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LOGOUT CONFIRMATION MODAL
      ==================================================================== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">تأكيد تسجيل الخروج</h3>
              <p className="text-gray-500 font-bold">هل أنت متأكد من تسجيل الخروج؟</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                تراجع
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Icons.LogOut className="w-5 h-5" />
                نعم، تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          EMERGENCY REPORT MODAL
      ==================================================================== */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Icons.Alert className="w-5 h-5 text-red-600" />
                  </div>
                  بلاغ طارئ جديد
                </h3>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
                >
                  <Icons.X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع الطوارئ <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={emergencyForm.emergencyType}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, emergencyType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                  placeholder="مثال: فيضان، حريق، إخلاء طارئ..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">درجة الاستعجال <span className="text-red-600">*</span></label>
                <select
                  value={emergencyForm.urgency}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, urgency: e.target.value as 'عاجل جداً' | 'عاجل' | 'عادي' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                >
                  <option value="عادي">عادي</option>
                  <option value="عاجل">عاجل</option>
                  <option value="عاجل جداً">عاجل جداً</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الموقع (اختياري)</label>
                <input
                  type="text"
                  value={emergencyForm.location}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                  placeholder="مثال: المخيم، المنطقة..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الوصف <span className="text-red-600">*</span></label>
                <textarea
                  value={emergencyForm.description}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                  rows={4}
                  placeholder="اشرح تفاصيل الطوارئ..."
                />
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <Icons.Alert className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-bold">
                    سيتم مراجعة بلاغك الطارئ من قبل الفريق المختص والرد عليك في أقرب وقت ممكن.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitEmergencyReport}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Icons.Alert className="w-5 h-5" />
                إرسال البلاغ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          COMPLAINT MODAL
      ==================================================================== */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Icons.Document className="w-5 h-5 text-emerald-600" />
                  </div>
                  شكوى / مقترح جديد
                </h3>
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
                >
                  <Icons.X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف <span className="text-red-600">*</span></label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value as 'عام' | 'صحي' | 'أمن' | 'مرافق' | 'أخرى' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="عام">عام</option>
                  <option value="صحي">صحي</option>
                  <option value="أمن">أمن</option>
                  <option value="مرافق">مرافق</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الموضوع <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={complaintForm.subject}
                  onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  placeholder="مثال: شكوى بخصوص..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الوصف <span className="text-red-600">*</span></label>
                <textarea
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  rows={4}
                  placeholder="اشرح تفاصيل الشكوى أو المقترح..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={complaintForm.isAnonymous}
                  onChange={(e) => setComplaintForm({ ...complaintForm, isAnonymous: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isAnonymous" className="text-sm font-bold text-gray-700">إرسال كمجهول</label>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <Icons.Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 font-bold">
                    جميع الشكاوى والمقترحات يتم التعامل معها بسرية تامة وستتم مراجعتها من قبل الفريق المختص.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowComplaintModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitComplaint}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Icons.Document className="w-5 h-5" />
                إرسال الشكوى
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Special Assistance Request Modal */}
      {showSpecialAssistanceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-800">طلب مساعدة خاصة</h3>
                <button
                  onClick={() => setShowSpecialAssistanceModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                >
                  <Icons.X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع المساعدة</label>
                <select
                  value={specialAssistanceForm.assistanceType}
                  onChange={(e) => setSpecialAssistanceForm({ ...specialAssistanceForm, assistanceType: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="طبية">طبية</option>
                  <option value="مالية">مالية</option>
                  <option value="سكنية">سكنية</option>
                  <option value="تعليمية">تعليمية</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={specialAssistanceForm.description}
                  onChange={(e) => setSpecialAssistanceForm({ ...specialAssistanceForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  rows={4}
                  placeholder="اكتب تفاصيل طلب المساعدة..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">درجة الاستعجال</label>
                <select
                  value={specialAssistanceForm.urgency}
                  onChange={(e) => setSpecialAssistanceForm({ ...specialAssistanceForm, urgency: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="عادي">عادي</option>
                  <option value="عاجل">عاجل</option>
                  <option value="عاجل جداً">عاجل جداً</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowSpecialAssistanceModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitSpecialAssistance}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Icons.Hand className="w-5 h-5" />
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {showTransferRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-800">طلب انتقال لمخيم آخر</h3>
                <button
                  onClick={() => setShowTransferRequestModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                >
                  <Icons.X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Camp Info Label */}
              {campInfo && (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                  <p className="text-blue-600 font-bold text-sm mb-2">المخيم الحالي</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.Building className="w-5 h-5 text-blue-600" />
                    <p className="font-black text-gray-800 text-lg">{campInfo.name}</p>
                  </div>
                  {campInfo.managerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icons.User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 font-bold">مدير المخيم: </span>
                      <span className="text-gray-800 font-black">{campInfo.managerName}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المخيم المطلوب</label>
                <select
                  value={transferRequestForm.toCampId}
                  onChange={(e) => setTransferRequestForm({ ...transferRequestForm, toCampId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">اختر المخيم...</option>
                  {availableCamps
                    .filter(camp => !campInfo || camp.id !== campInfo.id)
                    .map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">سبب الانتقال</label>
                <textarea
                  value={transferRequestForm.reason}
                  onChange={(e) => setTransferRequestForm({ ...transferRequestForm, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  rows={4}
                  placeholder="اكتب سبب طلب الانتقال..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowTransferRequestModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitTransferRequest}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Icons.Repeat className="w-5 h-5" />
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EMERGENCY TAB COMPONENT
// ============================================================================
const EmergencyTab = ({
  emergencyReports,
  loading,
  onRefresh,
  onNewReport,
  onDelete
}: {
  emergencyReports: EmergencyReport[];
  loading: boolean;
  onRefresh: () => void;
  onNewReport: () => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icons.Alert className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-black text-gray-800">البلاغات الطارئة</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث
          </button>
          <button
            onClick={onNewReport}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-l from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200"
          >
            <Icons.Plus className="w-5 h-5" />
            بلاغ جديد
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold">جاري تحميل البلاغات...</p>
        </div>
      )}

      {!loading && emergencyReports.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Clipboard className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-bold text-lg">لا توجد بلاغات طارئة مسجلة</p>
          <p className="text-gray-400 font-bold text-sm mt-2">يمكنك تقديم بلاغ طارئ جديد باستخدام الزر أعلاه</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyReports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden hover:border-red-200 transition-colors">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${
                      report.urgency === 'عاجل جداً' ? 'bg-red-500 animate-pulse' :
                      report.urgency === 'عاجل' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-800 truncate">{report.emergencyType}</h3>
                      <p className="text-xs text-gray-500 font-bold mt-1">
                        {new Date(report.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border-2 flex-shrink-0 ${STATUS_COLORS[report.status] || STATUS_COLORS['جديد']}`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-gray-700 font-bold text-sm mb-3 line-clamp-2">{report.description}</p>
                {report.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-bold mb-3">
                    <Icons.MapPin className="w-4 h-4" />
                    <span className="truncate">{report.location}</span>
                  </div>
                )}
                {report.resolutionNotes && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-3">
                    <p className="text-xs font-black text-emerald-800 mb-1">ملاحظات الحل:</p>
                    <p className="text-sm text-emerald-700 font-bold">{report.resolutionNotes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onDelete(report.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all ml-auto"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPLAINTS TAB COMPONENT
// ============================================================================
const ComplaintsTab = ({
  complaints,
  loading,
  onRefresh,
  onNewComplaint,
  onDelete
}: {
  complaints: Complaint[];
  loading: boolean;
  onRefresh: () => void;
  onNewComplaint: () => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icons.Document className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-gray-800">الشكاوى والمقترحات</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث
          </button>
          <button
            onClick={onNewComplaint}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-l from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200"
          >
            <Icons.Plus className="w-5 h-5" />
            شكوى جديدة
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold">جاري تحميل الشكاوى...</p>
        </div>
      )}

      {!loading && complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Document className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-bold text-lg">لا توجد شكاوى مسجلة</p>
          <p className="text-gray-400 font-bold text-sm mt-2">يمكنك تقديم شكوى أو مقترح جديد باستخدام الزر أعلاه</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden hover:border-emerald-200 transition-colors">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-black">{complaint.category}</span>
                      {complaint.isAnonymous && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-black">مجهول</span>
                      )}
                    </div>
                    <h3 className="font-black text-gray-800 truncate">{complaint.subject}</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">
                      {new Date(complaint.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border-2 flex-shrink-0 ${STATUS_COLORS[complaint.status] || STATUS_COLORS['جديد']}`}>
                    {complaint.status}
                  </span>
                </div>
                <p className="text-gray-700 font-bold text-sm mb-3 line-clamp-2">{complaint.description}</p>
                {complaint.response && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-3">
                    <p className="text-xs font-black text-emerald-800 mb-1">الرد:</p>
                    <p className="text-sm text-emerald-700 font-bold">{complaint.response}</p>
                    {complaint.respondedAt && (
                      <p className="text-xs text-emerald-500 font-bold mt-2">
                        {new Date(complaint.respondedAt).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onDelete(complaint.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all ml-auto"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DPPortal;
