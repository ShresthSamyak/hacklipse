import { apiClient } from './client';
import { PipelineResponse } from './types';

/**
 * Demo Pipeline Service
 * 
 * Centralized service for triggering the all-in-one hackathon analysis pipeline.
 */
export const DemoService = {
  /**
   * Run the full 5-stage pipeline on raw text.
   * Latency: ~15-20s (includes LLM extracting events + reasoning + conflicts).
   */
  runAnalysis: async (text: string, mode: 'investigator' | 'survivor' = 'investigator'): Promise<PipelineResponse> => {
    const { data } = await apiClient.post<PipelineResponse>('/demo/run-text', {
      text,
      mode,
      demo_mode: true,
      fast_preview: false,
    });
    return data;
  },

  /**
   * Returns a pre-computed sample result (zero LLM calls).
   * Latency: <100ms. Use for instant demo loading.
   */
  getSample: async (): Promise<PipelineResponse> => {
    const { data } = await apiClient.get<PipelineResponse>('/demo/sample');
    return data;
  },

  /**
   * Fast event-only extraction.
   * Latency: ~4s.
   */
  runPreview: async (text: string): Promise<PipelineResponse> => {
    const { data } = await apiClient.post<PipelineResponse>('/demo/run-preview', {
      text,
      mode: 'investigator',
      demo_mode: true,
      fast_preview: true,
    });
    return data;
  }
};
