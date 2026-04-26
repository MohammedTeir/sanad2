import { makeAuthenticatedRequest, makePublicRequest } from '../utils/apiUtils';
import { Camp, DPProfile, InventoryItem, TransferRequest, AidTransaction, AidCampaign, Role } from '../types';
import { auditService } from './auditService';

// Vulnerability scores are automatically calculated by database triggers on INSERT/UPDATE

const delay = (ms: number = 300) => new Promise(res => setTimeout(res, ms));

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
    }
  },

  async authenticateUser(email: string, password: string, role: Role) {
    try {
      // Call the backend API to authenticate the user and receive a real JWT
      const { token, user } = await makePublicRequest<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      
      // Store the real JWT token in localStorage
      localStorage.setItem('auth_token', token);

      // Return user information
      return {
        id: user.id,
        role: user.role as Role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: true, // Assuming active since authentication succeeded
        lastLogin: new Date().toISOString(),
        campId: undefined, // Will be populated after login if needed
        familyId: undefined // Will be populated after login if needed
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  async logAction(userId: string, action: string, details: string) {
    try {
      await auditService.logOperation({
        userId,
        operationType: action.split('_')[0].toLowerCase() as any,
        resourceType: action.includes('DP') ? 'family' : action.includes('CAMPAIGN') ? 'campaign' : 'general',
        resourceId: details.includes('ID:') ? details.split('ID:')[1].trim() : 'unknown',
        newValue: { details },
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  },

  async getDPs(campId?: string): Promise<DPProfile[]> {
    await delay(); // Simulate network delay
    try {
      // Use the backend API with JWT authentication
      const url = campId
        ? `/families?campId=${campId}`
        : '/families';

      const familyRecords = await makeAuthenticatedRequest(url);

      const dps: DPProfile[] = [];

      for (const familyRecord of familyRecords) {
        // Get individuals for this family from the backend API
        const individualRecords = await makeAuthenticatedRequest(
          `/individuals?familyId=${familyRecord.id}`
        );

        const dp: DPProfile = {
          id: familyRecord.id,
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
          phoneNumber: familyRecord.head_of_family_phone_number,
          phoneSecondary: familyRecord.head_of_family_phone_secondary || undefined,
          disabilityType: familyRecord.head_of_family_disability_type as any,
          disabilityDetails: familyRecord.head_of_family_disability_details || undefined,
          chronicDiseaseType: familyRecord.head_of_family_chronic_disease_type as any,
          chronicDiseaseDetails: familyRecord.head_of_family_chronic_disease_details || undefined,
          warInjuryType: familyRecord.head_of_family_war_injury_type as any,
          warInjuryDetails: familyRecord.head_of_family_war_injury_details || undefined,
          medicalFollowupRequired: familyRecord.head_of_family_medical_followup_required,
          medicalFollowupFrequency: familyRecord.head_of_family_medical_followup_frequency || undefined,
          wifeName: familyRecord.wife_name || undefined,
          wifeNationalId: familyRecord.wife_national_id || undefined,
          wifeIsPregnant: familyRecord.wife_is_pregnant,
          wifePregnancyMonth: familyRecord.wife_pregnancy_month || undefined,
          wifeMedicalFollowupRequired: familyRecord.wife_medical_followup_required || false,
          wifeMedicalFollowupFrequency: familyRecord.wife_medical_followup_frequency || undefined,
          members: individualRecords.map((ind: any) => ({
            id: ind.id,
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
            medicalFollowupRequired: ind.medical_followup_required,
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
            country: familyRecord.current_housing_country || undefined,
          },
          // ⚠️  DISABLED: Vulnerability score system
          vulnerabilityScore: 0, // familyRecord.vulnerability_score ? parseFloat(familyRecord.vulnerability_score.toString()) : 0,
          vulnerabilityPriority: null as any, // familyRecord.vulnerability_priority as any,
          vulnerabilityBreakdown: null as any, // familyRecord.vulnerability_breakdown as any,
          vulnerabilityReason: familyRecord.vulnerability_reason || undefined,
          nominationBody: familyRecord.nomination_body || undefined,
          adminNotes: familyRecord.admin_notes || undefined,
          aidHistory: [], // Would need to fetch from backend API
          registeredDate: familyRecord.registered_date,
          lastUpdated: familyRecord.last_updated,
        };

        dps.push(dp);
      }

      // ⚠️  DISABLED: Sort by vulnerability score descending
      // return dps.sort((a, b) => (b.vulnerabilityScore || 0) - (a.vulnerabilityScore || 0));
      return dps;
    } catch (error) {
      console.warn('Warning: Error fetching DPs from backend API, returning empty array:', error);
      // Return empty array instead of throwing, allowing graceful degradation
      return [];
    }
  },

  async getDPById(id: string): Promise<DPProfile | null> {
    await delay(); // Simulate network delay
    try {
      const familyRecord = await makeAuthenticatedRequest(`/families/${id}`);
      if (!familyRecord) return null;

      // Get individuals for this family
      const individualRecords = await makeAuthenticatedRequest(
        `/individuals?familyId=${familyRecord.id}`
      );

      // Get aid history for this family - use correct endpoint
      let aidDistributions = [];
      try {
        aidDistributions = await makeAuthenticatedRequest(
          `/aid/distributions/family/${familyRecord.id}`
        );
      } catch (aidError) {
        console.log('[getDPById JWT] Could not fetch aid distributions, using empty array:', aidError);
      }

      const dp: DPProfile = {
        id: familyRecord.id,
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
        phoneNumber: familyRecord.head_of_family_phone_number,
        phoneSecondary: familyRecord.head_of_family_phone_secondary || undefined,
        disabilityType: familyRecord.head_of_family_disability_type as any,
        disabilityDetails: familyRecord.head_of_family_disability_details || undefined,
        chronicDiseaseType: familyRecord.head_of_family_chronic_disease_type as any,
        chronicDiseaseDetails: familyRecord.head_of_family_chronic_disease_details || undefined,
        warInjuryType: familyRecord.head_of_family_war_injury_type as any,
        warInjuryDetails: familyRecord.head_of_family_war_injury_details || undefined,
        medicalFollowupRequired: familyRecord.head_of_family_medical_followup_required,
        medicalFollowupFrequency: familyRecord.head_of_family_medical_followup_frequency || undefined,
        wifeName: familyRecord.wife_name || undefined,
        wifeNationalId: familyRecord.wife_national_id || undefined,
        wifeIsPregnant: familyRecord.wife_is_pregnant,
        wifePregnancyMonth: familyRecord.wife_pregnancy_month || undefined,
        wifeMedicalFollowupRequired: familyRecord.wife_medical_followup_required || false,
        wifeMedicalFollowupFrequency: familyRecord.wife_medical_followup_frequency || undefined,
        members: individualRecords.map((ind: any) => ({
          id: ind.id,
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
          medicalFollowupRequired: ind.medical_followup_required,
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
          governorate: familyRecord.current_housing_governorate,
          region: familyRecord.current_housing_region,
        },
        // ⚠️  DISABLED: Vulnerability score system
        vulnerabilityScore: 0, // familyRecord.vulnerability_score ? parseFloat(familyRecord.vulnerability_score.toString()) : 0,
        vulnerabilityPriority: null as any, // familyRecord.vulnerability_priority as any,
        vulnerabilityBreakdown: null as any, // familyRecord.vulnerability_breakdown as any,
        vulnerabilityReason: familyRecord.vulnerability_reason || undefined,
        nominationBody: familyRecord.nomination_body || undefined,
        adminNotes: familyRecord.admin_notes || undefined,
        aidHistory: aidDistributions.map((dist: any) => ({
          id: dist.id,
          dpId: dist.family_id,
          aidType: dist.aid_type,
          aidCategory: dist.aid_category as any,
          quantity: dist.quantity ? parseFloat(dist.quantity.toString()) : 0,
          date: dist.distribution_date,
          distributedBy: dist.distributed_by_user_id,
          notes: dist.notes || undefined,
          campaignId: dist.campaign_id || undefined,
          receivedBySignature: dist.received_by_signature || undefined,
          receivedByBiometric: dist.received_by_biometric || undefined,
          receivedByPhoto: dist.received_by_photo_url || undefined,
          otpCode: dist.otp_code || undefined,
          duplicateCheckPassed: dist.duplicate_check_passed ?? true,
          status: dist.status as any,
        })),
        registeredDate: familyRecord.registered_date,
        lastUpdated: familyRecord.last_updated,
      };

      return dp;
    } catch (error) {
      console.error('Error fetching DP by ID:', error);
      return null;
    }
  },

  // Additional methods would follow the same pattern...
};