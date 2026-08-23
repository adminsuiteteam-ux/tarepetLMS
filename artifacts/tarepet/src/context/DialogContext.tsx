import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  X,
  Sparkles
} from 'lucide-react';
import tarepetLogo from '@assets/tarepet__1784835204178.png';

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'help' | 'confirm' | 'delete';

export interface DialogOptions {
  title?: string;
  message: string | ReactNode;
  type?: DialogType;
  badge?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirm?: boolean;
}

interface DialogContextType {
  showAlert: (options: DialogOptions | string) => Promise<boolean>;
  showConfirm: (options: DialogOptions | string) => Promise<boolean>;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
  }, [resolver]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (dialogConfig?.onConfirm) {
      dialogConfig.onConfirm();
    }
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
  }, [dialogConfig, resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (dialogConfig?.onCancel) {
      dialogConfig.onCancel();
    }
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
  }, [dialogConfig, resolver]);

  const showAlert = useCallback((options: DialogOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const config: DialogOptions = typeof options === 'string' 
        ? { message: options, type: 'info', isConfirm: false } 
        : { ...options, isConfirm: false };
      
      setDialogConfig(config);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const showConfirm = useCallback((options: DialogOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const config: DialogOptions = typeof options === 'string' 
        ? { message: options, type: 'confirm', isConfirm: true } 
        : { ...options, isConfirm: true };
      
      setDialogConfig(config);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  }, []);

  // Global window dispatcher helper
  React.useEffect(() => {
    (window as any).showTarepetAlert = (msg: string, title?: string, type?: DialogType) => {
      showAlert({ message: msg, title: title || 'Tarepet Montessori School', type: type || 'info' });
    };
    (window as any).showTarepetConfirm = (msg: string, title?: string) => {
      return showConfirm({ message: msg, title: title || 'Please Confirm', type: 'confirm' });
    };
  }, [showAlert, showConfirm]);

  const getVariantStyles = (type: DialogType = 'info') => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          accentBorder: 'border-emerald-500/30',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
          defaultTitle: 'Operation Successful',
          defaultBadge: 'Tarepet Montessori LMS',
        };
      case 'error':
      case 'delete':
        return {
          icon: <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          accentBorder: 'border-rose-500/30',
          buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
          defaultTitle: 'Notice / Restriction',
          defaultBadge: 'Security Notice',
        };
      case 'warning':
      case 'confirm':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          accentBorder: 'border-amber-500/30',
          buttonClass: 'bg-[#E4583E] hover:bg-[#d04b32] text-white shadow-[#E4583E]/20',
          defaultTitle: 'Confirmation Required',
          defaultBadge: 'Tarepet Action Confirmation',
        };
      case 'help':
        return {
          icon: <HelpCircle className="w-6 h-6 text-primary" />,
          badgeBg: 'bg-primary/10 text-primary border-primary/20',
          accentBorder: 'border-primary/30',
          buttonClass: 'bg-primary hover:bg-primary/90 text-white shadow-primary/20',
          defaultTitle: 'Portal Assistance',
          defaultBadge: 'Tarepet ICT Support',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-[#E4583E] dark:text-[#f87158]" />,
          badgeBg: 'bg-[#E4583E]/10 text-[#E4583E] dark:text-[#f87158] border-[#E4583E]/20',
          accentBorder: 'border-[#E4583E]/30',
          buttonClass: 'bg-[#E4583E] hover:bg-[#d04b32] text-white shadow-[#E4583E]/20',
          defaultTitle: 'Tarepet Notification',
          defaultBadge: 'Tarepet Montessori School',
        };
    }
  };

  const currentType = dialogConfig?.type || 'info';
  const styles = getVariantStyles(currentType);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      {children}

      <AnimatePresence>
        {isOpen && dialogConfig && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={dialogConfig.isConfirm ? undefined : closeDialog}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-md bg-white dark:bg-zinc-900 border ${styles.accentBorder} rounded-[28px] shadow-2xl p-6 sm:p-7 overflow-hidden z-10`}
            >
              {/* Top Organic Accent Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#E4583E]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />

              {/* Header Badge & Close Button */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${styles.badgeBg}`}>
                  <img src={tarepetLogo} alt="Tarepet Logo" className="w-3.5 h-3.5 object-contain rounded-full" />
                  <span>{dialogConfig.badge || styles.defaultBadge}</span>
                </div>

                {!dialogConfig.isConfirm && (
                  <button
                    onClick={closeDialog}
                    className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center shrink-0 shadow-xs">
                  {styles.icon}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-lg font-serif font-bold text-foreground leading-snug tracking-tight">
                    {dialogConfig.title || styles.defaultTitle}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed font-sans whitespace-pre-line">
                    {dialogConfig.message}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {dialogConfig.isConfirm && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                  >
                    {dialogConfig.cancelText || 'Cancel'}
                  </button>
                )}

                <button
                  type="button"
                  autoFocus
                  onClick={handleConfirm}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:opacity-95 active:scale-98 ${styles.buttonClass}`}
                >
                  {dialogConfig.confirmText || (dialogConfig.isConfirm ? 'Proceed' : 'OK, Understood')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};

export function useCustomDialog(): DialogContextType {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useCustomDialog must be used within a DialogProvider');
  }
  return context;
}
