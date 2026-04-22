import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { InventoryItem } from '../types';
import Toast from './Toast';

interface InventoryAuditFormProps {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  onClose: () => void;
  onSuccess: () => void;
}

const InventoryAuditForm: React.FC<InventoryAuditFormProps> = ({
  itemId,
  itemName,
  currentQuantity,
  onClose,
  onSuccess
}) => {
  const [physicalCount, setPhysicalCount] = useState(currentQuantity);
  const [reason, setReason] = useState<'shortage' | 'surplus' | 'theft' | 'damage' | 'miscount' | 'other'>('miscount');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, we would call the inventory service to perform the audit
      // For now, we'll just update the inventory item directly
      const allInventory = JSON.parse(localStorage.getItem('sanad_inventory') || '{}');
      
      // Find the item in the inventory
      let foundItem = null;
      let foundCampId = null;
      
      for (const [campId, items] of Object.entries(allInventory)) {
        const item = (items as InventoryItem[]).find(i => i.id === itemId);
        if (item) {
          foundItem = item;
          foundCampId = campId;
          break;
        }
      }
      
      if (foundItem && foundCampId) {
        // Update the item's quantity to match the physical count
        foundItem.quantity = physicalCount;
        
        // Update the inventory in storage
        const updatedInventory = { ...allInventory };
        updatedInventory[foundCampId] = updatedInventory[foundCampId].map(item => 
          item.id === itemId ? foundItem : item
        );
        
        localStorage.setItem('sanad_inventory', JSON.stringify(updatedInventory));

        // Log the audit action
        await storageService.logAction('current_user_id', 'INVENTORY_AUDIT',
          `Item: ${itemName}, Physical: ${physicalCount}, System: ${currentQuantity}, Difference: ${physicalCount - currentQuantity}`);

        setToast({ message: 'تم تسجيل الجرد بنجاح', type: 'success' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setToast({ message: 'لم يتم العثور على المادة في المخزون', type: 'error' });
      }
    } catch (error) {
      console.error('Error performing inventory audit:', error);
      setToast({ message: 'حدث خطأ أثناء تسجيل جرد المخزون', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const difference = physicalCount - currentQuantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-8 bg-amber-700 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">نموذج جرد المخزون</h3>
            <p className="text-amber-200 text-xs font-bold mt-1">المادة: {itemName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase">الكمية في النظام</p>
                <p className="text-xl font-black text-gray-800">{currentQuantity}</p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase">العد الفعلي</p>
                <p className="text-xl font-black text-gray-800">{physicalCount}</p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase">الفرق</p>
                <p className={`text-xl font-black ${difference === 0 ? 'text-gray-800' : difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference > 0 ? '+' : ''}{difference}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
              العد الفعلي للمادة
            </label>
            <input
              type="number"
              required
              min="0"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(parseInt(e.target.value))}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
                سبب الفرق
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 text-xs font-bold text-gray-600"
              >
                <option value="shortage">نقص</option>
                <option value="surplus">زيادة</option>
                <option value="theft">سرقة</option>
                <option value="damage">تلف</option>
                <option value="miscount">خطأ في العد</option>
                <option value="other">آخر</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
                ملاحظات (اختياري)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
                placeholder="ملاحظات إضافية عن الجرد..."
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black shadow-sm hover:bg-gray-200 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg hover:bg-amber-700 transition-all disabled:opacity-50"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل الجرد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryAuditForm;