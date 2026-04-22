// backend/utils/arabicMessages.js

/**
 * Arabic Messages Dictionary
 * Centralized translations for all backend error and success messages
 */

const messages = {
  // Authentication & Authorization
  auth: {
    invalidEmailOrPassword: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    roleMismatch: 'عدم تطابق الدور',
    accountInactive: 'الحساب غير نشط',
    campPendingApproval: 'تسجيل المخيم قيد الانتظار للموافقة. يرجى الاتصال بالمشرفين.',
    errorVerifyingCampStatus: 'خطأ في التحقق من حالة المخيم',
    emailRequired: 'البريد الإلكتروني مطلوب',
    passwordRequired: 'كلمة المرور مطلوبة',
    roleRequired: 'الدور مطلوب',
    passwordTooShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    unauthorizedChangePassword: 'غير مصرح بتغيير كلمة المرور هذه',
    userNotFound: 'المستخدم غير موجود',
    incorrectCurrentPassword: 'كلمة المرور الحالية غير صحيحة',
    failedUpdatePassword: 'فشل تحديث كلمة المرور',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    userIdRequired: 'معرف المستخدم مطلوب',
    unauthorized: 'غير مصرح',
    tokenRequired: 'رمز الوصول مطلوب',
    tokenExpired: 'انتهت صلاحية الرمز',
    invalidToken: 'الرمز غير صالح',
    authenticationRequired: 'المصادقة مطلوبة',
    insufficientPermissions: 'صلاحيات غير كافية'
  },

  // User Management
  users: {
    userNotFound: 'المستخدم غير موجود',
    emailInUse: 'البريد الإلكتروني مستخدم بالفعل',
    invalidEmailFormat: 'صيغة البريد الإلكتروني غير صحيحة',
    emailAlreadyInUse: 'البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر',
    firstNameRequired: 'الاسم الأول مطلوب',
    lastNameRequired: 'اسم العائلة مطلوب',
    roleInvalid: 'قيمة الدور غير صالحة',
    campAssignmentRequired: 'تعيين المخيم مطلوب لأدوار مدير المخيم وضابط الميدان',
    cannotDeleteOwnAccount: 'لا يمكن حذف حسابك الخاص',
    unauthorizedUpdateUser: 'غير مصرح بتحديث هذا المستخدم',
    unauthorizedDeleteUser: 'غير مصرح بحذف هذا المستخدم',
    unauthorizedResetPassword: 'غير مصرح بإعادة تعيين كلمة المرور لهذا المستخدم',
    passwordResetSuccess: 'تم إعادة تعيين كلمة المرور بنجاح',
    userCreated: 'تم إنشاء المستخدم بنجاح',
    fieldOfficerCreated: 'تم إنشاء ضابط الميدان بنجاح',
    userUpdated: 'تم تحديث المستخدم بنجاح',
    userDeleted: 'تم حذف المستخدم بنجاح',
    campIdNotFound: 'معرف المخيم غير موجود في الرمز',
    invalidRoleForRegistration: 'دور غير صالح للتسجيل. مسموح فقط لمديري المخيمات وضباط الميدان.',
    missingRequiredFields: 'البريد الإلكتروني وكلمة المرور والدور والاسم الأول مطلوبة',
    emailPasswordRoleRequired: 'البريد الإلكتروني وكلمة المرور والدور مطلوبة'
  },

  // Camp Management
  camps: {
    campNotFound: 'المخيم غير موجود',
    accessDenied: 'تم رفض الوصول',
    noCampAssociated: 'لا يوجد مخيم مرتبط بهذا المستخدم',
    campCreated: 'تم إنشاء المخيم بنجاح',
    campUpdated: 'تم تحديث المخيم بنجاح',
    campDeleted: 'تم حذف المخيم بنجاح',
    unauthorizedStatusChange: 'فقط مشرف النظام يمكنه تغيير الحالة من قيد الانتظار إلى نشط',
    campRegistrationPending: 'تسجيل المخيم قيد الانتظار للموافقة. يرجى الاتصال بالمشرفين.'
  },

  // Family (DP) Management
  families: {
    familyNotFound: 'العائلة غير موجودة',
    accessDenied: 'تم رفض الوصول',
    insufficientPermissions: 'صلاحيات غير كافية',
    missingNameFields: 'الرجاء إدخال الاسم الأول، اسم الأب، واسم العائلة',
    familyCreated: 'تم إنشاء العائلة بنجاح',
    familyUpdated: 'تم تحديث العائلة بنجاح',
    familyDeleted: 'تم حذف العائلة بنجاح',
    familyApproved: 'تم قبول العائلة بنجاح',
    familyRejected: 'تم رفض العائلة',
    rejectionReasonRequired: 'سبب الرفض مطلوب',
    unauthorizedApprove: 'غير مصرح بقبول هذه العائلة',
    unauthorizedReject: 'غير مصرح برفض هذه العائلة'
  },

  // Individual Management
  individuals: {
    individualNotFound: 'الفرد غير موجود',
    familyNotFound: 'العائلة غير موجودة',
    associatedFamilyNotFound: 'العائلة المرتبطة غير موجودة',
    accessDenied: 'تم رفض الوصول',
    insufficientPermissions: 'صلاحيات غير كافية',
    individualCreated: 'تم إنشاء الفرد بنجاح',
    individualUpdated: 'تم تحديث الفرد بنجاح',
    individualDeleted: 'تم حذف الفرد بنجاح',
    unauthorizedCreate: 'غير مصرح بإنشاء فرد في هذه العائلة',
    unauthorizedUpdate: 'غير مصرح بتحديث هذا الفرد',
    unauthorizedDelete: 'غير مصرح بحذف هذا الفرد'
  },

  // Inventory Management
  inventory: {
    itemNotFound: 'عنصر المخزون غير موجود',
    insufficientPermissions: 'صلاحيات غير كافية',
    fieldOfficersNoAccess: 'ضباط الميدان لا يمكنهم الوصول إلى المخزون',
    fieldOfficersNoAccessLedger: 'ضباط الميدان لا يمكنهم الوصول إلى سجل المخزون',
    campIdNotFoundInToken: 'معرف المخيم غير موجود في الرمز. يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى.',
    itemNameArabicRequired: 'الاسم العربي مطلوب',
    categoryRequired: 'الفئة مطلوبة',
    unitRequired: 'الوحدة مطلوبة',
    itemCreated: 'تم إنشاء عنصر المخزون بنجاح',
    itemUpdated: 'تم تحديث عنصر المخزون بنجاح',
    itemDeleted: 'تم حذف عنصر المخزون بنجاح',
    transactionTypeRequired: 'نوع المعاملة والكمية مطلوبة',
    invalidTransactionType: 'نوع المعاملة يجب أن يكون "in" أو "out"',
    invalidRelatedTo: 'قيمة related_to غير صالحة',
    insufficientQuantity: 'الكمية المتاحة غير كافية',
    transactionCreated: 'تم إنشاء المعاملة بنجاح',
    unauthorizedTransaction: 'غير مصرح بإنشاء معاملة لهذا العنصر'
  },

  // Aid Management
  aid: {
    campIdNotFound: 'معرف المخيم غير موجود في الرمز',
    insufficientPermissions: 'صلاحيات غير كافية',
    insufficientPermissionsCreateAidTypes: 'صلاحيات غير كافية لإنشاء أنواع المساعدة',
    fieldOfficersNoAccessCampaigns: 'ضباط الميدان لا يمكنهم الوصول إلى الحملات',
    nameArabicRequired: 'الاسم العربي مطلوب',
    categoryRequired: 'الفئة مطلوبة',
    unitRequired: 'الوحدة مطلوبة',
    aidTypeCreated: 'تم إنشاء نوع المساعدة بنجاح',
    aidTypeUpdated: 'تم تحديث نوع المساعدة بنجاح',
    aidTypeDeleted: 'تم حذف نوع المساعدة بنجاح',
    aidTypeNotFound: 'نوع المساعدة غير موجود',
    unauthorizedUpdateAidType: 'غير مصرح بتحديث نوع المساعدة هذا',
    unauthorizedDeleteAidType: 'غير مصرح بحذف نوع المساعدة هذا',
    familyNotFound: 'العائلة غير موجودة',
    campaignNotFound: 'الحملة غير موجودة',
    accessDenied: 'تم رفض الوصول',
    distributionCreated: 'تم إنشاء توزيع المساعدة بنجاح',
    nameAidTypeStartDateRequired: 'الاسم ونوع المساعدة وتاريخ البدء مطلوبة',
    endDateAfterStartDate: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء',
    campaignCreated: 'تم إنشاء الحملة بنجاح',
    campaignUpdated: 'تم تحديث الحملة بنجاح',
    campaignDeleted: 'تم حذف الحملة بنجاح',
    campaignNotFound: 'الحملة غير موجودة',
    unauthorizedUpdateCampaign: 'غير مصرح بتحديث هذه الحملة - ليست في مخيمك',
    unauthorizedDeleteCampaign: 'غير مصرح بحذف هذه الحملة - ليست في مخيمك',
    notCoordinator: 'تم رفض الوصول - لست المنسق'
  },

  // Reports
  reports: {
    insufficientPermissions: 'صلاحيات غير كافية',
    errorLoggingOperation: 'خطأ في تسجيل العملية'
  },

  // Configuration
  config: {
    configurationNotFound: 'الإعداد غير موجود',
    missingWeight: 'معرف الوزن مفقود',
    invalidWeightValue: 'قيمة الوزن غير صالحة',
    weightsUpdated: 'تم تحديث أوزان الضعف بنجاح',
    invalidSessionTimeout: 'قيمة مهلة الجلسة غير صالحة',
    invalidMaxLoginAttempts: 'قيمة الحد الأقصى لمحاولات تسجيل الدخول غير صالحة',
    securitySettingsUpdated: 'تم تحديث إعدادات الأمان بنجاح',
    aiSettingsUpdated: 'تم تحديث إعدادات الذكاء الاصطناعي بنجاح',
    invalidBackupFrequency: 'تكرار النسخ الاحتياطي غير صالح',
    generalSettingsUpdated: 'تم تحديث الإعدادات العامة بنجاح',
    aiSettingsNotFound: 'إعدادات الذكاء الاصطناعي غير موجودة'
  },

  // Backup & Sync
  backup: {
    insufficientPermissions: 'صلاحيات غير كافية',
    invalidScope: 'النطاق غير صالح. يجب أن يكون واحداً من: full, partial, camp_specific',
    campIdRequired: 'camp_id مطلوب لنطاق camp_specific',
    backupIdRequired: 'معرف النسخة الاحتياطية مطلوب',
    operationNotFound: 'العملية غير موجودة',
    accessDenied: 'تم رفض الوصول',
    backupNotCompleted: 'عملية النسخ الاحتياطي لم تكتمل بعد',
    backupDeleted: 'تم حذف النسخة الاحتياطية بنجاح',
    restoreOperationStarted: 'بدأت عملية الاستعادة',
    backupNotFound: 'النسخة الاحتياطية غير موجودة',
    backupNotCompletedYet: 'النسخة الاحتياطية لم تكتمل بعد'
  },

  // Transfer Requests
  transfers: {
    campIdRequired: 'معرف المخيم مطلوب',
    typeRequired: 'نوع الطلب مطلوب',
    invalidType: 'نوع الطلب غير صالح. يجب أن يكون: incoming, outgoing, أو all',
    transferRequestNotFound: 'طلب النقل غير موجود',
    dpIdRequired: 'معرف العائلة مطلوب',
    fromCampIdRequired: 'معرف المخيم الحالي مطلوب',
    toCampIdRequired: 'معرف المخيم الوجهة مطلوب',
    reasonRequired: 'سبب النقل مطلوب',
    transferRequestCreated: 'تم إنشاء طلب النقل بنجاح',
    transferRequestApproved: 'تم قبول طلب النقل بنجاح',
    transferRequestRejected: 'تم رفض طلب النقل',
    unauthorizedApprove: 'غير مصرح بقبول طلب النقل هذا',
    unauthorizedReject: 'غير مصرح برفض طلب النقل هذا',
    alreadyReviewed: 'تمت مراجعة طلب النقل بالفعل',
    cannotApproveRejected: 'لا يمكن قبول طلب مرفوض',
    cannotRejectApproved: 'لا يمكن رفض طلب مقبول',
    accessDenied: 'تم رفض الوصول'
  },

  // Database Errors
  database: {
    genericError: 'حدث خطأ في قاعدة البيانات',
    constraintViolation: 'انتهاك قيد قاعدة البيانات',
    connectionError: 'خطأ في الاتصال بقاعدة البيانات',
    queryError: 'خطأ في استعلام قاعدة البيانات'
  },

  // Validation
  validation: {
    requiredField: 'هذا الحقل مطلوب',
    invalidFormat: 'الصيغة غير صحيحة',
    invalidValue: 'القيمة غير صالحة',
    tooShort: 'القيمة قصيرة جداً',
    tooLong: 'القيمة طويلة جداً',
    notFound: 'غير موجود'
  },

  // Success Messages
  success: {
    operationCompleted: 'تمت العملية بنجاح',
    dataSaved: 'تم حفظ البيانات بنجاح',
    dataDeleted: 'تم حذف البيانات بنجاح',
    dataUpdated: 'تم تحديث البيانات بنجاح',
    dataCreated: 'تم إنشاء البيانات بنجاح'
  }
};

/**
 * Get Arabic message by key
 * @param {string} category - Message category (auth, users, camps, etc.)
 * @param {string} key - Message key within the category
 * @param {string} fallback - Fallback message if translation not found
 * @returns {string} Arabic message
 */
const getMessage = (category, key, fallback = null) => {
  if (messages[category] && messages[category][key]) {
    return messages[category][key];
  }
  return fallback || `Message not found: ${category}.${key}`;
};

/**
 * Get database error message in Arabic
 * @param {Error} error - Database error object
 * @returns {string} Arabic error message
 */
const getDatabaseErrorMessage = (error) => {
  if (!error) return messages.database.genericError;

  // Check for specific error patterns
  const errorMsg = error.message || '';
  const hint = error.hint || '';
  const detail = error.detail || '';

  // Foreign key violations
  if (errorMsg.includes('foreign key') || hint.includes('foreign key')) {
    return 'البيانات المرتبطة غير موجودة. يرجى التحقق من المرجع.';
  }

  // Unique constraint violations
  if (errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
    if (errorMsg.includes('email')) {
      return messages.users.emailInUse;
    }
    if (errorMsg.includes('national_id')) {
      return 'رقم الهوية مستخدم بالفعل';
    }
    return 'هذه البيانات موجودة بالفعل. يرجى التحقق من التكرار.';
  }

  // Not null violations
  if (errorMsg.includes('null') || errorMsg.includes('NOT NULL')) {
    return messages.validation.requiredField;
  }

  // Check constraint violations - provide more detailed error message
  if (errorMsg.includes('check') || detail.includes('check')) {
    // Try to extract the constraint name to provide a more specific error
    const constraintMatch = errorMsg.match(/constraint\s+([a-zA-Z_0-9]+)/i);
    if (constraintMatch && constraintMatch[1]) {
      const constraintName = constraintMatch[1];
      console.error('[CHECK Constraint Violation]', {
        constraint: constraintName,
        message: errorMsg,
        detail: detail,
        hint: hint
      });
      
      // Map common constraint names to friendly messages
      if (constraintName.includes('wife_disability_type')) {
        return 'قيمة إعاقة الزوجة غير صحيحة. القيم المسموحة: لا يوجد، حركية، بصرية، سمعية، ذهنية، أخرى';
      }
      if (constraintName.includes('wife_chronic_disease_type')) {
        return 'قيمة المرض المزمن للزوجة غير صحيحة. القيم المسموحة: لا يوجد، سكري، ضغط دم، قلب، سرطان، ربو، فشل كلوي، مرض نفسي، أخرى';
      }
      if (constraintName.includes('wife_war_injury_type')) {
        return 'قيمة إصابة الحرب للزوجة غير صحيحة. القيم المسموحة: لا يوجد، بتر، كسر، شظية، حرق، رأس/وجه، عمود فقري، أخرى';
      }
      if (constraintName.includes('head_of_family_marital_status')) {
        return 'قيمة الحالة الاجتماعية غير صحيحة. القيم المسموحة: أعزب، متزوج، أرمل، مطلق، أسرة هشة';
      }
      if (constraintName.includes('head_of_family_role')) {
        return 'قيمة دور رب العائلة غير صحيح. القيم المسموحة: أب، أم، زوجة';
      }
      if (constraintName.includes('head_of_family_disability_type')) {
        return 'قيمة إعاقة رب العائلة غير صحيحة. القيم المسموحة: لا يوجد، حركية، بصرية، سمعية، ذهنية، أخرى';
      }
      if (constraintName.includes('head_of_family_chronic_disease_type')) {
        return 'قيمة المرض المزمن غير صحيحة. القيم المسموحة: لا يوجد، سكري، ضغط دم، قلب، سرطان، ربو، فشل كلوي، مرض نفسي، أخرى';
      }
      if (constraintName.includes('head_of_family_war_injury_type')) {
        return 'قيمة إصابة الحرب غير صحيحة. القيم المسموحة: لا يوجد، بتر، كسر، شظية، حرق، رأس/وجه، عمود فقري، أخرى';
      }
      if (constraintName.includes('current_housing_type')) {
        return 'قيمة نوع السكن غير صحيحة. القيم المسموحة: خيمة، بيت إسمنتي، شقة، أخرى';
      }
      if (constraintName.includes('current_housing_sharing_status')) {
        return 'قيمة حالة المشاركة في السكن غير صحيحة. القيم المسموحة: سكن فردي، سكن مشترك';
      }
      if (constraintName.includes('current_housing_sanitary_facilities')) {
        return 'قيمة المرافق الصحية غير صحيحة. القيم المسموحة: نعم (دورة مياه خاصة)، لا (مرافق مشتركة)';
      }
      if (constraintName.includes('current_housing_water_source')) {
        return 'قيمة مصدر المياه غير صحيحة. القيم المسموحة: شبكة عامة، صهاريج، آبار، آخر';
      }
      if (constraintName.includes('current_housing_electricity_access')) {
        return 'قيمة مصدر الكهرباء غير صحيحة. القيم المسموحة: شبكة عامة، مولد، طاقة شمسية، لا يوجد، آخر';
      }
      if (constraintName.includes('vulnerability_priority')) {
        return 'قيمة أولوية الضعف غير صحيحة. القيم المسموحة: عالي جداً، عالي، متوسط، منخفض';
      }
      if (constraintName.includes('status')) {
        return 'قيمة الحالة غير صحيحة. القيم المسموحة: قيد الانتظار، موافق، مرفوض';
      }
      if (constraintName.includes('head_of_family_monthly_income_range')) {
        return 'قيمة نطاق الدخل غير صحيح. القيم المسموحة: بدون دخل، أقل من 100، 100-300، 300-500، أكثر من 500';
      }
      if (constraintName.includes('original_address_housing_type')) {
        return 'قيمة نوع السكن الأصلي غير صحيحة. القيم المسموحة: ملك، إيجار';
      }
      if (constraintName.includes('refugee_resident_abroad_residence_type')) {
        return 'قيمة نوع الإقامة غير صحيحة. القيم المسموحة: لاجئ، مقيم نظامي، أخرى';
      }
      
      // Generic check constraint error with more context
      return `القيمة غير صالحة: ${constraintName}. يرجى التحقق من أن البيانات المدخلة تطابق القيم المسموحة.`;
    }
    
    return messages.validation.invalidValue;
  }

  // Default to generic error with original message for debugging
  return errorMsg || messages.database.genericError;
};

/**
 * Format error response with Arabic message
 * @param {Object} error - Error object
 * @param {string} category - Error category
 * @param {string} key - Error key
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error, category = null, key = null) => {
  let arabicMessage = error.message || 'حدث خطأ غير معروف';

  // If category and key provided, use translated message
  if (category && key) {
    arabicMessage = getMessage(category, key, arabicMessage);
  }

  return {
    error: arabicMessage,
    message: arabicMessage,
    originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
};

module.exports = {
  messages,
  getMessage,
  getDatabaseErrorMessage,
  formatErrorResponse
};
