// services/realDataServiceBackend.ts
import { Camp, DPProfile, InventoryItem, TransferRequest, AidTransaction, AidCampaign, Role, User, FieldPermission } from '../types';
import { auditService } from './auditService';
import { sessionService } from './sessionService';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

// Vulnerability scores are automatically calculated by database triggers on INSERT/UPDATE

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001/api';

const delay = (ms: number = 300) => new Promise(res => setTimeout(res, ms));

// Retry configuration for 429 errors
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const calculateRetryDelay = (retryCount: number, retryAfterHeader: string | null): number => {
  if (retryAfterHeader) {
    const retryAfterSeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfterSeconds)) {
      return retryAfterSeconds * 1000;
    }
  }
  const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
};

// Helper function to calculate age from date of birth
const calculateAgeFromDate = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const realDataService = {
  async init() {
    // Initialization for real data service - verify connection to backend API
    try {
      // Attempt to verify the authentication token
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Optionally verify the token with the backend
        await makeAuthenticatedRequest('/auth/verify-token', {
          method: 'POST'
        });
      }
      console.log('Connected to backend API successfully');
    } catch (error) {
      console.warn('Warning: Could not verify connection to backend API.', error);
      // Show a more descriptive warning about possible network issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(`Could not connect to backend at ${BACKEND_API_URL}. Please ensure the backend server is running and accessible.`);
      }
    }
  },

  async authenticateUser(email: string, password: string, role: Role) {
    try {
      // Call the backend API to authenticate the user and receive a real JWT
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const { token, user } = await response.json();

      // Store the real JWT token in localStorage
      localStorage.setItem('auth_token', token);

      // Return user information
      return {
        id: user.id,
        role: user.role as Role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        lastLogin: new Date().toISOString(),
        campId: user.campId || undefined,
        familyId: user.familyId || undefined
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  async authenticateDP(nationalId: string) {
    try {
      // Call the backend API to authenticate the DP (beneficiary) and receive a JWT
      const response = await fetch(`${BACKEND_API_URL}/auth/dp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ national_id: nationalId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const { token, family } = await response.json();

      // Store the real JWT token in localStorage
      localStorage.setItem('auth_token', token);

      // Return family information
      return {
        id: family.id,
        role: Role.BENEFICIARY,
        familyId: family.id,
        nationalId: family.national_id,
        name: family.name
      };
    } catch (error) {
      console.error('DP authentication error:', error);
      throw error;
    }
  },

  async logAction(userId: string | undefined, action: string, details: string) {
    try {
      const token = sessionService.getToken();
      if (!token) {
        return; // Skip logging if not authenticated (e.g., during public registration)
      }
      
      // Parse action type and resource
      const actionType = action.split('_')[0].toUpperCase();
      let resourceType = 'general';

      if (action.includes('DP') || action.includes('FAMILY')) resourceType = 'families';
      else if (action.includes('CAMP')) resourceType = 'camps';
      else if (action.includes('USER')) resourceType = 'users';
      else if (action.includes('INVENTORY') || action.includes('ITEM')) resourceType = 'inventory';
      else if (action.includes('CAMPAIGN')) resourceType = 'aid_campaigns';
      else if (action.includes('TRANSFER')) resourceType = 'transfers';
      else if (action.includes('DISTRIBUTION')) resourceType = 'distributions';
      else if (action.includes('CONFIG') || action.includes('SETTING')) resourceType = 'global_config';
      else if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('AUTH')) resourceType = 'auth';

      // Extract resource ID from details
      const resourceId = details.includes('ID:') ? details.split('ID:')[1].trim().split(',')[0].trim() : undefined;

      // Use backend endpoint to log with real IP capture
      await makeAuthenticatedRequest('/reports/log-operation', {
        method: 'POST',
        body: JSON.stringify({
          operation_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          new_values: { action, details }
        })
      });
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't fail the main operation if logging fails
    }
  },

  async getUsers(): Promise<User[]> {
    const currentUser = sessionService.getCurrentUser();

    // CAMP_MANAGER can only get field officers in their camp
    if (currentUser?.role === Role.CAMP_MANAGER) {
      return await makeAuthenticatedRequest('/users/camp/field-officers');
    }

    // SYSTEM_ADMIN can get all users
    return await makeAuthenticatedRequest('/users');
  },

  async createUser(userData: {
    email: string;
    password: string;
    role: Role;
    campId?: string;
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    isActive?: boolean;
  }): Promise<User> {
    const currentUser = sessionService.getCurrentUser();

    // CAMP_MANAGER creates field officers in their camp
    if (currentUser?.role === Role.CAMP_MANAGER) {
      return await makeAuthenticatedRequest('/users/camp/field-officer', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    }

    // SYSTEM_ADMIN creates any user
    return await makeAuthenticatedRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUser(userId: string, updates: any): Promise<User> {
    return await makeAuthenticatedRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await makeAuthenticatedRequest(`/users/${userId}`, { method: 'DELETE' });
  },

  async resetPassword(userId: string, newPassword: string): Promise<any> {
    return await makeAuthenticatedRequest(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  async getAuditLogs(params: any): Promise<any> {
    try {
      const response = await makeAuthenticatedRequest(`/reports/system-operations?${new URLSearchParams(params).toString()}`);

      // Handle different response formats
      if (response.data) {
        return {
          data: response.data,
          totalCount: response.pagination?.total || response.totalCount || 0,
          page: response.pagination?.page || params.page || 1,
          totalPages: response.pagination?.totalPages || 1
        };
      }

      // If response is already an array
      return {
        data: Array.isArray(response) ? response : [],
        totalCount: 0,
        page: params.page || 1,
        totalPages: 1
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return {
        data: [],
        totalCount: 0,
        page: params.page || 1,
        totalPages: 1
      };
    }
  },

  async createBackup(scope: string, campId?: string, name?: string): Promise<any> {
    return await makeAuthenticatedRequest('/backup-sync', {
      method: 'POST',
      body: JSON.stringify({ scope, camp_id: campId, name })
    });
  },

  async getBackups(): Promise<any[]> {
    // Add timestamp to prevent caching
    return await makeAuthenticatedRequest(`/backup-sync?t=${Date.now()}`);
  },

  // Get all families across all camps (for SYSTEM_ADMIN)
  async getAllDPs(): Promise<DPProfile[]> {
    return await this.getDPs(); // Call getDPs without campId to fetch all
  },

  async getDPs(campId?: string, paginationParams?: { page?: number; limit?: number; searchQuery?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; filters?: Record<string, any> }): Promise<DPProfile[]> {
    await delay(); // Simulate network delay
    try {
      // Build query parameters
      let url = '/families';
      const queryParams = new URLSearchParams();

      if (campId) {
        queryParams.append('campId', campId);
      }

      if (paginationParams) {
        if (paginationParams.page) queryParams.append('page', paginationParams.page.toString());
        if (paginationParams.limit) queryParams.append('limit', paginationParams.limit.toString());
        if (paginationParams.searchQuery) queryParams.append('searchQuery', paginationParams.searchQuery);
        if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy);
        if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder);

        // Add filters
        if (paginationParams.filters) {
          Object.entries(paginationParams.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, Array.isArray(value) ? value.join(',') : String(value));
            }
          });
        }
      }

      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }

      console.log('=== GET DPS ===');
      console.log('Request URL:', url);
      console.log('Camp ID:', campId);

      // Use the backend API with JWT authentication
      const response = await makeAuthenticatedRequest(url);
      console.log('Response received:', response);

      // Backend returns array directly, not wrapped in {data: ...}
      const familyRecords = Array.isArray(response) ? response : (response?.data || []);

      console.log('Family records count:', familyRecords?.length || 0);
      if (familyRecords && familyRecords.length > 0) {
        console.log('First family status:', familyRecords[0].status);
        console.log('Status distribution:', {
          pending: familyRecords.filter((f: any) => f.status === 'قيد الانتظار').length,
          approved: familyRecords.filter((f: any) => f.status === 'موافق').length,
          rejected: familyRecords.filter((f: any) => f.status === 'مرفوض').length
        });
      }

      // Extract all family IDs for bulk individuals fetch
      const familyIds = familyRecords.map((f: any) => f.id);

      // Fetch ALL individuals in ONE bulk call (solves N+1 query problem)
      let allIndividuals: any[] = [];
      if (familyIds.length > 0) {
        allIndividuals = await makeAuthenticatedRequest('/individuals/bulk', {
          method: 'POST',
          body: JSON.stringify({ familyIds })
        });
      }

      // Group individuals by family_id for quick lookup
      const individualsByFamily: Record<string, any[]> = {};
      allIndividuals.forEach((ind: any) => {
        if (!individualsByFamily[ind.family_id]) {
          individualsByFamily[ind.family_id] = [];
        }
        individualsByFamily[ind.family_id].push(ind);
      });

      console.log('Total individuals fetched:', allIndividuals.length);
      console.log('Families with individuals:', Object.keys(individualsByFamily).length);

      const dps: DPProfile[] = [];

      for (const familyRecord of familyRecords) {
        // Get individuals for this family from pre-fetched data
        const individualRecords = individualsByFamily[familyRecord.id] || [];

        const dp: DPProfile = {
          id: familyRecord.id,
          // 4-part name structure (Migration 015)
          headFirstName: familyRecord.head_first_name || undefined,
          headFatherName: familyRecord.head_father_name || undefined,
          headGrandfatherName: familyRecord.head_grandfather_name || undefined,
          headFamilyName: familyRecord.head_family_name || undefined,
          headOfFamily: familyRecord.head_of_family_name,
          nationalId: familyRecord.head_of_family_national_id,
          gender: familyRecord.head_of_family_gender as 'ذكر' | 'أنثى',
          dateOfBirth: familyRecord.head_of_family_date_of_birth,
          age: familyRecord.head_of_family_age,
          maritalStatus: familyRecord.head_of_family_marital_status as any,
          widowReason: familyRecord.head_of_family_widow_reason as any,
          headRole: familyRecord.head_of_family_role as any,
          isWorking: familyRecord.head_of_family_is_working,
          job: familyRecord.head_of_family_job,
          monthlyIncome: familyRecord.head_of_family_monthly_income || undefined,
          monthlyIncomeRange: familyRecord.head_of_family_monthly_income_range || null,
          phoneNumber: familyRecord.head_of_family_phone_number,
          phoneSecondary: familyRecord.head_of_family_phone_secondary || undefined,
          disabilityType: familyRecord.head_of_family_disability_type as any,
          disabilitySeverity: familyRecord.head_of_family_disability_severity as any,
          disabilityDetails: familyRecord.head_of_family_disability_details || undefined,
          chronicDiseaseType: familyRecord.head_of_family_chronic_disease_type as any,
          chronicDiseaseDetails: familyRecord.head_of_family_chronic_disease_details || undefined,
          warInjuryType: familyRecord.head_of_family_war_injury_type as any,
          warInjuryDetails: familyRecord.head_of_family_war_injury_details || undefined,
          medicalFollowupRequired: familyRecord.head_of_family_medical_followup_required,
          medicalFollowupFrequency: familyRecord.head_of_family_medical_followup_frequency || undefined,
          medicalFollowupDetails: familyRecord.head_of_family_medical_followup_details || undefined,
          wifeName: familyRecord.wife_name || undefined,
          wifeNationalId: familyRecord.wife_national_id || undefined,
          wifeDateOfBirth: familyRecord.wife_date_of_birth || undefined,
          wifeAge: familyRecord.wife_date_of_birth ? calculateAgeFromDate(familyRecord.wife_date_of_birth) : undefined,
          wifeIsPregnant: familyRecord.wife_is_pregnant,
          wifePregnancyMonth: familyRecord.wife_pregnancy_month || undefined,
          wifePregnancySpecialNeeds: familyRecord.wife_pregnancy_special_needs || false,
          wifePregnancyFollowupDetails: familyRecord.wife_pregnancy_followup_details || undefined,
          wifeIsWorking: familyRecord.wife_is_working || false,
          wifeOccupation: familyRecord.wife_occupation || undefined,
          wifeMedicalFollowupRequired: familyRecord.wife_medical_followup_required || false,
          wifeMedicalFollowupFrequency: familyRecord.wife_medical_followup_frequency || undefined,
          wifeMedicalFollowupDetails: familyRecord.wife_medical_followup_details || undefined,
          wifeDisabilityType: familyRecord.wife_disability_type as any,
          wifeDisabilitySeverity: familyRecord.wife_disability_severity as any,
          wifeDisabilityDetails: familyRecord.wife_disability_details || undefined,
          wifeChronicDiseaseType: familyRecord.wife_chronic_disease_type as any,
          wifeChronicDiseaseDetails: familyRecord.wife_chronic_disease_details || undefined,
          wifeWarInjuryType: familyRecord.wife_war_injury_type as any,
          wifeWarInjuryDetails: familyRecord.wife_war_injury_details || undefined,
          // Husband fields (for female-headed households)
          husbandName: familyRecord.husband_name || undefined,
          husbandNationalId: familyRecord.husband_national_id || undefined,
          husbandDateOfBirth: familyRecord.husband_date_of_birth || undefined,
          husbandAge: familyRecord.husband_date_of_birth ? calculateAgeFromDate(familyRecord.husband_date_of_birth) : undefined,
          husbandIsWorking: familyRecord.husband_is_working || false,
          husbandOccupation: familyRecord.husband_occupation || undefined,
          husbandMedicalFollowupRequired: familyRecord.husband_medical_followup_required || false,
          husbandMedicalFollowupFrequency: familyRecord.husband_medical_followup_frequency || undefined,
          husbandMedicalFollowupDetails: familyRecord.husband_medical_followup_details || undefined,
          husbandDisabilityType: familyRecord.husband_disability_type as any,
          husbandDisabilitySeverity: familyRecord.husband_disability_severity as any,
          husbandDisabilityDetails: familyRecord.husband_disability_details || undefined,
          husbandChronicDiseaseType: familyRecord.husband_chronic_disease_type as any,
          husbandChronicDiseaseDetails: familyRecord.husband_chronic_disease_details || undefined,
          husbandWarInjuryType: familyRecord.husband_war_injury_type as any,
          husbandWarInjuryDetails: familyRecord.husband_war_injury_details || undefined,
          members: individualRecords.map((ind: any) => ({
            id: ind.id,
            firstName: ind.first_name || '',
            fatherName: ind.father_name || '',
            grandfatherName: ind.grandfather_name || '',
            familyName: ind.family_name || '',
            name: ind.name,
            nationalId: ind.national_id || undefined,
            gender: ind.gender as 'ذكر' | 'أنثى',
            dateOfBirth: ind.date_of_birth,
            age: ind.age,
            relation: ind.relation as any,
            educationLevel: ind.education_level as any,
            occupation: ind.occupation || undefined,
            phoneNumber: ind.phone_number || undefined,
            maritalStatus: ind.marital_status as any,
            disabilityType: ind.disability_type as any,
            disabilityDetails: ind.disability_details || undefined,
            chronicDiseaseType: ind.chronic_disease_type as any,
            chronicDiseaseDetails: ind.chronic_disease_details || undefined,
            hasWarInjury: ind.has_war_injury,
            warInjuryType: ind.war_injury_type as any,
            warInjuryDetails: ind.war_injury_details || undefined,
            medicalFollowupRequired: ind.medical_followup_required || false,
            medicalFollowupFrequency: ind.medical_followup_frequency || undefined,
          })),
          totalMembersCount: familyRecord.total_members_count,
          maleCount: familyRecord.male_count,
          femaleCount: familyRecord.female_count,
          childCount: familyRecord.child_count,
          teenagerCount: familyRecord.teenager_count,
          adultCount: familyRecord.adult_count,
          seniorCount: familyRecord.senior_count,
          disabledCount: familyRecord.disabled_count,
          injuredCount: familyRecord.injured_count,
          pregnantWomenCount: familyRecord.pregnant_women_count,
          originalAddress: {
            governorate: familyRecord.original_address_governorate,
            region: familyRecord.original_address_region,
            details: familyRecord.original_address_details,
            housingType: familyRecord.original_address_housing_type as any,
          },
          currentHousing: {
            type: familyRecord.current_housing_type as any,
            campId: familyRecord.current_housing_camp_id,
            unitNumber: familyRecord.current_housing_unit_number || undefined,
            isSuitableForFamilySize: familyRecord.current_housing_is_suitable_for_family_size,
            sanitaryFacilities: familyRecord.current_housing_sanitary_facilities || familyRecord.current_housing_sanitary_conditions || undefined,
            waterSource: familyRecord.current_housing_water_source || undefined,
            electricityAccess: familyRecord.current_housing_electricity_access || undefined,
            landmark: familyRecord.current_housing_landmark,
            governorate: familyRecord.current_housing_governorate || undefined,
            region: familyRecord.current_housing_region || undefined,
            sharingStatus: familyRecord.current_housing_sharing_status as any,
            detailedType: familyRecord.current_housing_detailed_type || undefined,
            furnished: familyRecord.current_housing_furnished || undefined,
          },
          // ⚠️  DISABLED: Vulnerability score system
          vulnerabilityScore: 0, // familyRecord.vulnerability_score ? parseFloat(familyRecord.vulnerability_score.toString()) : 0,
          vulnerabilityPriority: null as any, // familyRecord.vulnerability_priority as any,
          vulnerabilityBreakdown: null as any, // familyRecord.vulnerability_breakdown as any,
          vulnerabilityReason: familyRecord.vulnerability_reason || undefined,
          nominationBody: familyRecord.nomination_body || undefined,
          adminNotes: familyRecord.admin_notes || undefined,
          // Ensure status is always consistent with schema (Option B: قيد الانتظار)
          registrationStatus:
            familyRecord.status === 'قيد الانتظار' ? 'قيد الانتظار' :
              familyRecord.status === 'موافق' ? 'موافق' :
                familyRecord.status === 'مرفوض' ? 'مرفوض' :
                  'قيد الانتظار',
          idCardUrl: familyRecord.id_card_url || undefined,
          medicalReportUrl: familyRecord.medical_report_url || undefined,
          signatureUrl: familyRecord.signature_url || undefined,
          // Flat fields for direct display
          originalAddressGovernorate: familyRecord.original_address_governorate,
          originalAddressRegion: familyRecord.original_address_region,
          originalAddressDetails: familyRecord.original_address_details,
          originalAddressHousingType: familyRecord.original_address_housing_type,
          currentHousingType: familyRecord.current_housing_type,
          currentHousingIsSuitable: familyRecord.current_housing_is_suitable_for_family_size,
          currentHousingSanitaryFacilities: familyRecord.current_housing_sanitary_facilities,
          currentHousingWaterSource: familyRecord.current_housing_water_source,
          currentHousingElectricityAccess: familyRecord.current_housing_electricity_access,
          currentHousingGovernorate: familyRecord.current_housing_governorate,
          currentHousingRegion: familyRecord.current_housing_region,
          currentHousingLandmark: familyRecord.current_housing_landmark,
          currentHousingSharingStatus: familyRecord.current_housing_sharing_status,
          currentHousingDetailedType: familyRecord.current_housing_detailed_type,
          currentHousingFurnished: familyRecord.current_housing_furnished,
          campId: familyRecord.camp_id,
          registeredDate: familyRecord.registered_date,
          lastUpdated: familyRecord.last_updated,
          chronicCount: familyRecord.chronic_count || 0,
          medicalFollowupCount: familyRecord.medical_followup_count || 0,
          aidHistory: [] // Will be populated by caller if needed or left empty
        };

        dps.push(dp);
      }

      console.log('Total DPS mapped:', dps.length);
      console.log('DPS with pending status:', dps.filter(d => d.registrationStatus === 'قيد الانتظار').length);

      // Note: Sorting is now handled server-side, so we don't need to sort here
      return dps || [];
    } catch (error) {
      console.warn('Warning: Error fetching DPs from backend API, returning empty array:', error);
      // Return empty array instead of throwing, allowing graceful degradation
      return [];
    }
  },

  async createDP(familyData: any): Promise<any> {
    return await makeAuthenticatedRequest('/families', {
      method: 'POST',
      body: JSON.stringify(familyData)
    });
  },

  async updateDP(id: string, updates: any): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async approveDP(id: string, adminNotes?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes })
    });
  },

  async rejectDP(id: string, rejectionReason: string): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: rejectionReason })
    });
  },

  async deleteDP(id: string): Promise<void> {
    await makeAuthenticatedRequest(`/families/${id}`, { method: 'DELETE' });
  },

  async getDPById(id: string): Promise<DPProfile | null> {
    await delay(); // Simulate network delay
    try {
      console.log('[getDPById] Fetching DP:', id);
      console.log('[getDPById] Backend API URL:', process.env.BACKEND_API_URL || 'http://localhost:3001/api');

      let familyRecord = null;
      try {
        familyRecord = await makeAuthenticatedRequest(`/families/${id}`);
      } catch (fetchError: any) {
        // Return null for 404 (family not found) instead of throwing
        if (fetchError?.status === 404) {
          console.log('[getDPById] Family not found (404), returning null');
          return null;
        }
        console.error('[getDPById] Failed to fetch family:', fetchError);
        console.error('[getDPById] Error status:', fetchError?.status);
        console.error('[getDPById] Error data:', fetchError?.data);
        throw fetchError;
      }

      console.log('[getDPById] Family record received:', familyRecord ? familyRecord.head_of_family_name : 'null');
      console.log('[getDPById] Full family record:', JSON.stringify(familyRecord, null, 2));

      if (!familyRecord) {
        console.log('[getDPById] No family record found');
        return null;
      }

      // Get individuals for this family
      const individualRecords = await makeAuthenticatedRequest(`/individuals?familyId=${familyRecord.id}`);
      console.log('[getDPById] Individual records count:', individualRecords?.length || 0);

      // Get aid history for this family - use correct endpoint
      let aidDistributions = [];
      try {
        aidDistributions = await makeAuthenticatedRequest(`/aid/distributions/family/${familyRecord.id}`);
      } catch (aidError) {
        console.log('[getDPById] Could not fetch aid distributions, using empty array:', aidError);
      }
      console.log('[getDPById] Aid distributions count:', aidDistributions?.length || 0);

      const dp: DPProfile = {
        id: familyRecord.id,
        // 4-part name structure (Migration 015)
        headFirstName: familyRecord.head_first_name || undefined,
        headFatherName: familyRecord.head_father_name || undefined,
        headGrandfatherName: familyRecord.head_grandfather_name || undefined,
        headFamilyName: familyRecord.head_family_name || undefined,
        headOfFamily: familyRecord.head_of_family_name,
        nationalId: familyRecord.head_of_family_national_id,
        gender: familyRecord.head_of_family_gender as 'ذكر' | 'أنثى',
        dateOfBirth: familyRecord.head_of_family_date_of_birth,
        age: familyRecord.head_of_family_age,
        maritalStatus: familyRecord.head_of_family_marital_status as any,
        widowReason: familyRecord.head_of_family_widow_reason as any,
        headRole: familyRecord.head_of_family_role as any,
        isWorking: familyRecord.head_of_family_is_working,
        job: familyRecord.head_of_family_job,
        monthlyIncome: familyRecord.head_of_family_monthly_income || undefined,
        monthlyIncomeRange: familyRecord.head_of_family_monthly_income_range || undefined,
        phoneNumber: familyRecord.head_of_family_phone_number,
        phoneSecondary: familyRecord.head_of_family_phone_secondary || undefined,
        disabilityType: familyRecord.head_of_family_disability_type as any,
        disabilitySeverity: familyRecord.head_of_family_disability_severity as any,
        disabilityDetails: familyRecord.head_of_family_disability_details || undefined,
        chronicDiseaseType: familyRecord.head_of_family_chronic_disease_type as any,
        chronicDiseaseDetails: familyRecord.head_of_family_chronic_disease_details || undefined,
        warInjuryType: familyRecord.head_of_family_war_injury_type as any,
        warInjuryDetails: familyRecord.head_of_family_war_injury_details || undefined,
        medicalFollowupRequired: familyRecord.head_of_family_medical_followup_required,
        medicalFollowupFrequency: familyRecord.head_of_family_medical_followup_frequency || undefined,
        medicalFollowupDetails: familyRecord.head_of_family_medical_followup_details || undefined,
        wifeName: familyRecord.wife_name || undefined,
        wifeNationalId: familyRecord.wife_national_id || undefined,
        wifeDateOfBirth: familyRecord.wife_date_of_birth || undefined,
        wifeAge: familyRecord.wife_date_of_birth ? calculateAgeFromDate(familyRecord.wife_date_of_birth) : undefined,
        wifeIsPregnant: familyRecord.wife_is_pregnant,
        wifePregnancyMonth: familyRecord.wife_pregnancy_month || undefined,
        wifePregnancySpecialNeeds: familyRecord.wife_pregnancy_special_needs || false,
        wifePregnancyFollowupDetails: familyRecord.wife_pregnancy_followup_details || undefined,
        wifeIsWorking: familyRecord.wife_is_working || undefined,
        wifeOccupation: familyRecord.wife_occupation || undefined,
        wifeMedicalFollowupRequired: familyRecord.wife_medical_followup_required || false,
        wifeMedicalFollowupFrequency: familyRecord.wife_medical_followup_frequency || undefined,
        wifeMedicalFollowupDetails: familyRecord.wife_medical_followup_details || undefined,
        wifeDisabilityType: familyRecord.wife_disability_type as any,
        wifeDisabilitySeverity: familyRecord.wife_disability_severity as any,
        wifeDisabilityDetails: familyRecord.wife_disability_details || undefined,
        wifeChronicDiseaseType: familyRecord.wife_chronic_disease_type as any,
        wifeChronicDiseaseDetails: familyRecord.wife_chronic_disease_details || undefined,
        wifeWarInjuryType: familyRecord.wife_war_injury_type as any,
        wifeWarInjuryDetails: familyRecord.wife_war_injury_details || undefined,
        // Husband fields (for female-headed households)
        husbandName: familyRecord.husband_name || undefined,
        husbandNationalId: familyRecord.husband_national_id || undefined,
        husbandDateOfBirth: familyRecord.husband_date_of_birth || undefined,
        husbandAge: familyRecord.husband_date_of_birth ? calculateAgeFromDate(familyRecord.husband_date_of_birth) : undefined,
        husbandIsWorking: familyRecord.husband_is_working || false,
        husbandOccupation: familyRecord.husband_occupation || undefined,
        husbandMedicalFollowupRequired: familyRecord.husband_medical_followup_required || false,
        husbandMedicalFollowupFrequency: familyRecord.husband_medical_followup_frequency || undefined,
        husbandMedicalFollowupDetails: familyRecord.husband_medical_followup_details || undefined,
        husbandDisabilityType: familyRecord.husband_disability_type as any,
        husbandDisabilitySeverity: familyRecord.husband_disability_severity as any,
        husbandDisabilityDetails: familyRecord.husband_disability_details || undefined,
        husbandChronicDiseaseType: familyRecord.husband_chronic_disease_type as any,
        husbandChronicDiseaseDetails: familyRecord.husband_chronic_disease_details || undefined,
        husbandWarInjuryType: familyRecord.husband_war_injury_type as any,
        husbandWarInjuryDetails: familyRecord.husband_war_injury_details || undefined,
        members: (individualRecords || []).map((ind: any) => ({
          id: ind.id,
          firstName: ind.first_name || '',
          fatherName: ind.father_name || '',
          grandfatherName: ind.grandfather_name || '',
          familyName: ind.family_name || '',
          name: ind.name,
          nationalId: ind.national_id || undefined,
          gender: ind.gender as 'ذكر' | 'أنثى',
          dateOfBirth: ind.date_of_birth,
          age: ind.age,
          relation: ind.relation as any,
          educationLevel: ind.education_level as any,
          occupation: ind.occupation || undefined,
          phoneNumber: ind.phone_number || undefined,
          maritalStatus: ind.marital_status as any,
          disabilityType: ind.disability_type as any,
          disabilityDetails: ind.disability_details || undefined,
          chronicDiseaseType: ind.chronic_disease_type as any,
          chronicDiseaseDetails: ind.chronic_disease_details || undefined,
          hasWarInjury: ind.has_war_injury,
          warInjuryType: ind.war_injury_type as any,
          warInjuryDetails: ind.war_injury_details || undefined,
          medicalFollowupRequired: ind.medical_followup_required || false,
          medicalFollowupFrequency: ind.medical_followup_frequency || undefined,
        })),
        totalMembersCount: familyRecord.total_members_count,
        maleCount: familyRecord.male_count,
        femaleCount: familyRecord.female_count,
        childCount: familyRecord.child_count,
        teenagerCount: familyRecord.teenager_count,
        adultCount: familyRecord.adult_count,
        seniorCount: familyRecord.senior_count,
        disabledCount: familyRecord.disabled_count,
        injuredCount: familyRecord.injured_count,
        pregnantWomenCount: familyRecord.pregnant_women_count,
        originalAddress: {
          governorate: familyRecord.original_address_governorate,
          region: familyRecord.original_address_region,
          details: familyRecord.original_address_details,
          housingType: familyRecord.original_address_housing_type as any,
        },
        currentHousing: {
          type: familyRecord.current_housing_type as any,
          campId: familyRecord.current_housing_camp_id || familyRecord.camp_id,
          unitNumber: familyRecord.current_housing_unit_number || undefined,
          isSuitableForFamilySize: familyRecord.current_housing_is_suitable_for_family_size,
          sanitaryFacilities: familyRecord.current_housing_sanitary_facilities || familyRecord.current_housing_sanitary_conditions || undefined,
          waterSource: familyRecord.current_housing_water_source || undefined,
          electricityAccess: familyRecord.current_housing_electricity_access || undefined,
          landmark: familyRecord.current_housing_landmark,
          governorate: familyRecord.current_housing_governorate || undefined,
          region: familyRecord.current_housing_region || undefined,
          sharingStatus: familyRecord.current_housing_sharing_status as any,
          detailedType: familyRecord.current_housing_detailed_type || undefined,
          furnished: familyRecord.current_housing_furnished || undefined,
        },
        refugeeResidentAbroad: familyRecord.refugee_resident_abroad_country ? {
          country: familyRecord.refugee_resident_abroad_country,
          city: familyRecord.refugee_resident_abroad_city || undefined,
          residenceType: familyRecord.refugee_resident_abroad_residence_type as any,
        } : undefined,
        // ⚠️  DISABLED: Vulnerability score system
        vulnerabilityScore: 0, // familyRecord.vulnerability_score ? parseFloat(familyRecord.vulnerability_score.toString()) : 0,
        vulnerabilityPriority: null as any, // familyRecord.vulnerability_priority as any,
        vulnerabilityBreakdown: null as any, // familyRecord.vulnerability_breakdown as any,
        vulnerabilityReason: familyRecord.vulnerability_reason || undefined,
        nominationBody: familyRecord.nomination_body || undefined,
        adminNotes: familyRecord.admin_notes || undefined,
        // Ensure status is always consistent with schema (Option B: قيد الانتظار)
        registrationStatus:
          familyRecord.status === 'قيد الانتظار' ? 'قيد الانتظار' :
            familyRecord.status === 'موافق' ? 'موافق' :
              familyRecord.status === 'مرفوض' ? 'مرفوض' :
                'قيد الانتظار',
        idCardUrl: familyRecord.id_card_url || undefined,
        medicalReportUrl: familyRecord.medical_report_url || undefined,
        signatureUrl: familyRecord.signature_url || undefined,
        registeredDate: familyRecord.registered_date,
        lastUpdated: familyRecord.last_updated,
        chronicCount: familyRecord.chronic_count || 0,
        medicalFollowupCount: familyRecord.medical_followup_count || 0,
        aidHistory: aidDistributions.map(a => ({ ...a, date: a.date || a.distribution_date })) || []
      };

      console.log('[getDPById] DP loaded successfully:', dp.headOfFamily);
      console.log('[getDPById] Husband data in DP:', {
        husbandName: dp.husbandName,
        husbandNationalId: dp.husbandNationalId,
        husbandDateOfBirth: dp.husbandDateOfBirth,
        husbandOccupation: dp.husbandOccupation
      });
      return dp;
    } catch (error: any) {
      console.error('[getDPById] Error fetching DP:', error);
      console.error('[getDPById] Error message:', error?.message);
      console.error('[getDPById] Error status:', error?.status);
      console.error('[getDPById] Error data:', error?.data);
      return null;
    }
  },

  async lookupFamilyByNationalId(nationalId: string, retryCount = 0): Promise<{ id: string; nationalId: string; name: string; status: string; campId?: string } | null> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/public/families/lookup?national_id=${encodeURIComponent(nationalId)}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Family not found
        }

        // Handle 429 Too Many Requests with retry logic
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After') || response.headers.get('RateLimit-Reset');
          const delay = calculateRetryDelay(retryCount, retryAfter);

          console.warn(`[Rate Limit] Hit 429 error. Retry ${retryCount + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);

          await sleep(delay);
          return this.lookupFamilyByNationalId(nationalId, retryCount + 1);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        nationalId: data.national_id,
        name: data.name,
        status: data.status,
        campId: data.camp_id
      };
    } catch (error) {
      console.error('Error looking up family:', error);
      return null;
    }
  },

  async approveFamily(id: string, admin_notes?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes })
    });
  },

  async rejectFamily(id: string, rejection_reason: string): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason })
    });
  },

  async saveDP(dp: DPProfile, userId?: string, isPublicRegistration: boolean = false) {
    await delay(); // Simulate network delay
    try {
      // ⚠️  DISABLED: Vulnerability score system - no longer auto-calculated
      // Database columns kept for potential future re-enablement
      // The database will NOT populate: vulnerability_score, vulnerability_priority, vulnerability_breakdown

      // Prepare family record
      const familyRecord = {
        id: dp.id,
        camp_id: dp.currentHousing.campId,
        // 4-part name structure (required by backend validation)
        head_first_name: dp.headFirstName || '',
        head_father_name: dp.headFatherName || '',
        head_grandfather_name: dp.headGrandfatherName || '',
        head_family_name: dp.headFamilyName || '',
        head_of_family_name: dp.headOfFamily,
        head_of_family_national_id: dp.nationalId,
        head_of_family_gender: dp.gender,
        head_of_family_date_of_birth: dp.dateOfBirth,
        head_of_family_age: dp.age,
        head_of_family_marital_status: dp.maritalStatus,
        head_of_family_widow_reason: dp.widowReason || null,
        head_of_family_role: dp.headRole,
        head_of_family_is_working: dp.isWorking,
        head_of_family_job: dp.job || '',
        head_of_family_monthly_income: dp.monthlyIncome || null,
        head_of_family_phone_number: dp.phoneNumber,
        head_of_family_phone_secondary: dp.phoneSecondary || '',
        head_of_family_disability_type: dp.disabilityType,
        head_of_family_disability_details: dp.disabilityDetails || '',
        head_of_family_chronic_disease_type: dp.chronicDiseaseType,
        head_of_family_chronic_disease_details: dp.chronicDiseaseDetails || '',
        head_of_family_war_injury_type: dp.warInjuryType,
        head_of_family_war_injury_details: dp.warInjuryDetails || '',
        head_of_family_medical_followup_required: dp.medicalFollowupRequired,
        head_of_family_medical_followup_frequency: dp.medicalFollowupFrequency || '',
        wife_name: dp.wifeName || '',
        wife_national_id: dp.wifeNationalId || '',
        wife_date_of_birth: dp.wifeDateOfBirth || null,
        wife_is_pregnant: dp.wifeIsPregnant,
        wife_pregnancy_month: dp.wifePregnancyMonth || null,
        wife_pregnancy_special_needs: dp.wifePregnancySpecialNeeds || false,
        wife_pregnancy_followup_details: dp.wifePregnancyFollowupDetails || '',
        wife_is_working: dp.wifeIsWorking || false,
        wife_occupation: dp.wifeOccupation || '',
        wife_medical_followup_required: dp.wifeMedicalFollowupRequired,
        wife_medical_followup_frequency: dp.wifeMedicalFollowupFrequency || '',
        wife_medical_followup_details: dp.wifeMedicalFollowupDetails || '',
        wife_disability_type: dp.wifeDisabilityType || 'لا يوجد',
        wife_disability_severity: dp.wifeDisabilitySeverity || null,
        wife_disability_details: dp.wifeDisabilityDetails || '',
        wife_chronic_disease_type: dp.wifeChronicDiseaseType || 'لا يوجد',
        wife_chronic_disease_details: dp.wifeChronicDiseaseDetails || '',
        wife_war_injury_type: dp.wifeWarInjuryType || 'لا يوجد',
        wife_war_injury_details: dp.wifeWarInjuryDetails || '',
        // Husband fields (for female-headed households)
        husband_name: dp.husbandName || '',
        husband_national_id: dp.husbandNationalId || '',
        husband_date_of_birth: dp.husbandDateOfBirth || null,
        husband_is_working: dp.husbandIsWorking || false,
        husband_occupation: dp.husbandOccupation || '',
        husband_medical_followup_required: dp.husbandMedicalFollowupRequired || false,
        husband_medical_followup_frequency: dp.husbandMedicalFollowupFrequency || '',
        husband_medical_followup_details: dp.husbandMedicalFollowupDetails || '',
        husband_disability_type: dp.husbandDisabilityType || 'لا يوجد',
        husband_disability_severity: dp.husbandDisabilitySeverity || null,
        husband_disability_details: dp.husbandDisabilityDetails || '',
        husband_chronic_disease_type: dp.husbandChronicDiseaseType || 'لا يوجد',
        husband_chronic_disease_details: dp.husbandChronicDiseaseDetails || '',
        husband_war_injury_type: dp.husbandWarInjuryType || 'لا يوجد',
        husband_war_injury_details: dp.husbandWarInjuryDetails || '',
        total_members_count: dp.totalMembersCount,
        male_count: dp.maleCount,
        female_count: dp.femaleCount,
        child_count: dp.childCount,
        teenager_count: dp.teenagerCount,
        adult_count: dp.adultCount,
        senior_count: dp.seniorCount,
        disabled_count: dp.disabledCount,
        injured_count: dp.injuredCount,
        pregnant_women_count: dp.pregnantWomenCount,
        original_address_governorate: dp.originalAddress.governorate,
        original_address_region: dp.originalAddress.region,
        original_address_details: dp.originalAddress.details,
        original_address_housing_type: dp.originalAddress.housingType,
        current_housing_type: dp.currentHousing.type,
        current_housing_camp_id: dp.currentHousing.campId,
        current_housing_unit_number: dp.currentHousing.unitNumber || '',
        current_housing_is_suitable_for_family_size: dp.currentHousing.isSuitableForFamilySize,
        current_housing_sanitary_facilities: dp.currentHousing.sanitaryFacilities || null,
        current_housing_water_source: dp.currentHousing.waterSource || null,
        current_housing_electricity_access: dp.currentHousing.electricityAccess || null,
        current_housing_governorate: dp.currentHousing.governorate || null,
        current_housing_region: dp.currentHousing.region || null,
        current_housing_landmark: dp.currentHousing.landmark,
        // Set status for new family registrations
        status: 'قيد الانتظار',
        // ⚠️  DISABLED: vulnerability_score, vulnerability_priority, vulnerability_breakdown are NOT auto-calculated
        vulnerability_reason: dp.vulnerabilityReason || '',
        nomination_body: dp.nominationBody || '',
        admin_notes: dp.adminNotes || '',
        registered_date: dp.registeredDate,
        last_updated: new Date().toISOString(),
        id_card_url: dp.idCardUrl || '',
        medical_report_url: dp.medicalReportUrl || '',
        signature_url: dp.signatureUrl || '',
      };

      // Save family to database via backend API
      let response;
      if (isPublicRegistration) {
        // For public registration, use the public endpoint that doesn't require auth
        // Implement retry logic for 429 errors
        let publicResponse;
        let retryCount = 0;

        while (retryCount <= MAX_RETRIES) {
          publicResponse = await fetch(`${BACKEND_API_URL}/public/families`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(familyRecord)
          });

          if (!publicResponse.ok) {
            // Handle 429 Too Many Requests with retry logic
            if (publicResponse.status === 429 && retryCount < MAX_RETRIES) {
              const retryAfter = publicResponse.headers.get('Retry-After') || publicResponse.headers.get('RateLimit-Reset');
              const delay = calculateRetryDelay(retryCount, retryAfter);

              console.warn(`[Rate Limit] Hit 429 error on saveDP. Retry ${retryCount + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);

              await sleep(delay);
              retryCount++;
              continue;
            }

            const errorData = await publicResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed: ${publicResponse.statusText}`);
          }

          break; // Success, exit the retry loop
        }

        response = await publicResponse.json();
      } else {
        if (await this.getDPById(dp.id)) {
          // Update existing family (authenticated)
          response = await makeAuthenticatedRequest(`/families/${dp.id}`, {
            method: 'PUT',
            body: JSON.stringify(familyRecord)
          });
        } else {
          // Create new family (authenticated)
          response = await makeAuthenticatedRequest('/families', {
            method: 'POST',
            body: JSON.stringify(familyRecord)
          });
        }
      }

      // Save/update individuals
      // Filter out duplicates (head of family shouldn't be in individuals)
      const validMembers = dp.members?.filter(member =>
        member.name !== dp.headOfFamily &&
        member.nationalId !== dp.nationalId
      ) || [];

      for (const member of validMembers) {
        const individualRecord = {
          family_id: dp.id,
          name: member.name,
          national_id: member.nationalId || '',
          gender: member.gender,
          date_of_birth: member.dateOfBirth,
          age: member.age,
          relation: member.relation,
          education_level: member.educationLevel || 'none',
          occupation: member.occupation || '',
          phone_number: member.phoneNumber || '',
          marital_status: member.maritalStatus,
          disability_type: member.disabilityType,
          disability_details: member.disabilityDetails || '',
          chronic_disease_type: member.chronicDiseaseType,
          chronic_disease_details: member.chronicDiseaseDetails || '',
          has_war_injury: member.hasWarInjury,
          war_injury_type: member.warInjuryType,
          war_injury_details: member.warInjuryDetails || '',
          medical_followup_required: member.medicalFollowupRequired,
          medical_followup_frequency: member.medicalFollowupFrequency || '',
        };

        // Check if individual exists and update or create
        // This would require additional API endpoints in the backend
        // For now, we'll just log that this needs to be implemented
        console.log('Individual update/create needs to be implemented in the backend API');
      }

      // Log the action
      await this.logAction(userId, 'SAVE_DP', `ID: ${dp.id}`);

      return dp;
    } catch (error) {
      console.error('Error saving DP:', error);
      throw error;
    }
  },

  async getCamps(isPublicRegistration: boolean = false): Promise<Camp[]> {
    await delay(); // Simulate network delay
    try {
      let campRecords;

      if (isPublicRegistration) {
        // For public registration, use the public endpoint that doesn't require auth
        // Implement retry logic for 429 errors
        let response;
        let retryCount = 0;

        while (retryCount <= MAX_RETRIES) {
          response = await fetch(`${BACKEND_API_URL}/public/camps`);

          if (!response.ok) {
            // Handle 429 Too Many Requests with retry logic
            if (response.status === 429 && retryCount < MAX_RETRIES) {
              const retryAfter = response.headers.get('Retry-After') || response.headers.get('RateLimit-Reset');
              const delay = calculateRetryDelay(retryCount, retryAfter);

              console.warn(`[Rate Limit] Hit 429 error on getCamps. Retry ${retryCount + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);

              await sleep(delay);
              retryCount++;
              continue;
            }

            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed: ${response.statusText}`);
          }

          break; // Success, exit the retry loop
        }

        campRecords = await response.json();
      } else {
        campRecords = await makeAuthenticatedRequest('/camps');
      }

      return campRecords.map((record: any) => ({
        id: record.id,
        name: record.name,
        location: {
          lat: parseFloat(record.location_lat?.toString() || '0'),
          lng: parseFloat(record.location_lng?.toString() || '0'),
          address: record.location_address || '',
          governorate: record.location_governorate || 'خان يونس',
          area: record.location_area || 'عبسان الكبيرة',
        },
        managerName: record.manager_name,
        status: record.status as any,
      }));
    } catch (error: any) {
      console.error('Error fetching camps:', error);
      // Attempt to log more specific details from the error object
      if (error instanceof TypeError) {
        console.error('TypeError details:', {
          message: error.message,
          stack: error.stack,
        });
      } else if (error.message) {
        console.error('Error message:', error.message);
      } else {
        // Fallback for generic errors or objects without messages
        console.error('Generic error details:', JSON.stringify(error, null, 2));
      }
      return []; // Return empty array on error as per current logic
    }
  },

  async updateCamp(camp: Camp, userId?: string, isPublicRegistration: boolean = false) {
    await delay(); // Simulate network delay
    try {
      const campRecord = {
        id: camp.id,
        name: camp.name,
        location_lat: camp.location.lat,
        location_lng: camp.location.lng,
        location_address: camp.location.address,
        location_governorate: camp.location.governorate,
        location_area: camp.location.area,
        manager_name: camp.managerName,
        status: camp.status,
      };

      if (isPublicRegistration) {
        // For public registration, use the public endpoint that doesn't require auth
        const response = await fetch(`${BACKEND_API_URL}/public/camps/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campRecord)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to register camp');
        }
      } else {
        if (await this.getCampById(camp.id)) {
          // Update existing camp
          await makeAuthenticatedRequest(`/camps/${camp.id}`, {
            method: 'PUT',
            body: JSON.stringify(campRecord)
          });
        } else {
          // Create new camp (requires authentication)
          await makeAuthenticatedRequest('/camps', {
            method: 'POST',
            body: JSON.stringify(campRecord)
          });
        }
      }

      await this.logAction(userId, 'UPDATE_CAMP', `ID: ${camp.id}`);
    } catch (error) {
      console.error('Error updating camp:', error);
      throw error;
    }
  },

  async getCampById(id: string): Promise<Camp | null> {
    await delay(); // Simulate network delay
    try {
      const record = await makeAuthenticatedRequest(`/camps/${id}`);
      if (!record) return null;

      return {
        id: record.id,
        name: record.name,
        location: {
          lat: parseFloat(record.location_lat?.toString() || '0'),
          lng: parseFloat(record.location_lng?.toString() || '0'),
          address: record.location_address || '',
          governorate: record.location_governorate || '',
          area: record.location_area || '',
        },
        managerName: record.manager_name,
        status: record.status as any,
      };
    } catch (error) {
      console.error('Error fetching camp by ID:', error);
      return null;
    }
  },

  async deleteCamp(id: string): Promise<void> {
    await delay(); // Simulate network delay
    try {
      await makeAuthenticatedRequest(`/camps/${id}`, {
        method: 'DELETE',
      });
      console.log(`[deleteCamp] Camp deleted successfully: ${id}`);
    } catch (error) {
      console.error('Error deleting camp:', error);
      throw error;
    }
  },

  async getInventory(campId: string, paginationParams?: { page?: number; limit?: number; searchQuery?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; filters?: Record<string, any> }): Promise<InventoryItem[]> {
    await delay(); // Simulate network delay
    try {
      // Build query parameters
      let url = '/inventory';
      const queryParams = new URLSearchParams();

      queryParams.append('campId', campId);

      if (paginationParams) {
        if (paginationParams.page) queryParams.append('page', paginationParams.page.toString());
        if (paginationParams.limit) queryParams.append('limit', paginationParams.limit.toString());
        if (paginationParams.searchQuery) queryParams.append('searchQuery', paginationParams.searchQuery);
        if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy);
        if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder);

        // Add filters
        if (paginationParams.filters) {
          Object.entries(paginationParams.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, Array.isArray(value) ? value.join(',') : String(value));
            }
          });
        }
      }

      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }

      const response = await makeAuthenticatedRequest(url);

      // The response should now include pagination metadata
      const { data: itemRecords, totalCount, currentPage, totalPages, hasNextPage, hasPrevPage } = response;

      // Filter items by camp (in a real implementation, inventory items would be linked to camps)
      // For now, we'll return all items
      return itemRecords.map((record: any) => ({
        id: record.id,
        campId: record.camp_id,
        name: record.name,
        category: record.category as any,
        unit: record.unit,
        quantityAvailable: record.quantity_available ? parseFloat(record.quantity_available.toString()) : 0,
        quantityReserved: record.quantity_reserved ? parseFloat(record.quantity_reserved.toString()) : 0,
        quantityAllocated: record.quantity_allocated ? parseFloat(record.quantity_allocated.toString()) : 0,
        minStock: record.min_stock ? parseFloat(record.min_stock.toString()) : 0,
        maxStock: record.max_stock ? parseFloat(record.max_stock.toString()) : 0,
        minAlertThreshold: record.min_alert_threshold ? parseFloat(record.min_alert_threshold.toString()) : 0,
        expiryDate: record.expiry_date || undefined,
        donor: record.donor || undefined,
        receivedDate: record.received_date || undefined,
        notes: record.notes || undefined,
        isActive: record.is_active !== undefined ? record.is_active : true,
        isDeleted: record.is_deleted || false,
        deletedAt: record.deleted_at || undefined,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  },

  async saveInventoryItem(item: InventoryItem, campId: string, userId?: string) {
    await delay(); // Simulate network delay
    try {
      const itemRecord = {
        id: item.id,
        camp_id: campId,
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity_available: item.quantityAvailable || 0,
        quantity_reserved: item.quantityReserved || 0,
        quantity_allocated: item.quantityAllocated || 0,
        min_stock: item.minStock || 0,
        max_stock: item.maxStock || 0,
        min_alert_threshold: item.minAlertThreshold || 0,
        expiry_date: item.expiryDate || null,
        donor: item.donor || null,
        received_date: item.receivedDate || null,
        notes: item.notes || null,
        is_active: item.isActive !== undefined ? item.isActive : true,
        is_deleted: item.isDeleted || false,
        deleted_at: item.deletedAt || null,
      };

      if (await this.getInventoryItemById(item.id)) {
        // Update existing item
        await makeAuthenticatedRequest(`/inventory/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify(itemRecord)
        });
      } else {
        // Create new item
        await makeAuthenticatedRequest('/inventory', {
          method: 'POST',
          body: JSON.stringify(itemRecord)
        });
      }

      await this.logAction(userId, 'SAVE_INVENTORY_ITEM', `ID: ${item.id}, Camp: ${campId}`);
    } catch (error) {
      console.error('Error saving inventory item:', error);
      throw error;
    }
  },

  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    try {
      const record = await makeAuthenticatedRequest(`/inventory/${id}`);
      if (!record) return null;

      return {
        id: record.id,
        campId: record.camp_id,
        name: record.name,
        category: record.category as any,
        unit: record.unit,
        quantityAvailable: record.quantity_available ? parseFloat(record.quantity_available.toString()) : 0,
        quantityReserved: record.quantity_reserved ? parseFloat(record.quantity_reserved.toString()) : 0,
        quantityAllocated: record.quantity_allocated ? parseFloat(record.quantity_allocated.toString()) : 0,
        minStock: record.min_stock ? parseFloat(record.min_stock.toString()) : 0,
        maxStock: record.max_stock ? parseFloat(record.max_stock.toString()) : 0,
        minAlertThreshold: record.min_alert_threshold ? parseFloat(record.min_alert_threshold.toString()) : 0,
        expiryDate: record.expiry_date || undefined,
        donor: record.donor || undefined,
        receivedDate: record.received_date || undefined,
        notes: record.notes || undefined,
        isActive: record.is_active !== undefined ? record.is_active : true,
        isDeleted: record.is_deleted || false,
        deletedAt: record.deleted_at || undefined,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      };
    } catch (error) {
      console.error('Error fetching inventory item by ID:', error);
      return null;
    }
  },

  async getAidDistributions(): Promise<AidTransaction[]> {
    await delay(); // Simulate network delay
    try {
      const distributionRecords = await makeAuthenticatedRequest('/aid/distributions');

      return distributionRecords.map((record: any) => ({
        id: record.id,
        dpId: record.family_id,
        campaignId: record.campaign_id || undefined,
        aidType: record.aid_type,
        aidCategory: record.aid_category as any,
        quantity: record.quantity ? parseFloat(record.quantity.toString()) : 0,
        date: record.distribution_date,
        distributedBy: record.distributed_by_user_id,
        notes: record.notes || undefined,
        receivedBySignature: record.received_by_signature || undefined,
        receivedByBiometric: record.received_by_biometric || undefined,
        receivedByPhoto: record.received_by_photo_url || undefined,
        otpCode: record.otp_code || undefined,
        duplicateCheckPassed: record.duplicate_check_passed ?? true,
        status: record.status as any,
      }));
    } catch (error) {
      console.error('Error fetching aid distributions:', error);
      return [];
    }
  },

  async createAidDistribution(distribution: Omit<AidTransaction, 'id' | 'date'>, userId?: string): Promise<AidTransaction> {
    await delay(); // Simulate network delay
    try {
      const distributionData = {
        family_id: distribution.dpId,
        campaign_id: distribution.campaignId || null,
        aid_type: distribution.aidType,
        aid_category: distribution.aidCategory,
        quantity: distribution.quantity,
        distribution_date: new Date().toISOString().split('T')[0],
        distributed_by_user_id: distribution.distributedBy,
        notes: distribution.notes || '',
        received_by_signature: distribution.receivedBySignature || null,
        received_by_biometric: distribution.receivedByBiometric || null,
        received_by_photo_url: distribution.receivedByPhoto || null,
        otp_code: distribution.otpCode || null,
        duplicate_check_passed: distribution.duplicateCheckPassed ?? true,
        status: distribution.status,
      };

      const newDistribution = await makeAuthenticatedRequest('/aid/distributions', {
        method: 'POST',
        body: JSON.stringify(distributionData)
      });

      await this.logAction(userId, 'CREATE_DISTRIBUTION', `ID: ${newDistribution.id}`);

      return {
        id: newDistribution.id,
        dpId: newDistribution.family_id,
        campaignId: newDistribution.campaign_id || undefined,
        aidType: newDistribution.aid_type,
        aidCategory: newDistribution.aid_category as any,
        quantity: newDistribution.quantity ? parseFloat(newDistribution.quantity.toString()) : 0,
        date: newDistribution.distribution_date,
        distributedBy: newDistribution.distributed_by_user_id,
        notes: newDistribution.notes || undefined,
        receivedBySignature: newDistribution.received_by_signature || undefined,
        receivedByBiometric: newDistribution.received_by_biometric || undefined,
        receivedByPhoto: newDistribution.received_by_photo_url || undefined,
        otpCode: newDistribution.otp_code || undefined,
        duplicateCheckPassed: newDistribution.duplicate_check_passed ?? true,
        status: newDistribution.status as any,
      };
    } catch (error) {
      console.error('Error creating aid distribution:', error);
      throw error;
    }
  },

  // Aid Types Management
  async getAidTypes(): Promise<any[]> {
    const response = await makeAuthenticatedRequest('/aid/types');
    return response || [];
  },

  async createAidType(aidType: {
    name: string;
    nameAr: string;
    category: string;
    unit: string;
    unitAr: string;
    description?: string;
    isActive?: boolean;
  }): Promise<any> {
    return await makeAuthenticatedRequest('/aid/types', {
      method: 'POST',
      body: JSON.stringify({
        name: aidType.name,
        category: aidType.category,
        unit: aidType.unit,
        description: aidType.description,
        is_active: aidType.isActive !== undefined ? aidType.isActive : true
      })
    });
  },

  async updateAidType(id: string, updates: {
    name?: string;
    category?: string;
    unit?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<any> {
    return await makeAuthenticatedRequest(`/aid/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        category: updates.category,
        unit: updates.unit,
        description: updates.description,
        is_active: updates.isActive
      })
    });
  },

  async deleteAidType(id: string): Promise<void> {
    await makeAuthenticatedRequest(`/aid/types/${id}`, { method: 'DELETE' });
  },

  async toggleAidTypeStatus(id: string, isActive: boolean): Promise<any> {
    return await makeAuthenticatedRequest(`/aid/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  // Inventory Items Management
  async getInventoryItems(includeReferencedDeleted = false, cacheBustTimestamp?: number): Promise<any[]> {
    console.log('=== GET INVENTORY ITEMS (SERVICE) ===');
    const cacheParam = cacheBustTimestamp ? `&_t=${cacheBustTimestamp}` : '';
    const response = await makeAuthenticatedRequest(`/inventory?includeReferencedDeleted=${includeReferencedDeleted}${cacheParam}`);
    console.log('Inventory response:', response);
    return response || [];
  },

  async createInventoryItem(item: {
    name: string;
    category: string;
    unit: string;
    minStock?: number;
    maxStock?: number;
    minAlertThreshold?: number;
    quantityReserved?: number;
    expiryDate?: string;
    donor?: string;
    receivedDate?: string;
    notes?: string;
    isActive?: boolean;
  }): Promise<any> {
    return await makeAuthenticatedRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        unit: item.unit,
        min_stock: item.minStock || 0,
        max_stock: item.maxStock || 0,
        min_alert_threshold: item.minAlertThreshold || 0,
        quantity_reserved: item.quantityReserved || 0,
        expiry_date: item.expiryDate,
        donor: item.donor,
        received_date: item.receivedDate,
        notes: item.notes,
        is_active: item.isActive !== undefined ? item.isActive : true
      })
    });
  },

  async updateInventoryItem(id: string, updates: {
    name?: string;
    category?: string;
    unit?: string;
    minStock?: number;
    maxStock?: number;
    minAlertThreshold?: number;
    quantityReserved?: number;
    expiryDate?: string;
    donor?: string;
    receivedDate?: string;
    notes?: string;
    isActive?: boolean;
  }): Promise<any> {
    return await makeAuthenticatedRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        category: updates.category,
        unit: updates.unit,
        min_stock: updates.minStock,
        max_stock: updates.maxStock,
        min_alert_threshold: updates.minAlertThreshold,
        quantity_reserved: updates.quantityReserved,
        expiry_date: updates.expiryDate,
        donor: updates.donor,
        received_date: updates.receivedDate,
        notes: updates.notes,
        is_active: updates.isActive
      })
    });
  },

  async deleteInventoryItem(id: string): Promise<void> {
    await makeAuthenticatedRequest(`/inventory/${id}`, { method: 'DELETE' });
  },

  async toggleInventoryItemStatus(id: string, isActive: boolean): Promise<any> {
    return await makeAuthenticatedRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  // Aid Campaigns Management
  async getAidCampaigns(includeDeleted = false): Promise<any[]> {
    const response = await makeAuthenticatedRequest(`/aid/campaigns?includeDeleted=${includeDeleted}`);
    return response || [];
  },

  async createAidCampaign(campaign: {
    name: string;
    aidType: string;
    aidCategory: string;
    startDate: string;
    endDate?: string;
    description?: string;
    notes?: string;
    targetFamilies?: string[];
    inventoryItemId?: string;
  }): Promise<any> {
    return await makeAuthenticatedRequest('/aid/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign)
    });
  },

  async updateAidCampaign(id: string, updates: {
    name?: string;
    aidType?: string;
    aidCategory?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    notes?: string;
    status?: string;
    targetFamilies?: string[];
    distributedTo?: string[];
    inventoryItemId?: string;
  }): Promise<any> {
    return await makeAuthenticatedRequest(`/aid/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteAidCampaign(id: string): Promise<void> {
    await makeAuthenticatedRequest(`/aid/campaigns/${id}`, { method: 'DELETE' });
  },

  // Inventory Ledger/Transactions Management
  async getInventoryTransactions(filters?: {
    itemId?: string;
    transactionType?: 'in' | 'out';
    relatedTo?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.itemId) params.append('itemId', filters.itemId);
    if (filters?.transactionType) params.append('transactionType', filters.transactionType);
    if (filters?.relatedTo) params.append('relatedTo', filters.relatedTo);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const response = await makeAuthenticatedRequest(`/inventory/transactions${queryString ? `?${queryString}` : ''}`);
    return response || [];
  },

  async createInventoryTransaction(transaction: {
    itemId: string;
    transactionType: 'in' | 'out';
    quantity: number;
    relatedTo: 'purchase' | 'donation' | 'distribution' | 'transfer' | 'adjustment' | 'damage';
    relatedId?: string;
    notes?: string;
  }): Promise<any> {
    return await makeAuthenticatedRequest('/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  },

  // Distribution Management
  async getDistributions(): Promise<any[]> {
    const response = await makeAuthenticatedRequest('/aid/distributions');
    return response || [];
  },

  async getDistributionsByCamp(campId: string): Promise<any[]> {
    const response = await makeAuthenticatedRequest(`/aid/distributions/camp/${campId}`);
    return response || [];
  },

  async getDistributionsByFamily(familyId: string): Promise<any[]> {
    const response = await makeAuthenticatedRequest(`/aid/distributions/family/${familyId}`);
    return response || [];
  },

  async getDistributionsByCampaign(campaignId: string): Promise<any[]> {
    const response = await makeAuthenticatedRequest(`/aid/distributions/campaign/${campaignId}`);
    return response || [];
  },

  async getDistributionById(id: string): Promise<any> {
    const response = await makeAuthenticatedRequest(`/aid/distributions/${id}`);
    return response || null;
  },

  async createDistribution(distribution: {
    family_id: string;
    campaign_id: string;
    aid_type: string;
    aid_category: string; // Must be: 'غذائية' | 'غير غذائية' | 'طبية' | 'نقدية' | 'مأوى' | 'مائية' | 'أخرى'
    quantity: number;
    distribution_date: string;
    notes?: string | null;
    otp_code?: string | null;
    received_by_signature?: boolean;
    status?: string; // Must be: 'تم التسليم' | 'قيد الانتظار'
  }): Promise<any> {
    return await makeAuthenticatedRequest('/aid/distributions', {
      method: 'POST',
      body: JSON.stringify({
        family_id: distribution.family_id,
        campaign_id: distribution.campaign_id,
        aid_type: distribution.aid_type,
        aid_category: distribution.aid_category,
        quantity: distribution.quantity,
        distribution_date: distribution.distribution_date,
        notes: distribution.notes,
        otp_code: distribution.otp_code,
        received_by_signature: distribution.received_by_signature,
        status: distribution.status || 'تم التسليم'
      })
    });
  },

  async updateDistribution(id: string, distribution: {
    family_id?: string;
    campaign_id?: string;
    aid_type?: string;
    aid_category?: string;
    quantity?: number;
    distribution_date?: string;
    notes?: string | null;
    otp_code?: string | null;
    received_by_signature?: boolean;
    status?: string;
  }): Promise<any> {
    return await makeAuthenticatedRequest(`/aid/distributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        family_id: distribution.family_id,
        campaign_id: distribution.campaign_id,
        aid_type: distribution.aid_type,
        aid_category: distribution.aid_category,
        quantity: distribution.quantity,
        distribution_date: distribution.distribution_date,
        notes: distribution.notes,
        otp_code: distribution.otp_code,
        received_by_signature: distribution.received_by_signature,
        status: distribution.status
      })
    });
  },

  async cancelDistribution(distributionId: string): Promise<void> {
    // Hard delete the distribution record
    await makeAuthenticatedRequest(`/aid/distributions/${distributionId}`, {
      method: 'DELETE'
    });
  },

  // Transfer Requests Management
  async getTransferRequests(campId: string, type: 'incoming' | 'outgoing' | 'all' = 'all'): Promise<any[]> {
    const params = new URLSearchParams();
    if (campId) params.append('campId', campId);
    if (type !== 'all') params.append('type', type);

    const queryString = params.toString();
    const response = await makeAuthenticatedRequest(`/transfers${queryString ? `?${queryString}` : ''}`);
    return response || [];
  },

  async createTransferRequest(request: {
    dpId: string;
    fromCampId: string;
    toCampId: string;
    reason: string;
    additionalNotes?: string;
  }): Promise<any> {
    return await makeAuthenticatedRequest('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        dp_id: request.dpId,
        from_camp_id: request.fromCampId,
        to_camp_id: request.toCampId,
        reason: request.reason,
        additional_notes: request.additionalNotes
      })
    });
  },

  async approveTransferRequest(requestId: string, notes?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/transfers/${requestId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
  },

  async rejectTransferRequest(requestId: string, reason: string, notes?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/transfers/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason, notes })
    });
  },

  async getTransferRequestById(requestId: string): Promise<any> {
    return await makeAuthenticatedRequest(`/transfers/${requestId}`);
  },

  // Global family statistics (SYSTEM_ADMIN only)
  async getGlobalFamilyStats(): Promise<{
    totalFamilies: number;
    totalMembers: number;
    byStatus: { 'قيد الانتظار': number; 'موافق': number; 'مرفوض': number };
    byVulnerability: { 'عالي جداً': number; 'عالي': number; 'متوسط': number; 'منخفض': number };
    byCamp: Array<{ campId: string; campName: string; familyCount: number }>;
    avgFamilySize: number;
  }> {
    return await makeAuthenticatedRequest('/families/stats/global');
  },

  // Per-camp family statistics (SYSTEM_ADMIN only)
  async getCampFamilyStats(campId: string): Promise<{
    campId: string;
    campName: string;
    totalFamilies: number;
    totalMembers: number;
    byStatus: { 'قيد الانتظار': number; 'موافق': number; 'مرفوض': number };
    byVulnerability: { 'عالي جداً': number; 'عالي': number; 'متوسط': number; 'منخفض': number };
    avgFamilySize: number;
  }> {
    return await makeAuthenticatedRequest(`/families/camp/${campId}/stats`);
  },

  // Transfer family to another camp (SYSTEM_ADMIN only)
  async transferFamily(familyId: string, targetCampId: string, reason: string, adminNotes?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${familyId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ targetCampId, reason, adminNotes })
    });
  },

  // Override family decision (SYSTEM_ADMIN only)
  async overrideFamilyDecision(familyId: string, newStatus: 'قيد الانتظار' | 'موافق' | 'مرفوض', reason: string, adminNotes?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${familyId}/override-decision`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, reason, adminNotes })
    });
  },

  // =====================
  // Soft Delete Methods
  // =====================

  /**
   * Get soft-deleted families (SYSTEM_ADMIN only)
   */
  async getDeletedFamilies(): Promise<any[]> {
    const response = await makeAuthenticatedRequest('/families?includeDeleted=true');
    return (response || []).filter((f: any) => f.is_deleted === true);
  },

  /**
   * Get soft-deleted individuals for a specific family (SYSTEM_ADMIN only)
   */
  async getDeletedIndividuals(familyId: string): Promise<any[]> {
    const response = await makeAuthenticatedRequest(`/individuals?familyId=${familyId}&includeDeleted=true`);
    return (response || []).filter((ind: any) => ind.is_deleted === true);
  },

  /**
   * Get soft-deleted inventory items (SYSTEM_ADMIN only)
   */
  async getDeletedInventoryItems(): Promise<any[]> {
    const response = await makeAuthenticatedRequest('/inventory?includeDeleted=true');
    return (response || []).filter((item: any) => item.is_deleted === true);
  },

  /**
   * Get soft-deleted aid types (SYSTEM_ADMIN only)
   */
  async getDeletedAidTypes(): Promise<any[]> {
    const response = await makeAuthenticatedRequest('/aid/types?includeDeleted=true');
    return (response || []).filter((type: any) => type.is_deleted === true);
  },

  /**
   * Restore a soft-deleted family
   */
  async restoreFamily(id: string, reason: string): Promise<any> {
    return await makeAuthenticatedRequest('/soft-deletes/restore', {
      method: 'POST',
      body: JSON.stringify({
        table_name: 'families',
        record_id: id,
        reason: reason
      })
    });
  },

  /**
   * Restore a soft-deleted individual
   */
  async restoreIndividual(id: string, reason: string): Promise<any> {
    return await makeAuthenticatedRequest('/soft-deletes/restore', {
      method: 'POST',
      body: JSON.stringify({
        table_name: 'individuals',
        record_id: id,
        reason: reason
      })
    });
  },

  /**
   * Restore a soft-deleted inventory item
   */
  async restoreInventoryItem(id: string, reason: string): Promise<any> {
    return await makeAuthenticatedRequest('/soft-deletes/restore', {
      method: 'POST',
      body: JSON.stringify({
        table_name: 'inventory_items',
        record_id: id,
        reason: reason
      })
    });
  },

  /**
   * Restore a soft-deleted aid type
   */
  async restoreAidType(id: string, reason: string): Promise<any> {
    return await makeAuthenticatedRequest('/soft-deletes/restore', {
      method: 'POST',
      body: JSON.stringify({
        table_name: 'aid_types',
        record_id: id,
        reason: reason
      })
    });
  },

  /**
   * Get soft_deletes records (SYSTEM_ADMIN only)
   * @param tableName - Optional filter by table name
   */
  async getSoftDeletes(tableName?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (tableName) {
      params.append('table_name', tableName);
    }
    const queryString = params.toString();
    const response = await makeAuthenticatedRequest(`/soft-deletes${queryString ? `?${queryString}` : ''}`);
    return response || [];
  },

  // =====================
  // Complaints and Emergency Reports Soft Delete Methods
  // =====================

  /**
   * Get soft-deleted complaints (SYSTEM_ADMIN only)
   */
  async getDeletedComplaints(campId?: string): Promise<any[]> {
    let url = '/staff/complaints?includeDeleted=true';
    if (campId) {
      url += `&campId=${campId}`;
    }
    const response = await makeAuthenticatedRequest(url);
    return (response || []).filter((c: any) => c.deleted === true);
  },

  /**
   * Get soft-deleted emergency reports (SYSTEM_ADMIN only)
   */
  async getDeletedEmergencyReports(campId?: string): Promise<any[]> {
    let url = '/staff/emergency-reports?includeDeleted=true';
    if (campId) {
      url += `&campId=${campId}`;
    }
    const response = await makeAuthenticatedRequest(url);
    return (response || []).filter((r: any) => r.deleted === true);
  },

  /**
   * Restore a soft-deleted complaint
   */
  async restoreComplaint(id: string, reason: string): Promise<any> {
    return await makeAuthenticatedRequest(`/staff/complaints/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  /**
   * Restore a soft-deleted emergency report
   */
  async restoreEmergencyReport(id: string, reason: string): Promise<any> {
    return await makeAuthenticatedRequest(`/staff/emergency-reports/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // ============================================================================
  // FIELD PERMISSIONS
  // ============================================================================

  /**
   * Get field permissions for a family
   */
  async getFieldPermissions(familyId: string): Promise<FieldPermission[]> {
    return await makeAuthenticatedRequest(`/families/${familyId}/field-permissions`);
  },

  /**
   * Update a single field permission
   */
  async updateFieldPermission(familyId: string, fieldName: string, isEditable: boolean): Promise<FieldPermission> {
    return await makeAuthenticatedRequest(`/families/${familyId}/field-permissions`, {
      method: 'PUT',
      body: JSON.stringify({ field_name: fieldName, is_editable: isEditable })
    });
  },

  /**
   * Bulk update multiple field permissions
   */
  async bulkUpdateFieldPermissions(familyId: string, permissions: { field: string; editable: boolean }[]): Promise<any> {
    return await makeAuthenticatedRequest(`/families/${familyId}/field-permissions/bulk`, {
      method: 'POST',
      body: JSON.stringify({
        permissions: permissions.map(p => ({ field_name: p.field, is_editable: p.editable }))
      })
    });
  },

  // ============================================================================
  // SPECIAL ASSISTANCE REQUESTS
  // ============================================================================

  /**
   * Get special assistance requests for a camp
   */
  async getSpecialAssistanceRequests(campId: string): Promise<any[]> {
    return await makeAuthenticatedRequest(`/staff/special-assistance?campId=${campId}`);
  },

  /**
   * Update a special assistance request (approve/reject/execute)
   */
  async updateSpecialAssistanceRequest(id: string, updates: {
    status: 'جديد' | 'قيد المراجعة' | 'تمت الموافقة' | 'مرفوض' | 'تم التنفيذ';
    response?: string;
    responded_by?: string;
    responded_at?: string;
  }): Promise<any> {
    return await makeAuthenticatedRequest(`/staff/special-assistance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Delete a special assistance request (soft delete)
   */
  async deleteSpecialAssistanceRequest(id: string): Promise<any> {
    return await makeAuthenticatedRequest(`/staff/special-assistance/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Restore a deleted special assistance request
   */
  async restoreSpecialAssistanceRequest(id: string, reason?: string): Promise<any> {
    return await makeAuthenticatedRequest(`/staff/special-assistance/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  exportTo(data: any[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => {
      if (typeof val === 'object') return JSON.stringify(val);
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','));
    const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};