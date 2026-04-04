export interface ExtractedEvent {
    id: string;
    description: string;
    time?: string | null;
    time_uncertainty?: string | null;
    location?: string | null;
    actors: string[];
    confidence: number;
    source_text: string;
}

export interface MergeConflictBlock {
    branch_a_label: string;
    branch_a_text: string;
    branch_b_label: string;
    branch_b_text: string;
}

export interface ConflictImpact {
    impact_score: number;
    affected_event_count: number;
    affected_event_ids: string[];
    reasoning: string;
}

export interface DetectedConflict {
    id: string;
    category: 'temporal' | 'spatial' | 'logical' | 'entity' | 'sequence' | 'causal';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    event_a_id: string;
    event_b_id: string;
    branch_a: string;
    branch_b: string;
    merge_block: MergeConflictBlock;
    impact: ConflictImpact;
    reasoning: string;
}

export interface MergedEvent {
    event_id: string;
    description: string;
    status: 'confirmed' | 'conflicted' | 'uncertain';
    branches_confirming: string[];
    conflict_ids: string[];
}

export interface NextBestQuestion {
    question: string;
    target_conflict_id: string;
    why_this_question: string;
    expected_resolution: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConflictDetectionResult {
    conflicts: DetectedConflict[];
    confirmed_events: MergedEvent[];
    conflicted_events: MergedEvent[];
    uncertain_events: MergedEvent[];
    next_best_question: NextBestQuestion | null;
    merge_diff: string;
}

export interface PipelineResponse {
    pipeline_id: string;
    mode: string;
    transcript: string;
    events: ExtractedEvent[];
    timeline: {
        probable_sequence: ExtractedEvent[];
        confirmed_sequence: ExtractedEvent[];
        uncertain_sequence: ExtractedEvent[];
    };
    conflicts: ConflictDetectionResult;
    next_question: NextBestQuestion | null;
    status: string;
    errors: string[];
}
