import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Campaign } from './google-ads-api';

interface AppState {
  selectedCampaigns: Campaign[];
  recentOperations: any[];
  preferences: {
    theme: 'light' | 'dark';
    defaultMatchType: 'EXACT' | 'PHRASE' | 'BROAD';
    autoSave: boolean;
  };
  addSelectedCampaign: (campaign: Campaign) => void;
  removeSelectedCampaign: (campaignId: string) => void;
  clearSelectedCampaigns: () => void;
  addRecentOperation: (operation: any) => void;
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        selectedCampaigns: [],
        recentOperations: [],
        preferences: {
          theme: 'light',
          defaultMatchType: 'EXACT',
          autoSave: true
        },
        addSelectedCampaign: (campaign) =>
          set((state) => ({
            selectedCampaigns: [...state.selectedCampaigns, campaign]
          })),
        removeSelectedCampaign: (campaignId) =>
          set((state) => ({
            selectedCampaigns: state.selectedCampaigns.filter(c => c.id !== campaignId)
          })),
        clearSelectedCampaigns: () =>
          set({ selectedCampaigns: [] }),
        addRecentOperation: (operation) =>
          set((state) => ({
            recentOperations: [operation, ...state.recentOperations.slice(0, 9)]
          })),
        updatePreferences: (preferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...preferences }
          }))
      }),
      {
        name: 'google-ads-automation-storage'
      }
    )
  )
);