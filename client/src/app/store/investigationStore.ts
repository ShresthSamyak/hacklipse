import { create } from 'zustand';
import { DemoService } from '@/shared/api/services';
import { PipelineResponse } from '@/shared/api/types';

interface InvestigationState {
  // Master analysis payload
  pipelineData: PipelineResponse | null;
  
  // UI States
  isActive: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSample: () => Promise<void>;
  runAnalysis: (text: string) => Promise<void>;
  reset: () => void;
}

export const useInvestigationStore = create<InvestigationState>((set) => ({
  pipelineData: null,
  isActive: false,
  isLoading: false,
  error: null,

  loadSample: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await DemoService.getSample();
      set({ pipelineData: data, isActive: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load sample data', isLoading: false });
    }
  },

  runAnalysis: async (text: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await DemoService.runAnalysis(text);
      set({ pipelineData: data, isActive: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Analysis failed', isLoading: false });
    }
  },

  reset: () => set({ pipelineData: null, isActive: false, error: null, isLoading: false }),
}));
