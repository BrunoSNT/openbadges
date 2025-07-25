import { useI18nContext } from '@/contexts/I18nContext';

export const useTranslation = () => {
  const { t, locale, changeLocale, isLoading } = useI18nContext();
  
  return {
    t,
    locale,
    changeLocale,
    isLoading,
    // Helper functions for common translations
    tCommon: (key: string, values?: Record<string, string | number>) => 
      t(`common.${key}`, values),
    tNav: (key: string, values?: Record<string, string | number>) => 
      t(`navigation.${key}`, values),
    tBadges: (key: string, values?: Record<string, string | number>) => 
      t(`badges.${key}`, values),
    tUsers: (key: string, values?: Record<string, string | number>) => 
      t(`users.${key}`, values),
    tForms: (key: string, values?: Record<string, string | number>) => 
      t(`forms.${key}`, values),
    tMessages: (key: string, values?: Record<string, string | number>) => 
      t(`messages.${key}`, values),
    tDashboard: (key: string, values?: Record<string, string | number>) => 
      t(`dashboard.${key}`, values),
    tHome: (key: string, values?: Record<string, string | number>) => 
      t(`home.${key}`, values),
    tTheme: (key: string, values?: Record<string, string | number>) => 
      t(`theme.${key}`, values),
    tAchievements: (key: string, values?: Record<string, string | number>) => 
      t(`achievements.${key}`, values),
    tWallet: (key: string, values?: Record<string, string | number>) => 
      t(`wallet.${key}`, values),
    tLayout: (key: string, values?: Record<string, string | number>) => 
      t(`layout.${key}`, values),
    tProfile: (key: string, params?: Record<string, string>) => t(`profile.${key}`, params),
    tProfileCreate: (key: string, params?: Record<string, string>) => t(`profile.create.${key}`, params),
    // Error helpers
    tErrors: (key: string, params?: Record<string, string>) => t(`errors.${key}`, params),
    // Validation helpers
    tValidation: (key: string, params?: Record<string, string>) => t(`validation.${key}`, params)
  };
};
