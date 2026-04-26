import { supabaseService } from './supabase';
import { Camp, DPProfile, InventoryItem, TransferRequest, AidTransaction, AidCampaign, Role } from '../types';
import { auditService } from './auditService';
import { makePublicRequest } from '../utils/apiUtils';

// Vulnerability scores are automatically calculated by database triggers on INSERT/UPDATE

const delay = (ms: number = 300) => new Promise(res => setTimeout(res, ms));

export const realDataService = {
  async init() {
    // Initialization for real data service - verify connection to remote DB
    try {
      // Attempt to connect to the database by fetching a small amount of data
      await supabaseService.getCamps();
      console.log('Connected to real database successfully');
    } catch (error) {
      console.warn('Warning: Could not connect to real database. Using fallback mode.', error);
      // Don't throw error - allow the app to continue with fallback behavior
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

  async logAction(userId: string | undefined, action: string, details: string) {
    try {
      await auditService.logOperation({
        userId,
        operationType: action.split('_')[0].toLowerCase() as any,
        resourceType: action.includes('DP') ? 'family' : action.includes('CAMPAIGN') ? 'campaign' : 'general',
        resourceId: details.includes('ID:') ? details.split('ID:')[1].trim() : 'unknown',
        newValue: { details },
        ipAddress: 'unknown',
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  },

  async getDPs(campId?: string): Promise<DPProfile[]> {
    await delay(); // Simulate network delay
    try {
      const familyRecords = campId 
        ? await supabaseService.getFamilies(campId)
        : await supabaseService.getFamilies();
      
      const dps: DPProfile[] = [];
      
      for (const familyRecord of familyRecords) {
        // Get individuals for this family
        const individualRecords = await supabaseService.getIndividualsByFamilyId(familyRecord.id);

        const dp: DPProfile = {
          id: familyRecord.id,
          headOfFamily: familyRecord.head_of_family_name,
          headFirstName: familyRecord.head_of_family_first_name || '',
          headFatherName: familyRecord.head_of_family_father_name || '',
          headGrandfatherName: familyRecord.head_of_family_grandfather_name || '',
          headFamilyName: familyRecord.head_of_family_family_name || '',
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
          medicalFollowupFrequency: familyRecord.head_of_family_medical_followup_frequency as any,
          wifeName: familyRecord.wife_name || undefined,
          wifeNationalId: familyRecord.wife_national_id || undefined,
          wifeIsPregnant: familyRecord.wife_is_pregnant,
          wifePregnancyMonth: familyRecord.wife_pregnancy_month || undefined,
          wifeMedicalFollowupRequired: familyRecord.wife_medical_followup_required || false,
          wifeMedicalFollowupFrequency: familyRecord.wife_medical_followup_frequency as any,
          members: individualRecords.map(ind => ({
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
            medicalFollowupRequired: ind.medical_followup_required,
            medicalFollowupFrequency: ind.medical_followup_frequency as any,
          })),
          totalMembersCount: familyRecord.total_members_count,
          maleCount: familyRecord.male_count,
          femaleCount: familyRecord.female_count,
          childCount: familyRecord.child_count,
          teenagerCount: familyRecord.teenager_count,
          adultCount: familyRecord.adult_count,
          seniorCount: familyRecord.senior_count,
          disabledCount: familyRecord.disabled_count,
          chronicCount: familyRecord.head_of_family_chronic_disease_type !== 'لا يوجد' ? 1 : 0, // Corrected property name
          injuredCount: familyRecord.injured_count,
          medicalFollowupCount: familyRecord.head_of_family_medical_followup_required ? 1 : 0, // Simplified
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
            sanitaryFacilities: (familyRecord.current_housing_sanitary_facilities || familyRecord.current_housing_sanitary_conditions) as any,
            waterSource: familyRecord.current_housing_water_source as any,
            electricityAccess: familyRecord.current_housing_electricity_access as any,
            landmark: familyRecord.current_housing_landmark,
          },
          refugeeResidentAbroad: familyRecord.current_housing_country ? {
            country: familyRecord.current_housing_country,
          } : undefined,
          // ⚠️  DISABLED: Vulnerability score system
          vulnerabilityScore: 0, // familyRecord.vulnerability_score ? parseFloat(familyRecord.vulnerability_score.toString()) : 0,
          vulnerabilityPriority: null as any, // familyRecord.vulnerability_priority as any,
          vulnerabilityBreakdown: null as any, // familyRecord.vulnerability_breakdown as any,
          vulnerabilityReason: familyRecord.vulnerability_reason || undefined,
          nominationBody: familyRecord.nomination_body || undefined,
          adminNotes: familyRecord.admin_notes || undefined,
          aidHistory: [], // Would need to fetch from aid_distributions table
          registeredDate: familyRecord.registered_date,
          lastUpdated: familyRecord.last_updated,
        };
        
        dps.push(dp);
      }
      
      // ⚠️  DISABLED: Sort by vulnerability score descending
      // return dps.sort((a, b) => (b.vulnerabilityScore || 0) - (a.vulnerabilityScore || 0));
      return dps;
    } catch (error) {
      console.warn('Warning: Error fetching DPs from real database, returning empty array:', error);
      // Return empty array instead of throwing, allowing graceful degradation
      return [];
    }
  },

  async getDPById(id: string): Promise<DPProfile | null> {
    await delay(); // Simulate network delay
    try {
      const familyRecord = await supabaseService.getFamilyById(id);
      if (!familyRecord) return null;
      
      // Get individuals for this family
      const individualRecords = await supabaseService.getIndividualsByFamilyId(familyRecord.id);

      // Get aid history for this family
      const aidDistributions = await supabaseService.getAidDistributionsByFamilyId(familyRecord.id);

      const dp: DPProfile = {
        id: familyRecord.id,
        headOfFamily: familyRecord.head_of_family_name,
        headFirstName: familyRecord.head_of_family_first_name || '',
        headFatherName: familyRecord.head_of_family_father_name || '',
        headGrandfatherName: familyRecord.head_of_family_grandfather_name || '',
        headFamilyName: familyRecord.head_of_family_family_name || '',
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
        medicalFollowupFrequency: familyRecord.head_of_family_medical_followup_frequency as any,
        wifeName: familyRecord.wife_name || undefined,
        wifeNationalId: familyRecord.wife_national_id || undefined,
        wifeIsPregnant: familyRecord.wife_is_pregnant,
        wifePregnancyMonth: familyRecord.wife_pregnancy_month || undefined,
        wifeMedicalFollowupRequired: familyRecord.wife_medical_followup_required || false,
        wifeMedicalFollowupFrequency: familyRecord.wife_medical_followup_frequency as any,
        members: individualRecords.map(ind => ({
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
          medicalFollowupRequired: ind.medical_followup_required,
          medicalFollowupFrequency: ind.medical_followup_frequency as any,
        })),
        totalMembersCount: familyRecord.total_members_count,
        maleCount: familyRecord.male_count,
        femaleCount: familyRecord.female_count,
        childCount: familyRecord.child_count,
        teenagerCount: familyRecord.teenager_count,
        adultCount: familyRecord.adult_count,
        seniorCount: familyRecord.senior_count,
        disabledCount: familyRecord.disabled_count,
        chronicCount: familyRecord.head_of_family_chronic_disease_type !== 'لا يوجد' ? 1 : 0,
        injuredCount: familyRecord.injured_count,
        medicalFollowupCount: familyRecord.head_of_family_medical_followup_required ? 1 : 0,
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
          sanitaryFacilities: (familyRecord.current_housing_sanitary_facilities || familyRecord.current_housing_sanitary_conditions) as any,
          waterSource: familyRecord.current_housing_water_source as any,
          electricityAccess: familyRecord.current_housing_electricity_access as any,
          landmark: familyRecord.current_housing_landmark,
        },
        refugeeResidentAbroad: familyRecord.current_housing_country ? {
          country: familyRecord.current_housing_country,
        } : undefined,
        // ⚠️  DISABLED: Vulnerability score system
        vulnerabilityScore: 0, // familyRecord.vulnerability_score ? parseFloat(familyRecord.vulnerability_score.toString()) : 0,
        vulnerabilityPriority: null as any, // familyRecord.vulnerability_priority as any,
        vulnerabilityBreakdown: null as any, // familyRecord.vulnerability_breakdown as any,
        vulnerabilityReason: familyRecord.vulnerability_reason || undefined,
        nominationBody: familyRecord.nomination_body || undefined,
        adminNotes: familyRecord.admin_notes || undefined,
        aidHistory: aidDistributions.map(dist => ({
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

  async saveDP(dp: DPProfile, userId?: string) {
    await delay(); // Simulate network delay
    try {
      // ⚠️  DISABLED: Vulnerability score system - no longer automatically calculated
      // Note: Vulnerability score columns kept for potential future re-enablement
      // No need to call vulnerabilityService.calculateVulnerabilityScore()

      // Prepare family record
      const familyRecord: any = {
        id: dp.id,
        camp_id: dp.currentHousing.campId,
        head_of_family_name: dp.headOfFamily,
        head_of_family_first_name: dp.headFirstName,
        head_of_family_father_name: dp.headFatherName,
        head_of_family_grandfather_name: dp.headGrandfatherName,
        head_of_family_family_name: dp.headFamilyName,
        head_of_family_national_id: dp.nationalId,
        head_of_family_gender: dp.gender as any,
        head_of_family_date_of_birth: dp.dateOfBirth,
        head_of_family_age: dp.age,
        head_of_family_marital_status: dp.maritalStatus as any,
        head_of_family_widow_reason: (dp.widowReason || null) as any,
        head_of_family_role: (dp.headRole || 'أب') as any,
        head_of_family_is_working: dp.isWorking,
        head_of_family_job: dp.job || '',
        head_of_family_monthly_income: dp.monthlyIncome || 0,
        head_of_family_phone_number: dp.phoneNumber,
        head_of_family_phone_secondary: dp.phoneSecondary || '',
        head_of_family_disability_type: (dp.disabilityType || 'لا يوجد') as any,
        head_of_family_disability_details: dp.disabilityDetails || '',
        head_of_family_chronic_disease_type: (dp.chronicDiseaseType || 'لا يوجد') as any,
        head_of_family_chronic_disease_details: dp.chronicDiseaseDetails || '',
        head_of_family_war_injury_type: (dp.warInjuryType || 'لا يوجد') as any,
        head_of_family_war_injury_details: dp.warInjuryDetails || '',
        head_of_family_medical_followup_required: dp.medicalFollowupRequired,
        head_of_family_medical_followup_frequency: (dp.medicalFollowupFrequency || '') as any,
        wife_name: dp.wifeName || '',
        wife_national_id: dp.wifeNationalId || '',
        wife_is_pregnant: dp.wifeIsPregnant || false,
        wife_pregnancy_month: dp.wifePregnancyMonth || 0,
        wife_medical_followup_required: dp.wifeMedicalFollowupRequired || false,
        wife_medical_followup_frequency: (dp.wifeMedicalFollowupFrequency || '') as any,
        wife_disability_type: (dp.wifeDisabilityType || 'لا يوجد') as any,
        wife_disability_details: dp.wifeDisabilityDetails || '',
        wife_chronic_disease_type: (dp.wifeChronicDiseaseType || 'لا يوجد') as any,
        wife_chronic_disease_details: dp.wifeChronicDiseaseDetails || '',
        wife_war_injury_type: (dp.wifeWarInjuryType || 'لا يوجد') as any,
        wife_war_injury_details: dp.wifeWarInjuryDetails || '',
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
        current_housing_sanitary_facilities: (dp.currentHousing.sanitaryFacilities || 'لا (مرافق مشتركة)') as any,
        current_housing_sanitary_conditions: dp.currentHousing.sanitaryConditions || '',
        current_housing_water_source: (dp.currentHousing.waterSource || 'شبكة عامة') as any,
        current_housing_electricity_access: (dp.currentHousing.electricityAccess || 'لا يوجد') as any,
        current_housing_governorate: dp.currentHousing.governorate || null,
        current_housing_region: dp.currentHousing.region || null,
        current_housing_landmark: dp.currentHousing.landmark,
        // ⚠️  DISABLED: vulnerability_score, vulnerability_priority, vulnerability_breakdown are NOT auto-calculated
        vulnerability_score: 0,
        vulnerability_priority: 'منخفض' as any,
        vulnerability_breakdown: {},
        current_housing_country: dp.refugeeResidentAbroad?.country || '',
        vulnerability_reason: dp.vulnerabilityReason || '',
        nomination_body: dp.nominationBody || '',
        admin_notes: dp.adminNotes || '',
        registered_date: dp.registeredDate,
        last_updated: new Date().toISOString(),
      };

      // Save family to database
      if (await supabaseService.getFamilyById(dp.id)) {
        // Update existing family
        await supabaseService.updateFamily(dp.id, familyRecord);
      } else {
        // Create new family
        await supabaseService.createFamily(familyRecord);
      }

      // Save/update individuals
      for (const member of dp.members) {
        const individualRecord = {
          id: member.id,
          family_id: dp.id,
          name: member.name,
          first_name: member.firstName,
          father_name: member.fatherName,
          grandfather_name: member.grandfatherName,
          family_name: member.familyName,
          national_id: member.nationalId || '',
          gender: member.gender as any,
          date_of_birth: member.dateOfBirth,
          age: member.age,
          relation: member.relation as any,
          education_level: member.educationLevel as any,
          occupation: member.occupation || '',
          phone_number: member.phoneNumber || '',
          marital_status: (member.maritalStatus || 'أعزب') as any,
          disability_type: (member.disabilityType || 'لا يوجد') as any,
          disability_details: member.disabilityDetails || '',
          chronic_disease_type: (member.chronicDiseaseType || 'لا يوجد') as any,
          chronic_disease_details: member.chronicDiseaseDetails || '',
          has_war_injury: member.hasWarInjury || false,
          war_injury_type: (member.warInjuryType || 'لا يوجد') as any,
          war_injury_details: member.warInjuryDetails || '',
          medical_followup_required: member.medicalFollowupRequired || false,
          medical_followup_frequency: (member.medicalFollowupFrequency || '') as any,
        };

        // Check if individual exists
        const existingIndividuals = await supabaseService.getIndividualsByFamilyId(dp.id);
        const individualExists = existingIndividuals.some(ind => ind.id === member.id);
        if (await supabaseService.getIndividualById(individualRecord.id)) {
          await supabaseService.updateIndividual(individualRecord.id, individualRecord);
        } else {
          // Create new individual
          await supabaseService.createIndividual(individualRecord);
        }
      }

      // Log the action
      await this.logAction(userId, 'SAVE_DP', `ID: ${dp.id}`);

      return dp;
    } catch (error) {
      console.error('Error saving DP:', error);
      throw error;
    }
  },

  async getCamps(): Promise<Camp[]> {
    await delay(); // Simulate network delay
    try {
      const campRecords = await supabaseService.getCamps();
      
      return campRecords.map(record => ({
        id: record.id,
        name: record.name,
        location: {
          lat: record.location_lat,
          lng: record.location_lng,
          address: record.location_address,
          governorate: record.location_governorate,
          area: record.location_area
        },
        managerName: record.manager_name,
        status: record.status as any,
      }));
    } catch (error) {
      console.error('Error fetching camps:', error);
      return [];
    }
  },

  async updateCamp(camp: Camp, userId?: string) {
    await delay(); // Simulate network delay
    try {
      const campRecord = {
        id: camp.id,
        name: camp.name,
        manager_name: camp.managerName,
        status: camp.status as any,
        location_lat: camp.location.lat,
        location_lng: camp.location.lng,
        location_address: camp.location.address,
        location_governorate: camp.location.governorate,
        location_area: camp.location.area,
        created_at: '', // Not used during save
        updated_at: new Date().toISOString()
      };

      if (await supabaseService.getCampById(camp.id)) {
        // Update existing camp
        await supabaseService.updateCamp(camp.id, campRecord);
      } else {
        // Create new camp
        await supabaseService.createCamp(campRecord);
      }

      await this.logAction(userId, 'UPDATE_CAMP', `ID: ${camp.id}`);
    } catch (error) {
      console.error('Error updating camp:', error);
      throw error;
    }
  },

  async getInventory(campId: string): Promise<InventoryItem[]> {
    await delay(); // Simulate network delay
    try {
      const itemRecords = await supabaseService.getInventoryItems();
      
      // Filter items by camp (in a real implementation, inventory items would be linked to camps)
      // For now, we'll return all items
      return itemRecords.map(record => ({
        id: record.id,
        name: record.name,
        category: record.category as any,
        unit: record.unit,
        quantityAvailable: record.quantity_available ? parseFloat(record.quantity_available.toString()) : 0,
        quantityReserved: record.quantity_reserved ? parseFloat(record.quantity_reserved.toString()) : 0,
        minAlertThreshold: record.min_alert_threshold ? parseFloat(record.min_alert_threshold.toString()) : 0,
        expiryDate: record.expiry_date || undefined,
        donor: record.donor || undefined,
        receivedDate: record.received_date,
        notes: record.notes || undefined,
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
        await supabaseService.updateInventoryItem(item.id, itemRecord);
      } else {
        // Create new item
        await supabaseService.createInventoryItemRecord(itemRecord);
      }

      await this.logAction(userId, 'SAVE_INVENTORY_ITEM', `ID: ${item.id}, Camp: ${campId}`);
    } catch (error) {
      console.error('Error saving inventory item:', error);
      throw error;
    }
  },

  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    try {
      const record = await supabaseService.getInventoryItemById(id);
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

  async getTransferRequests(campId: string): Promise<TransferRequest[]> {
    await delay(); // Simulate network delay
    // Note: Transfer requests table doesn't exist in the schema yet
    // This would need to be implemented as a separate table
    return [];
  },

  async updateTransferStatus(id: string, status: 'موافق' | 'مرفوض', userId?: string) {
    await delay(); // Simulate network delay
    // Note: Transfer requests table doesn't exist in the schema yet
    // This would need to be implemented as a separate table
    await this.logAction(userId, 'UPDATE_TRANSFER_STATUS', `ID: ${id}, Status: ${status}`);
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