
import React from 'react';

export const COLORS = {
  primary: '#059669', // Emerald 600
  secondary: '#2563eb', // Blue 600
  warning: '#d97706', // Amber 600
  danger: '#dc2626', // Red 600
  neutral: '#4b5563' // Gray 600
};

export const MOCK_CAMPS = [
  { id: 'camp1', name: 'مخيم الأمل - دير البلح', location: { lat: 31.4175, lng: 34.35, address: 'وسط قطاع غزة' }, managerName: 'أحمد محمود', status: 'نشط' as const },
  { id: 'camp2', name: 'مخيم الكرامة - خان يونس', location: { lat: 31.346, lng: 34.306, address: 'جنوب قطاع غزة' }, managerName: 'سارة خالد', status: 'ممتلئ' as const },
  { id: 'camp3', name: 'مخيم الوحدة - رفح', location: { lat: 31.28, lng: 34.25, address: 'المنطقة الغربية' }, managerName: 'محمد علي', status: 'نشط' as const },
];

export const MOCK_DPS = [
  {
    id: '401234567',
    // 4-part name structure (Migration 015)
    headFirstName: 'إبراهيم',
    headFatherName: 'يوسف',
    headGrandfatherName: 'أحمد',
    headFamilyName: 'العطار',
    headOfFamily: 'إبراهيم يوسف أحمد العطار', // Computed for backward compatibility
    phoneNumber: '0599123456',
    currentCampId: 'camp1',
    // ⚠️  DISABLED: Vulnerability score system
    vulnerabilityScore: 0, // 85,
    vulnerabilityPriority: null as any, // 'عالي' as const,
    // Enhanced housing (Migration 016)
    currentHousingType: 'خيمة',
    currentHousingSharingStatus: 'سكن فردي',
    currentHousingDetailedType: 'خيمة فردية',
    currentHousingFurnished: false,
    // Pregnancy special needs (Migration 016)
    wifeIsPregnant: true,
    wifePregnancyMonth: 5,
    wifePregnancySpecialNeeds: false,
    members: [
      {
        id: '1',
        // 4-part name for members
        firstName: 'إبراهيم',
        fatherName: 'يوسف',
        grandfatherName: 'أحمد',
        familyName: 'العطار',
        name: 'إبراهيم يوسف العطار', // Computed
        age: 45,
        gender: 'ذكر' as const,
        hasChronicDisease: true,
        hasDisability: false,
        // Enhanced fields
        isStudying: false,
        isWorking: true,
        occupation: 'موظف',
        maritalStatus: 'متزوج',
        disabilityType: 'لا يوجد',
        chronicDiseaseType: 'سكري'
      },
      {
        id: '2',
        firstName: 'فاطمة',
        fatherName: 'محمد',
        grandfatherName: 'علي',
        familyName: 'العطار',
        name: 'فاطمة محمد العطار',
        age: 40,
        gender: 'أنثى' as const,
        hasChronicDisease: false,
        hasDisability: false,
        isStudying: false,
        isWorking: false,
        maritalStatus: 'متزوج'
      },
      {
        id: '3',
        firstName: 'ياسين',
        fatherName: 'إبراهيم',
        grandfatherName: 'يوسف',
        familyName: 'العطار',
        name: 'ياسين إبراهيم العطار',
        age: 8,
        gender: 'ذكر' as const,
        hasChronicDisease: false,
        hasDisability: true,
        isStudying: true,
        educationStage: 'ابتدائي',
        disabilityType: 'حركية',
        disabilitySeverity: 'متوسطة'
      },
    ],
    aidHistory: [
      { id: 't1', date: '2024-05-15', type: 'سلة غذائية', quantity: '1', status: 'تم التسليم' as const, officerId: 'field1' },
    ],
    registeredDate: '2023-11-20',
    lastUpdated: '2024-05-15'
  }
];

export const ICONS = {
  Home: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  Users: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  Inventory: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
    </svg>
  ),
  Chart: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  Settings: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.127c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  Dashboard: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM14.25 6c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V6ZM3.75 15.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18v-2.25ZM14.25 15.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V15.75Z" />
    </svg>
  )
};
