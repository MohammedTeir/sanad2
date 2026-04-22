// components/FileUpload.tsx
import React, { useState, useRef, ChangeEvent } from 'react';
import { storageService, isValidFileType, isValidFileSize } from '../services/storageService';

interface FileUploadProps {
  onFileUpload: (fileUrl: string, fileName: string) => void;
  allowedTypes?: string[];
  maxSizeInMB?: number;
  bucketName: string;
  folderPath?: string;
  label?: string;
  buttonLabel?: string;
  multiple?: boolean;
  optional?: boolean;
  existingFileUrl?: string; // Add prop for existing file URL
  onRemoveFile?: () => void; // Add callback for removing file
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'],
  maxSizeInMB = 5,
  bucketName,
  folderPath,
  label = 'رفع ملف',
  buttonLabel = 'اختر ملف',
  multiple = false,
  optional = false,
  existingFileUrl,
  onRemoveFile
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!isValidFileType(file, allowedTypes)) {
          throw new Error(`نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedTypes.join(', ')}`);
        }

        // Validate file size
        if (!isValidFileSize(file, maxSizeInMB)) {
          throw new Error(`حجم الملف كبير جداً. الحد الأقصى المسموح به: ${maxSizeInMB} ميغابايت`);
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        // Upload file
        const result = await storageService.uploadFile(
          file,
          bucketName,
          folderPath
        );

        if (result.success && result.url) {
          onFileUpload(result.url, result.fileName || file.name);
          setSuccessMessage('تم رفع الملف بنجاح');
        } else {
          throw new Error(result.error || 'فشل رفع الملف');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفع الملف');
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {optional && <span className="text-gray-400 font-normal mr-2">(اختياري)</span>}
        </label>
      )}

      <div className="flex flex-col items-start gap-2">
        {/* Display existing file if present */}
        {existingFileUrl && (
          <div className="w-full p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">الملف مرفوع</p>
                  <a 
                    href={existingFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                  >
                    عرض الملف
                  </a>
                </div>
              </div>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition-all flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  حذف
                </button>
              )}
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
          accept={allowedTypes.join(',')}
        />

        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading || (existingFileUrl !== undefined && existingFileUrl !== '')}
          className={`px-4 py-2 rounded-lg font-medium ${
            isUploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : existingFileUrl
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isUploading ? 'جاري الرفع...' : existingFileUrl ? 'تم رفع الملف' : buttonLabel}
        </button>

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {successMessage && (
          <div className="text-sm text-green-600 font-medium">{successMessage}</div>
        )}

        {error && (
          <div className="text-sm text-red-600 font-medium">{error}</div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;