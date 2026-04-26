// views/camp-manager/BulkFieldPermissionsModal.tsx
import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';

interface BulkFieldPermissionsModalProps {
  onClose: () => void;
}

interface FieldGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  fields: { field: string; label: string }[];
}

// SVG Icon components
const Icons = {
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Location: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'basic',
    label: 'المعلومات الأساسية',
    icon: <Icons.User />,
    fields: [
      { field: 'head_first_name', label: 'الاسم الأول' },
      { field: 'head_father_name', label: 'اسم الأب' },
      { field: 'head_grandfather_name', label: 'اسم الجد' },
      { field: 'head_family_name', label: 'اسم العائلة' },
      { field: 'head_of_family_national_id', label: 'رقم الهوية' },
      { field: 'head_of_family_gender', label: 'الجنس' },
      { field: 'head_of_family_date_of_birth', label: 'تاريخ الميلاد' },
      { field: 'head_of_family_marital_status', label: 'الحالة الاجتماعية' },
      { field: 'head_of_family_widow_reason', label: 'سبب الوفاة' },
      { field: 'head_of_family_role', label: 'صفة رب الأسرة' },
    ]
  },
  {
    id: 'contact',
    label: 'معلومات الاتصال',
    icon: <Icons.Phone />,
    fields: [
      { field: 'head_of_family_phone_number', label: 'رقم الهاتف' },
      { field: 'head_of_family_phone_secondary', label: 'رقم الهاتف البديل' },
    ]
  },
  {
    id: 'work',
    label: 'العمل والدخل',
    icon: <Icons.Briefcase />,
    fields: [
      { field: 'head_of_family_is_working', label: 'يعمل حالياً' },
      { field: 'head_of_family_job', label: 'الوظيفة' },
      { field: 'head_of_family_monthly_income', label: 'الدخل الشهري' },
      { field: 'head_of_family_monthly_income_range', label: 'نطاق الدخل' },
    ]
  },
  {
    id: 'health_head',
    label: 'الصحة - رب الأسرة',
    icon: <Icons.Heart />,
    fields: [
      { field: 'head_of_family_disability_type', label: 'نوع الإعاقة' },
      { field: 'head_of_family_disability_severity', label: 'درجة الإعاقة' },
      { field: 'head_of_family_disability_details', label: 'تفاصيل الإعاقة' },
      { field: 'head_of_family_chronic_disease_type', label: 'المرض المزمن' },
      { field: 'head_of_family_chronic_disease_details', label: 'تفاصيل المرض' },
      { field: 'head_of_family_war_injury_type', label: 'إصابة الحرب' },
      { field: 'head_of_family_war_injury_details', label: 'تفاصيل الإصابة' },
      { field: 'head_of_family_medical_followup_required', label: 'المتابعة الطبية' },
      { field: 'head_of_family_medical_followup_frequency', label: 'تكرار المتابعة' },
      { field: 'head_of_family_medical_followup_details', label: 'تفاصيل المتابعة' },
    ]
  },
  {
    id: 'spouse_basic',
    label: 'بيانات الزوج/ة',
    icon: <Icons.User />,
    fields: [
      { field: 'wife_name', label: 'اسم الزوجة' },
      { field: 'wife_national_id', label: 'رقم الهوية للزوجة' },
      { field: 'wife_date_of_birth', label: 'تاريخ ميلاد الزوجة' },
      { field: 'husband_name', label: 'اسم الزوج' },
      { field: 'husband_national_id', label: 'رقم الهوية للزوج' },
      { field: 'husband_date_of_birth', label: 'تاريخ ميلاد الزوج' },
    ]
  },
  {
    id: 'spouse_work',
    label: 'العمل - الزوج/ة',
    icon: <Icons.Briefcase />,
    fields: [
      { field: 'wife_is_working', label: 'الزوجة تعمل حالياً' },
      { field: 'wife_occupation', label: 'وظيفة الزوجة' },
      { field: 'husband_is_working', label: 'الزوج يعمل حالياً' },
      { field: 'husband_occupation', label: 'وظيفة الزوج' },
    ]
  },
  {
    id: 'health_wife',
    label: 'الصحة - الزوجة',
    icon: <Icons.Heart />,
    fields: [
      { field: 'wife_disability_type', label: 'نوع إعاقة الزوجة' },
      { field: 'wife_disability_severity', label: 'درجة إعاقة الزوجة' },
      { field: 'wife_disability_details', label: 'تفاصيل إعاقة الزوجة' },
      { field: 'wife_chronic_disease_type', label: 'المرض المزمن للزوجة' },
      { field: 'wife_chronic_disease_details', label: 'تفاصيل المرض المزمن للزوجة' },
      { field: 'wife_war_injury_type', label: 'إصابة حرب الزوجة' },
      { field: 'wife_war_injury_details', label: 'تفاصيل إصابة حرب الزوجة' },
      { field: 'wife_medical_followup_required', label: 'المتابعة الطبية للزوجة' },
      { field: 'wife_medical_followup_frequency', label: 'تكرار المتابعة الطبية للزوجة' },
      { field: 'wife_medical_followup_details', label: 'تفاصيل المتابعة الطبية للزوجة' },
      { field: 'wife_is_pregnant', label: 'حامل حالياً' },
      { field: 'wife_pregnancy_month', label: 'شهر الحمل' },
      { field: 'wife_pregnancy_special_needs', label: 'احتياجات خاصة للحمل' },
      { field: 'wife_pregnancy_followup_details', label: 'تفاصيل متابعة الحمل' },
    ]
  },
  {
    id: 'health_husband',
    label: 'الصحة - الزوج',
    icon: <Icons.Heart />,
    fields: [
      { field: 'husband_disability_type', label: 'نوع إعاقة الزوج' },
      { field: 'husband_disability_severity', label: 'درجة إعاقة الزوج' },
      { field: 'husband_disability_details', label: 'تفاصيل إعاقة الزوج' },
      { field: 'husband_chronic_disease_type', label: 'المرض المزمن للزوج' },
      { field: 'husband_chronic_disease_details', label: 'تفاصيل المرض المزمن للزوج' },
      { field: 'husband_war_injury_type', label: 'إصابة حرب الزوج' },
      { field: 'husband_war_injury_details', label: 'تفاصيل إصابة حرب الزوج' },
      { field: 'husband_medical_followup_required', label: 'المتابعة الطبية للزوج' },
      { field: 'husband_medical_followup_frequency', label: 'تكرار المتابعة الطبية للزوج' },
      { field: 'husband_medical_followup_details', label: 'تفاصيل المتابعة الطبية للزوج' },
    ]
  },
  {
    id: 'housing_current',
    label: 'السكن الحالي',
    icon: <Icons.Home />,
    fields: [
      { field: 'current_housing_type', label: 'نوع السكن' },
      { field: 'current_housing_detailed_type', label: 'النوع المفصل' },
      { field: 'current_housing_governorate', label: 'محافظة السكن' },
      { field: 'current_housing_region', label: 'منطقة السكن' },
      { field: 'current_housing_landmark', label: 'علامة مميزة' },
      { field: 'current_housing_unit_number', label: 'رقم الوحدة' },
      { field: 'current_housing_is_suitable_for_family_size', label: 'مناسب للعائلة' },
      { field: 'current_housing_sanitary_facilities', label: 'المرافق الصحية' },
      { field: 'current_housing_water_source', label: 'مصدر المياه' },
      { field: 'current_housing_electricity_access', label: 'الكهرباء' },
      { field: 'current_housing_sharing_status', label: 'حالة المشاركة' },
      { field: 'current_housing_furnished', label: 'مفروش' },
    ]
  },
  {
    id: 'housing_original',
    label: 'العنوان الأصلي',
    icon: <Icons.Location />,
    fields: [
      { field: 'original_address_governorate', label: 'محافظة الأصل' },
      { field: 'original_address_region', label: 'منطقة الأصل' },
      { field: 'original_address_details', label: 'تفاصيل العنوان' },
      { field: 'original_address_housing_type', label: 'نوع السكن الأصلي' },
    ]
  },
  {
    id: 'refugee',
    label: 'لاجئ/مقيم بالخارج',
    icon: <Icons.Globe />,
    fields: [
      { field: 'is_resident_abroad', label: 'لاجئ/مقيم بالخارج' },
      { field: 'refugee_resident_abroad_country', label: 'الدولة' },
      { field: 'refugee_resident_abroad_city', label: 'المدينة' },
      { field: 'refugee_resident_abroad_residence_type', label: 'نوع الإقامة' },
    ]
  },
  {
    id: 'documents',
    label: 'الوثائق',
    icon: <Icons.Document />,
    fields: [
      { field: 'id_card_url', label: 'البطاقة الشخصية' },
      { field: 'medical_report_url', label: 'التقرير الطبي' },
      { field: 'signature_url', label: 'التوقيع' },
    ]
  },
  {
    id: 'family_members',
    label: 'الأفراد (أعضاء الأسرة)',
    icon: <Icons.Users />,
    fields: [
      { field: 'family_members', label: 'إضافة/تعديل الأفراد' },
    ]
  },
];

const BulkFieldPermissionsModal: React.FC<BulkFieldPermissionsModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [familyCount, setFamilyCount] = useState(0);

  // Initialize all groups as expanded
  useEffect(() => {
    const initialExpanded: { [key: string]: boolean } = {};
    FIELD_GROUPS.forEach(group => {
      initialExpanded[group.id] = true;
    });
    setExpandedGroups(initialExpanded);
  }, []);

  // Load family count
  useEffect(() => {
    loadFamilyCount();
  }, []);

  const loadFamilyCount = async () => {
    try {
      const currentUser = sessionService.getCurrentUser();
      const campId = currentUser?.campId;
      
      if (!campId) return;
      
      // Get all DPs in the camp to count families
      const allDps = await realDataService.getAllDPs();
      const campFamilies = allDps.filter(dp => dp.campId === campId);
      setFamilyCount(campFamilies.length);
    } catch (error) {
      console.error('Error loading family count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: string) => {
    setPermissions(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleGroupToggle = (groupId: string, editable: boolean) => {
    const group = FIELD_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const newPermissions = { ...permissions };
    group.fields.forEach(f => {
      newPermissions[f.field] = editable;
    });
    setPermissions(newPermissions);
  };

  const handleSelectAll = () => {
    const newPermissions: { [key: string]: boolean } = {};
    FIELD_GROUPS.forEach(group => {
      group.fields.forEach(f => {
        newPermissions[f.field] = true;
      });
    });
    setPermissions(newPermissions);
  };

  const handleDeselectAll = () => {
    const newPermissions: { [key: string]: boolean } = {};
    FIELD_GROUPS.forEach(group => {
      group.fields.forEach(f => {
        newPermissions[f.field] = false;
      });
    });
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentUser = sessionService.getCurrentUser();
      const campId = currentUser?.campId;

      if (!campId) {
        throw new Error('لم يتم العثور على معرف المخيم');
      }

      // Get all families in the camp
      const allDps = await realDataService.getAllDPs();
      const campFamilies = allDps.filter(dp => dp.campId === campId);

      // Apply permissions to each family
      const permissionsArray = Object.entries(permissions).map(([field, editable]) => ({
        field,
        editable
      }));

      let successCount = 0;
      let errorCount = 0;

      for (const family of campFamilies) {
        try {
          await realDataService.bulkUpdateFieldPermissions(family.id, permissionsArray);
          successCount++;
        } catch (error) {
          console.error(`Error updating permissions for family ${family.id}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setToast({ 
          message: `تم تطبيق الصلاحيات على ${successCount} عائلة بنجاح`, 
          type: 'success' 
        });
      } else {
        setToast({ 
          message: `تم تطبيق الصلاحيات على ${successCount} عائلة، فشل ${errorCount} عائلة`, 
          type: 'error' 
        });
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving bulk permissions:', error);
      setToast({ message: error.message || 'فشل حفظ الصلاحيات', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = FIELD_GROUPS.map(group => ({
    ...group,
    fields: group.fields.filter(f =>
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.field.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.fields.length > 0);

  const getGroupEditableStatus = (groupId: string) => {
    const group = FIELD_GROUPS.find(g => g.id === groupId);
    if (!group) return false;

    const allEditable = group.fields.every(f => permissions[f.field]);
    const someEditable = group.fields.some(f => permissions[f.field]);

    return allEditable ? true : someEditable ? 'some' : false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-l from-purple-600 to-purple-700 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black mb-1">صلاحيات الحقول الجماعية</h2>
              <p className="text-purple-100 text-sm font-bold">
                تطبيق الصلاحيات على جميع العائلات ({familyCount} عائلة) في المخيم
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-black text-amber-800 text-sm">⚠️ تحذير مهم</p>
              <p className="text-amber-700 text-xs font-bold mt-1">
                سيتم تطبيق هذه الصلاحيات على <strong>جميع العائلات</strong> في المخيم. لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن حقل..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-bold text-sm"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
              >
                تحديد الكل
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 transition-colors"
              >
                إلغاء الكل
              </button>
            </div>
          </div>
        </div>

        {/* Field Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-10 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const status = getGroupEditableStatus(group.id);
              return (
                <div key={group.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{group.icon}</span>
                      <span className="font-black text-gray-800">{group.label}</span>
                      <span className="text-xs text-gray-500 font-bold bg-white px-2 py-1 rounded-full">
                        {group.fields.length} حقول
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === true && (
                        <span className="text-xs text-purple-600 font-bold">الكل محدد</span>
                      )}
                      {status === 'some' && (
                        <span className="text-xs text-amber-600 font-bold">بعضها محدد</span>
                      )}
                      {status === false && (
                        <span className="text-xs text-gray-400 font-bold">غير محدد</span>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedGroups[group.id] ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Group Content */}
                  {expandedGroups[group.id] && (
                    <div className="p-4">
                      {/* Group-level toggle */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">تحديد المجموعة</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGroupToggle(group.id, true)}
                            className="px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            الكل
                          </button>
                          <button
                            onClick={() => handleGroupToggle(group.id, false)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            لا شيء
                          </button>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.fields.map((fieldItem) => (
                          <label
                            key={fieldItem.field}
                            className="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                            style={{
                              borderColor: permissions[fieldItem.field] ? '#9333ea' : '#e5e7eb',
                              backgroundColor: permissions[fieldItem.field] ? '#f3e8ff' : 'white'
                            }}
                          >
                            <span className="font-bold text-sm text-gray-700">{fieldItem.label}</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={permissions[fieldItem.field] || false}
                                onChange={() => handleToggle(fieldItem.field)}
                                className="sr-only"
                              />
                              <div
                                className={`w-12 h-6 rounded-full transition-colors ${
                                  permissions[fieldItem.field] ? 'bg-purple-600' : 'bg-gray-300'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${
                                    permissions[fieldItem.field] ? '-translate-x-6' : 'translate-x-1'
                                  }`}
                                  style={{ marginRight: permissions[fieldItem.field] ? '4px' : '2px' }}
                                />
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <p className="text-sm text-gray-600 font-bold">
              {Object.values(permissions).filter(Boolean).length} حقول قابلة للتعديل • {familyCount} عائلة
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-l from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التطبيق...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    تطبيق على الكل
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default BulkFieldPermissionsModal;
