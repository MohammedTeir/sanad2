
import { Camp, DPProfile, InventoryItem, TransferRequest } from '../types';

export const INITIAL_CAMPS: Camp[] = [
  {
    id: 'camp1',
    name: 'مخيم الأمل - دير البلح',
    location: { lat: 31.41, lng: 34.35, address: 'دير البلح - شارع البحر', governorate: 'محافظة دير البلح', area: 'دير البلح' },
    managerName: 'أحمد محمود',
    status: 'نشط'
  },
  {
    id: 'camp2',
    name: 'مخيم الكرامة - خان يونس',
    location: { lat: 31.34, lng: 34.30, address: 'خانيونس - المواصي', governorate: 'محافظة خان يونس', area: 'خان يونس' },
    managerName: 'سارة خالد',
    status: 'ممتلئ'
  },
  {
    id: 'camp_pending_1',
    name: 'مخيم الصمود الجديد',
    location: { lat: 31.28, lng: 34.25, address: 'رفح - تل السلطان', governorate: 'محافظة رفح', area: 'رفح' },
    managerName: 'محمد جابر',
    status: 'قيد الانتظار'
  }
];

export const INITIAL_DPS: DPProfile[] = [
  {
    id: '401234567',
    nationalId: '401234567',
    headFirstName: 'إبراهيم',
    headFatherName: 'يوسف',
    headGrandfatherName: 'محمد',
    headFamilyName: 'العطار',
    headOfFamily: 'إبراهيم يوسف العطار',
    gender: 'ذكر',
    dateOfBirth: '1975-05-10',
    age: 49,
    maritalStatus: 'متزوج',
    headRole: 'أب',
    isWorking: false,
    job: 'مزارع سابق',
    phoneNumber: '0599123456',
    disabilityType: 'لا يوجد',
    chronicDiseaseType: 'سكري',
    warInjuryType: 'لا يوجد',
    medicalFollowupRequired: false,
    wifeName: 'فاطمة العطار',
    wifeNationalId: '401234568',
    wifeIsPregnant: false,
    wifeMedicalFollowupRequired: false,
    wifeDisabilityType: 'لا يوجد',
    wifeChronicDiseaseType: 'لا يوجد',
    wifeWarInjuryType: 'لا يوجد',
    members: [
      {
        id: 'm1',
        firstName: 'ياسين',
        fatherName: 'إبراهيم',
        grandfatherName: 'محمد',
        familyName: 'العطار',
        name: 'ياسين إبراهيم العطار',
        gender: 'ذكر',
        dateOfBirth: '2015-08-12',
        age: 9,
        relation: 'الابن',
        maritalStatus: 'أعزب',
        disabilityType: 'حركية',
        chronicDiseaseType: 'لا يوجد',
        hasWarInjury: false,
        warInjuryType: 'لا يوجد',
        medicalFollowupRequired: false
      },
      {
        id: 'm2',
        firstName: 'ليان',
        fatherName: 'إبراهيم',
        grandfatherName: 'محمد',
        familyName: 'العطار',
        name: 'ليان إبراهيم العطار',
        gender: 'أنثى',
        dateOfBirth: '2018-03-20',
        age: 6,
        relation: 'البنت',
        maritalStatus: 'أعزب',
        disabilityType: 'لا يوجد',
        chronicDiseaseType: 'لا يوجد',
        hasWarInjury: false,
        warInjuryType: 'لا يوجد',
        medicalFollowupRequired: false
      }
    ],
    totalMembersCount: 4,
    maleCount: 2,
    femaleCount: 2,
    childCount: 2,
    teenagerCount: 0,
    adultCount: 2,
    seniorCount: 0,
    disabledCount: 1,
    chronicCount: 1,
    injuredCount: 0,
    medicalFollowupCount: 0,
    pregnantWomenCount: 0,
    originalAddress: { governorate: 'شمال غزة', region: 'بيت لاهيا', details: 'قرب مدرسة الشيماء', housingType: 'ملك' },
    currentHousing: { type: 'خيمة', campId: 'camp1', landmark: 'خيمة رقم A42', isSuitableForFamilySize: false },
    vulnerabilityScore: 0,
    vulnerabilityPriority: 'متوسط',
    vulnerabilityReason: 'إعاقة حركية للابن مع فقدان مصدر الدخل ومرض سكري لرب الأسرة.',
    registeredDate: '2023-11-20',
    lastUpdated: new Date().toISOString(),
    aidHistory: []
  },
  {
    id: '801234567',
    nationalId: '801234567',
    headFirstName: 'مريم',
    headFatherName: 'محمود',
    headGrandfatherName: 'علي',
    headFamilyName: 'الصالح',
    headOfFamily: 'مريم محمود الصالح',
    gender: 'أنثى',
    dateOfBirth: '1985-12-01',
    age: 38,
    maritalStatus: 'أرمل',
    widowReason: 'شهيد',
    headRole: 'أم',
    isWorking: false,
    job: 'ربة منزل',
    phoneNumber: '0598765432',
    disabilityType: 'لا يوجد',
    chronicDiseaseType: 'لا يوجد',
    warInjuryType: 'لا يوجد',
    medicalFollowupRequired: false,
    wifeIsPregnant: false,
    wifeMedicalFollowupRequired: false,
    wifeDisabilityType: 'لا يوجد',
    wifeChronicDiseaseType: 'لا يوجد',
    wifeWarInjuryType: 'لا يوجد',
    members: [
      {
        id: 'm3',
        firstName: 'خالد',
        fatherName: 'محمد',
        grandfatherName: 'محمود',
        familyName: 'الصالح',
        name: 'خالد محمد الصالح',
        gender: 'ذكر',
        dateOfBirth: '2010-01-01',
        age: 14,
        relation: 'الابن',
        maritalStatus: 'أعزب',
        disabilityType: 'لا يوجد',
        chronicDiseaseType: 'لا يوجد',
        hasWarInjury: true,
        warInjuryType: 'بتر',
        medicalFollowupRequired: false
      }
    ],
    totalMembersCount: 2,
    maleCount: 1,
    femaleCount: 1,
    childCount: 1,
    teenagerCount: 0,
    adultCount: 1,
    seniorCount: 0,
    disabledCount: 0,
    chronicCount: 0,
    injuredCount: 1,
    medicalFollowupCount: 0,
    pregnantWomenCount: 0,
    originalAddress: { governorate: 'غزة', region: 'الشجاعية', details: 'بجوار المسجد الكبير', housingType: 'إيجار' },
    currentHousing: { type: 'خيمة', campId: 'camp1', landmark: 'منطقة الأرامل', isSuitableForFamilySize: true },
    vulnerabilityScore: 0,
    vulnerabilityPriority: 'عالي',
    vulnerabilityReason: 'أرملة شهيد مع ابن مصاب ببتر أطراف، حالة أولوية قصوى.',
    registeredDate: '2024-01-15',
    lastUpdated: new Date().toISOString(),
    aidHistory: []
  }
];

export const INITIAL_INVENTORY: Record<string, InventoryItem[]> = {
  'camp1': [
    { id: 'i1', name: 'دقيق (25كجم)', category: 'مواد غذائية', quantityAvailable: 450, quantityReserved: 50, unit: 'كيس', minAlertThreshold: 100, receivedDate: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
    { id: 'i2', name: 'مياه معدنية', category: 'مواد غذائية', quantityAvailable: 2000, quantityReserved: 0, unit: 'لتر', minAlertThreshold: 500, receivedDate: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
    { id: 'i3', name: 'أطقم إسعاف أولي', category: 'مستلزمات طبية', quantityAvailable: 50, quantityReserved: 10, unit: 'طقم', minAlertThreshold: 20, receivedDate: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
    { id: 'i6', name: 'فرشات نوم', category: 'مواد غير غذائية', quantityAvailable: 120, quantityReserved: 20, unit: 'قطعة', minAlertThreshold: 30, receivedDate: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-15' }
  ],
  'camp2': [
    { id: 'i4', name: 'معلبات منوعة', category: 'مواد غذائية', quantityAvailable: 1200, quantityReserved: 100, unit: 'علبة', minAlertThreshold: 200, receivedDate: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
    { id: 'i5', name: 'فرشات نوم', category: 'مواد غير غذائية', quantityAvailable: 100, quantityReserved: 15, unit: 'قطعة', minAlertThreshold: 25, receivedDate: '2024-01-01', createdAt: '2024-01-01', updatedAt: '2024-01-15' }
  ]
};

export const INITIAL_TRANSFERS: TransferRequest[] = [
  {
    id: 'tr1',
    dpId: '401234567',
    dpName: 'إبراهيم يوسف العطار',
    fromCampId: 'camp2',
    toCampId: 'camp1',
    status: 'قيد الانتظار',
    date: '2024-02-10',
    reason: 'لم شمل مع الأقارب في مخيم الأمل'
  }
];
