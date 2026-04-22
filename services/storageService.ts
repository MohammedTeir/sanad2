// services/storageService.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAuthToken } from '../utils/authUtils';

interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

class StorageService {
  private supabase: SupabaseClient;

  constructor() {
    // Initialize Supabase client
    // Note: In Vite, use import.meta.env instead of process.env
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase configuration. File upload functionality will be disabled.');
      console.error('Please add these to your .env file:');
      console.error('  VITE_SUPABASE_URL=your_supabase_url');
      console.error('  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
      console.error('');
      console.error('Current values:', { 
        VITE_SUPABASE_URL: supabaseUrl, 
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '[SET]' : '[NOT SET]' 
      });
      
      // Create a dummy client for development purposes
      this.supabase = {
        storage: {
          from: () => ({
            upload: async () => ({ error: new Error('Supabase not configured. Please check console for setup instructions.') }),
            createSignedUrl: async () => ({ error: new Error('Supabase not configured') })
          })
        }
      } as any;
    } else {
      console.log('✅ Supabase storage configured:', supabaseUrl);
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }

  /**
   * Upload a file to Supabase storage
   * @param file The file to upload
   * @param bucketName The storage bucket name
   * @param folderPath Optional folder path within the bucket
   * @returns Result containing success status, URL, and potential error
   */
  async uploadFile(
    file: File,
    bucketName: string,
    folderPath?: string,
    customFileName?: string
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      if (!file) {
        return { success: false, error: 'No file provided' };
      }

      // Generate a unique filename if not provided
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = customFileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Upload file to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        return { success: false, error: 'Could not generate public URL' };
      }

      return {
        success: true,
        url: publicUrlData.publicUrl,
        fileName: filePath
      };
    } catch (error: any) {
      console.error('Unexpected error during file upload:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Upload multiple files to Supabase storage
   */
  async uploadMultipleFiles(
    files: File[],
    bucketName: string,
    folderPath?: string
  ): Promise<FileUploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, bucketName, folderPath)
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Download a file from Supabase storage
   */
  async downloadFile(filePath: string, bucketName: string): Promise<Blob | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error during file download:', error);
      return null;
    }
  }

  /**
   * Delete a file from Supabase storage
   */
  async deleteFile(filePath: string, bucketName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error during file deletion:', error);
      return false;
    }
  }

  /**
   * Get a signed URL for a file (valid for a limited time)
   */
  async getSignedUrl(filePath: string, bucketName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Unexpected error during signed URL creation:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const storageService = new StorageService();

// Utility function to validate file types
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const fileType = file.type.toLowerCase();
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

  return allowedTypes.some(type => 
    type.startsWith('.') 
      ? fileExtension === type.substring(1) 
      : fileType.startsWith(type)
  );
}

// Utility function to validate file size
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
  return file.size <= maxSizeInMB * 1024 * 1024; // Convert MB to bytes
}