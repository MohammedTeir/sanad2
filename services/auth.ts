import { Role } from '../types';
import { makePublicRequest, makeAuthenticatedRequest } from '../utils/apiUtils';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  campId?: string;
  familyId?: string;
}

export interface Permission {
  resource: string;
  actions: string[]; // e.g., ['read', 'create', 'update', 'delete']
}

class AuthService {
  private currentUser: AuthUser | null = null;

  async login(email: string, password: string, role: Role): Promise<AuthUser | null> {
    try {
      // Clear any existing user data before login
      this.currentUser = null;

      // Call the backend API to authenticate the user and receive a real JWT
      const { token, user } = await makePublicRequest<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      // Store the real JWT token in localStorage
      localStorage.setItem('auth_token', token);

      this.currentUser = {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        campId: user.camp_id || undefined,
        familyId: user.family_id || undefined
      };

      return this.currentUser;
    } catch (error) {
      console.error('Authentication error:', error);
      // Ensure user is cleared if login fails
      this.currentUser = null;
      localStorage.removeItem('auth_token');
      return null;
    }
  }

  // Registration is typically handled by administrators, not end users
  // This method would be used by system admins to create new user accounts
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    campId?: string;
    familyId?: string;
  }): Promise<AuthUser | null> {
    try {
      // Call the backend API to create a user (requires admin privileges)
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/users', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password, // Password would be handled securely on the backend
          role: userData.role,
          camp_id: userData.campId || null,
          family_id: userData.familyId || null,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone_number: '',
          is_active: true
        }),
      });

      // After user creation, the new user would need to login separately
      // Return the created user data
      const authUser: AuthUser = {
        id: response.id,
        email: response.email,
        role: response.role as Role,
        campId: response.camp_id || undefined,
        familyId: response.family_id || undefined
      };

      return authUser;
    } catch (error) {
      console.error('User creation error (requires admin privileges):', error);
      return null;
    }
  }

  logout(): void {
    // Remove the token from localStorage
    localStorage.removeItem('auth_token');
    this.currentUser = null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async refreshCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.getCurrentUserProfile();
    }
    return null;
  }

  // Method to refresh the authentication token
  async refreshToken(): Promise<boolean> {
    try {
      const response = await makeAuthenticatedRequest('/refresh', {
        method: 'POST'
      });

      const { token } = response;
      localStorage.setItem('auth_token', token);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async getCurrentUserProfile(): Promise<AuthUser | null> {
    try {
      const user = await makeAuthenticatedRequest('http://localhost:3001/api/users/profile');
      
      this.currentUser = {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        campId: user.camp_id || undefined,
        familyId: user.family_id || undefined
      };

      return this.currentUser;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    // Check if we have a token and it's valid
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      await makeAuthenticatedRequest('/verify-token', {
        method: 'POST'
      });

      // Token is valid, get user profile if not already loaded
      if (!this.currentUser) {
        await this.getCurrentUserProfile();
      }

      return true;
    } catch (error) {
      // If verification fails, remove the token
      localStorage.removeItem('auth_token');
      this.currentUser = null;
      return false;
    }
  }

  async hasPermission(resource: string, action: string): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      // Get permissions for the user's role from the backend API
      const permissions = await makeAuthenticatedRequest(`http://localhost:3001/api/permissions/role/${this.currentUser.role}`);

      // Find if there's a permission entry for this resource and action
      const resourcePermission = permissions.find(
        (perm: any) => perm.resource === resource && perm.action === action
      );

      // Return true if a matching permission exists
      return !!resourcePermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async getAllPermissions(): Promise<any[]> {
    try {
      return await makeAuthenticatedRequest('http://localhost:3001/api/permissions');
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  async assignPermission(role: Role, resource: string, action: string): Promise<any> {
    try {
      return await makeAuthenticatedRequest('http://localhost:3001/api/permissions', {
        method: 'POST',
        body: JSON.stringify({
          role,
          resource,
          action,
          created_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error assigning permission:', error);
      throw error;
    }
  }

  async removePermission(permissionId: string): Promise<void> {
    try {
      await makeAuthenticatedRequest(`http://localhost:3001/api/permissions/${permissionId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error removing permission:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    try {
      const user = await makeAuthenticatedRequest(`http://localhost:3001/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      return {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        campId: user.camp_id || undefined,
        familyId: user.family_id || undefined
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();