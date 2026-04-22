// services/beneficiaryService.ts
import { makeAuthenticatedRequest, makePublicRequest } from '../utils/apiUtils';
import type { 
  DPProfile, 
  FamilyMember, 
  AidTransaction, 
  TransferRequest, 
  CampInfo, 
  Notification, 
  SpecialAssistanceRequest, 
  DistributionRecord,
  Complaint,
  EmergencyReport
} from '../types';
import { sessionService } from './sessionService';

/**
 * Beneficiary Service
 * Handles all API calls for the beneficiary (DP) portal
 * Uses dedicated /api/dp endpoints designed for BENEFICIARY role
 */
export const beneficiaryService = {
  /**
   * Get complete family profile
   */
  async getFamilyProfile(familyId: string): Promise<DPProfile> {
    console.log('[beneficiaryService] Getting family profile for:', familyId);
    const currentUser = sessionService.getCurrentUser();
    console.log('[beneficiaryService] Current user:', currentUser);
    
    const response = await makeAuthenticatedRequest('/dp/profile');
    console.log('[beneficiaryService] Profile response:', response);
    return response;
  },

  /**
   * Get all family members
   */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    console.log('[beneficiaryService] Getting family members for:', familyId);
    const response = await makeAuthenticatedRequest('/dp/members');
    console.log('[beneficiaryService] Members response count:', Array.isArray(response) ? response.length : 0);
    return Array.isArray(response) ? response.map((member: any) => ({
      id: member.id,
      firstName: member.first_name || '',
      fatherName: member.father_name || '',
      grandfatherName: member.grandfather_name || '',
      familyName: member.family_name || '',
      name: member.name || '',
      nationalId: member.national_id || '',
      gender: member.gender || 'ذكر',
      dateOfBirth: member.date_of_birth || '',
      age: member.age || 0,
      relation: member.relation || 'الابن',
      isStudying: member.is_studying || false,
      isWorking: member.is_working || false,
      educationStage: member.education_stage || 'لا يدرس',
      educationLevel: member.education_level || 'لا يدرس',
      occupation: member.occupation || '',
      phoneNumber: member.phone_number || '',
      maritalStatus: member.marital_status || 'أعزب/عزباء',
      disabilityType: member.disability_type || 'لا يوجد',
      disabilitySeverity: member.disability_severity,
      disabilityDetails: member.disability_details,
      chronicDiseaseType: member.chronic_disease_type || 'لا يوجد',
      chronicDiseaseDetails: member.chronic_disease_details,
      hasWarInjury: member.has_war_injury || false,
      warInjuryType: member.war_injury_type || 'لا يوجد',
      warInjuryDetails: member.war_injury_details,
      medicalFollowupRequired: member.medical_followup_required || false,
      medicalFollowupFrequency: member.medical_followup_frequency,
      medicalFollowupDetails: member.medical_followup_details,
      isDeleted: member.is_deleted || false,
      deletedAt: member.deleted_at
    })) : [];
  },

  /**
   * Add new family member
   */
  async addFamilyMember(familyId: string, memberData: Partial<FamilyMember>): Promise<FamilyMember> {
    // Compute name from parts if not provided
    const computedName = memberData.name || `${memberData.firstName || ''} ${memberData.fatherName || ''} ${memberData.grandfatherName || ''} ${memberData.familyName || ''}`.trim();
    
    // Normalize disability type
    const disabilityTypeValue = memberData.disabilityType || 'لا يوجد';
    const chronicDiseaseTypeValue = memberData.chronicDiseaseType || 'لا يوجد';
    const warInjuryTypeValue = memberData.warInjuryType || 'لا يوجد';
    
    const payload = {
      family_id: familyId,
      first_name: memberData.firstName,
      father_name: memberData.fatherName,
      grandfather_name: memberData.grandfatherName,
      family_name: memberData.familyName,
      name: computedName,
      national_id: memberData.nationalId,
      gender: memberData.gender,
      date_of_birth: memberData.dateOfBirth,
      age: memberData.age,
      relation: memberData.relation,
      is_studying: memberData.isStudying || false,
      is_working: memberData.isWorking || false,
      education_stage: memberData.isStudying ? (memberData.educationStage || null) : null,
      education_level: memberData.isStudying ? (memberData.educationLevel || null) : null,
      occupation: memberData.isWorking ? (memberData.occupation || null) : null,
      phone_number: memberData.phoneNumber || null,
      marital_status: memberData.maritalStatus || null,
      // Health fields - send null to clear from DB when "لا يوجد"
      disability_type: disabilityTypeValue,
      disability_severity: disabilityTypeValue === 'لا يوجد' ? null : (memberData.disabilitySeverity || null),
      disability_details: disabilityTypeValue === 'لا يوجد' ? null : (memberData.disabilityDetails || null),
      chronic_disease_type: chronicDiseaseTypeValue,
      chronic_disease_details: chronicDiseaseTypeValue === 'لا يوجد' ? null : (memberData.chronicDiseaseDetails || null),
      has_war_injury: memberData.hasWarInjury || false,
      war_injury_type: (!memberData.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? 'لا يوجد' : warInjuryTypeValue,
      war_injury_details: (!memberData.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? null : (memberData.warInjuryDetails || null),
      medical_followup_required: memberData.medicalFollowupRequired || false,
      medical_followup_frequency: memberData.medicalFollowupRequired ? (memberData.medicalFollowupFrequency || null) : null,
      medical_followup_details: memberData.medicalFollowupRequired ? (memberData.medicalFollowupDetails || null) : null
    };

    const response = await makeAuthenticatedRequest('/dp/members', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      id: response.id,
      firstName: response.first_name,
      fatherName: response.father_name,
      grandfatherName: response.grandfather_name,
      familyName: response.family_name,
      name: response.name,
      nationalId: response.national_id,
      gender: response.gender,
      dateOfBirth: response.date_of_birth,
      age: response.age,
      relation: response.relation,
      isStudying: response.is_studying,
      isWorking: response.is_working,
      educationStage: response.education_stage,
      educationLevel: response.education_level,
      occupation: response.occupation,
      phoneNumber: response.phone_number,
      maritalStatus: response.marital_status,
      disabilityType: response.disability_type,
      disabilitySeverity: response.disability_severity,
      disabilityDetails: response.disability_details,
      chronicDiseaseType: response.chronic_disease_type,
      chronicDiseaseDetails: response.chronic_disease_details,
      hasWarInjury: response.has_war_injury,
      warInjuryType: response.war_injury_type,
      warInjuryDetails: response.war_injury_details,
      medicalFollowupRequired: response.medical_followup_required,
      medicalFollowupFrequency: response.medical_followup_frequency,
      medicalFollowupDetails: response.medical_followup_details
    };
  },

  /**
   * Update family member
   */
  async updateFamilyMember(memberId: string, memberData: Partial<FamilyMember>): Promise<FamilyMember> {
    // Compute name from parts if not provided
    const computedName = memberData.name || `${memberData.firstName || ''} ${memberData.fatherName || ''} ${memberData.grandfatherName || ''} ${memberData.familyName || ''}`.trim();
    
    // Normalize disability type
    const disabilityTypeValue = memberData.disabilityType || 'لا يوجد';
    const chronicDiseaseTypeValue = memberData.chronicDiseaseType || 'لا يوجد';
    const warInjuryTypeValue = memberData.warInjuryType || 'لا يوجد';
    
    const payload: any = {
      first_name: memberData.firstName,
      father_name: memberData.fatherName,
      grandfather_name: memberData.grandfatherName,
      family_name: memberData.familyName,
      name: computedName,
      national_id: memberData.nationalId,
      gender: memberData.gender,
      date_of_birth: memberData.dateOfBirth,
      age: memberData.age,
      relation: memberData.relation,
      is_studying: memberData.isStudying || false,
      is_working: memberData.isWorking || false,
      education_stage: memberData.isStudying ? (memberData.educationStage || null) : null,
      education_level: memberData.isStudying ? (memberData.educationLevel || null) : null,
      occupation: memberData.isWorking ? (memberData.occupation || null) : null,
      phone_number: memberData.phoneNumber || null,
      marital_status: memberData.maritalStatus || null,
      // Health fields - send null to clear from DB when "لا يوجد"
      disability_type: disabilityTypeValue,
      disability_severity: disabilityTypeValue === 'لا يوجد' ? null : (memberData.disabilitySeverity || null),
      disability_details: disabilityTypeValue === 'لا يوجد' ? null : (memberData.disabilityDetails || null),
      chronic_disease_type: chronicDiseaseTypeValue,
      chronic_disease_details: chronicDiseaseTypeValue === 'لا يوجد' ? null : (memberData.chronicDiseaseDetails || null),
      has_war_injury: memberData.hasWarInjury || false,
      war_injury_type: (!memberData.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? 'لا يوجد' : warInjuryTypeValue,
      war_injury_details: (!memberData.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? null : (memberData.warInjuryDetails || null),
      medical_followup_required: memberData.medicalFollowupRequired || false,
      medical_followup_frequency: memberData.medicalFollowupRequired ? (memberData.medicalFollowupFrequency || null) : null,
      medical_followup_details: memberData.medicalFollowupRequired ? (memberData.medicalFollowupDetails || null) : null
    };

    const response = await makeAuthenticatedRequest(`/dp/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    return {
      id: response.id,
      firstName: response.first_name,
      fatherName: response.father_name,
      grandfatherName: response.grandfather_name,
      familyName: response.family_name,
      name: response.name,
      nationalId: response.national_id,
      gender: response.gender,
      dateOfBirth: response.date_of_birth,
      age: response.age,
      relation: response.relation,
      isStudying: response.is_studying,
      isWorking: response.is_working,
      educationStage: response.education_stage,
      educationLevel: response.education_level,
      occupation: response.occupation,
      phoneNumber: response.phone_number,
      maritalStatus: response.marital_status,
      disabilityType: response.disability_type,
      disabilitySeverity: response.disability_severity,
      disabilityDetails: response.disability_details,
      chronicDiseaseType: response.chronic_disease_type,
      chronicDiseaseDetails: response.chronic_disease_details,
      hasWarInjury: response.has_war_injury,
      warInjuryType: response.war_injury_type,
      warInjuryDetails: response.war_injury_details,
      medicalFollowupRequired: response.medical_followup_required,
      medicalFollowupFrequency: response.medical_followup_frequency,
      medicalFollowupDetails: response.medical_followup_details
    };
  },

  /**
   * Delete family member (soft delete)
   */
  async deleteFamilyMember(memberId: string): Promise<void> {
    await makeAuthenticatedRequest(`/individuals/${memberId}/family-member`, {
      method: 'DELETE'
    });
  },

  /**
   * Get aid distribution history
   */
  async getAidHistory(familyId: string): Promise<AidTransaction[]> {
    const response = await makeAuthenticatedRequest('/dp/aid-history');
    return Array.isArray(response) ? response.map((dist: any) => ({
      id: dist.id,
      dpId: dist.family_id,
      aidType: dist.aid_type,
      aidCategory: dist.aid_category,
      quantity: dist.quantity,
      date: dist.distribution_date,
      distributedBy: dist.distributed_by_user_id,
      notes: dist.notes,
      campaignId: dist.campaign_id,
      receivedBySignature: dist.received_by_signature,
      receivedByBiometric: dist.received_by_biometric,
      receivedByPhoto: dist.received_by_photo_url,
      otpCode: dist.otp_code,
      duplicateCheckPassed: dist.duplicate_check_passed,
      status: dist.status
    })) : [];
  },

  /**
   * Get transfer requests
   */
  async getTransferRequests(familyId: string): Promise<TransferRequest[]> {
    const response = await makeAuthenticatedRequest('/dp/transfer-requests');
    return Array.isArray(response) ? response.map((req: any) => ({
      id: req.id,
      dpId: req.dp_id,
      dpName: req.dp_name,
      fromCampId: req.from_camp_id,
      toCampId: req.to_camp_id,
      status: req.status,
      date: req.date,
      reason: req.reason
    })) : [];
  },

  /**
   * Submit transfer request
   */
  async submitTransferRequest(familyId: string, reason: string, toCampId: string): Promise<TransferRequest> {
    const payload = {
      dp_id: familyId,
      from_camp_id: null, // Will be set by backend based on family
      to_camp_id: toCampId,
      reason: reason
    };

    const response = await makeAuthenticatedRequest('/transfers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      id: response.id,
      dpId: response.dp_id,
      dpName: response.dp_name,
      fromCampId: response.from_camp_id,
      toCampId: response.to_camp_id,
      status: response.status,
      date: response.date,
      reason: response.reason
    };
  },

  /**
   * Submit complaint/feedback
   */
  async submitComplaint(subject: string, description: string, category: string, isAnonymous: boolean = false): Promise<any> {
    const payload = {
      subject: subject,
      description: description,
      category: category,
      is_anonymous: isAnonymous
    };

    return await makeAuthenticatedRequest('/dp/complaints', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Get complaints/feedback for family
   */
  async getComplaints(familyId: string): Promise<Complaint[]> {
    console.log('[beneficiaryService] Getting complaints for:', familyId);
    const currentUser = sessionService.getCurrentUser();
    console.log('[beneficiaryService] Current user for complaints:', currentUser);
    
    const response = await makeAuthenticatedRequest('/dp/complaints');
    console.log('[beneficiaryService] Complaints response count:', Array.isArray(response) ? response.length : 0);
    return Array.isArray(response) ? response.map((c: any) => ({
      id: c.id,
      familyId: c.family_id,
      subject: c.subject,
      description: c.description,
      category: c.category,
      isAnonymous: c.is_anonymous,
      status: c.status,
      response: c.response,
      respondedAt: c.responded_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    })) : [];
  },

  /**
   * Submit emergency report
   */
  async submitEmergencyReport(
    emergencyType: string,
    description: string,
    urgency: 'عاجل جداً' | 'عاجل' | 'عادي',
    location?: string
  ): Promise<any> {
    const payload = {
      emergency_type: emergencyType,
      description: description,
      urgency: urgency,
      location: location
    };

    return await makeAuthenticatedRequest('/dp/emergency-reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Get emergency reports for family
   */
  async getEmergencyReports(familyId: string): Promise<EmergencyReport[]> {
    console.log('[beneficiaryService] Getting emergency reports for:', familyId);
    const currentUser = sessionService.getCurrentUser();
    console.log('[beneficiaryService] Current user for emergency reports:', currentUser);
    
    const response = await makeAuthenticatedRequest('/dp/emergency-reports');
    console.log('[beneficiaryService] Emergency reports response count:', Array.isArray(response) ? response.length : 0);
    return Array.isArray(response) ? response.map((r: any) => ({
      id: r.id,
      familyId: r.family_id,
      emergencyType: r.emergency_type,
      description: r.description,
      urgency: r.urgency,
      location: r.location,
      status: r.status,
      assignedTo: r.assigned_to,
      resolvedAt: r.resolved_at,
      resolutionNotes: r.resolution_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })) : [];
  },

  /**
   * Update family phone numbers
   */
  async updateFamilyPhones(familyId: string, phoneNumber: string, phoneSecondary?: string): Promise<DPProfile> {
    const payload = {
      phone_number: phoneNumber,
      phone_secondary: phoneSecondary
    };

    return await makeAuthenticatedRequest('/dp/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Get all camps (for transfer request)
   * Uses public endpoint since BENEFICIARY role doesn't have permission for /camps
   */
  async getCamps(): Promise<any[]> {
    try {
      // Use public endpoint that returns active camps
      const camps = await makePublicRequest('/public/camps');
      return Array.isArray(camps) ? camps : [];
    } catch (error) {
      console.error('Error fetching camps:', error);
      return [];
    }
  },

  /**
   * Get camp information for family
   */
  async getCampInfo(): Promise<CampInfo | null> {
    const response = await makeAuthenticatedRequest('/dp/camp-info');
    return response || null;
  },

  /**
   * Get distribution history with campaign details
   */
  async getDistributionHistory(): Promise<DistributionRecord[]> {
    const response = await makeAuthenticatedRequest('/dp/distributions');
    return Array.isArray(response) ? response.map((dist: any) => ({
      id: dist.id,
      dpId: dist.family_id,
      aidType: dist.aid_type,
      aidCategory: dist.aid_category,
      quantity: dist.quantity,
      date: dist.distribution_date,
      distributedBy: dist.distributed_by_user_id,
      notes: dist.notes,
      campaignId: dist.campaign_id,
      campaignName: dist.campaign_name,
      distributedByUser: dist.distributed_by_user_name,
      campName: dist.camp_name,
      receivedBySignature: dist.received_by_signature,
      receivedByBiometric: dist.received_by_biometric,
      receivedByPhoto: dist.received_by_photo_url,
      otpCode: dist.otp_code,
      duplicateCheckPassed: dist.duplicate_check_passed,
      status: dist.status
    })) : [];
  },

  /**
   * Get notifications for family
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await makeAuthenticatedRequest('/dp/notifications');
    return Array.isArray(response) ? response.map((n: any) => ({
      id: n.id,
      familyId: n.family_id,
      type: n.notification_type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      relatedEntityId: n.related_entity_id,
      relatedEntityType: n.related_entity_type,
      createdAt: n.created_at,
      readAt: n.read_at
    })) : [];
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await makeAuthenticatedRequest(`/dp/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await makeAuthenticatedRequest('/dp/notifications/mark-all-read', {
      method: 'POST'
    });
  },

  /**
   * Get special assistance requests
   */
  async getSpecialAssistanceRequests(): Promise<SpecialAssistanceRequest[]> {
    const response = await makeAuthenticatedRequest('/dp/special-assistance');
    return Array.isArray(response) ? response.map((req: any) => ({
      id: req.id,
      familyId: req.family_id,
      assistanceType: req.assistance_type,
      description: req.description,
      urgency: req.urgency,
      status: req.status,
      response: req.response,
      respondedAt: req.responded_at,
      respondedBy: req.responded_by,
      createdAt: req.created_at,
      updatedAt: req.updated_at
    })) : [];
  },

  /**
   * Submit special assistance request
   */
  async submitSpecialAssistanceRequest(
    assistanceType: 'طبية' | 'مالية' | 'سكنية' | 'تعليمية' | 'أخرى',
    description: string,
    urgency: 'عاجل جداً' | 'عاجل' | 'عادي'
  ): Promise<SpecialAssistanceRequest> {
    const payload = {
      assistance_type: assistanceType,
      description: description,
      urgency: urgency
    };

    const response = await makeAuthenticatedRequest('/dp/special-assistance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      id: response.id,
      familyId: response.family_id,
      assistanceType: response.assistance_type,
      description: response.description,
      urgency: response.urgency,
      status: response.status,
      response: response.response,
      respondedAt: response.responded_at,
      respondedBy: response.responded_by,
      createdAt: response.created_at,
      updatedAt: response.updated_at
    };
  },

  /**
   * Get vulnerability breakdown details
   */
  async getVulnerabilityBreakdown(): Promise<{ [key: string]: number }> {
    return await makeAuthenticatedRequest('/dp/vulnerability/breakdown');
  }
};
