import { SopLog, SOP_SECTIONS, UserRole } from "@shared/schema";
import { format } from "date-fns";

// ==========================================
// LOCAL STORAGE MANAGER
// ==========================================

const LOGS_KEY_PREFIX = "sop_logs_";
const BATCHES_KEY = "sop_batches";

export interface BatchInfo {
  id: string;
  createdAt: string;
  lastUpdated: string;
}

export const storage = {
  // --- Batch Management ---
  getBatches: (): BatchInfo[] => {
    try {
      const raw = localStorage.getItem(BATCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to parse batches", e);
      return [];
    }
  },

  createBatch: (batchId: string): BatchInfo => {
    const batches = storage.getBatches();
    const existing = batches.find(b => b.id === batchId);
    if (existing) return existing;

    const newBatch: BatchInfo = {
      id: batchId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(BATCHES_KEY, JSON.stringify([newBatch, ...batches]));
    return newBatch;
  },

  updateBatchTimestamp: (batchId: string) => {
    const batches = storage.getBatches();
    const index = batches.findIndex(b => b.id === batchId);
    if (index !== -1) {
      batches[index].lastUpdated = new Date().toISOString();
      localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
    } else {
      // If batch doesn't exist in index but logs are being added (edge case), create it
      storage.createBatch(batchId);
    }
  },

  // --- Logs Management ---
  getLogs: (batchId: string): SopLog[] => {
    try {
      const raw = localStorage.getItem(`${LOGS_KEY_PREFIX}${batchId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(`Failed to get logs for ${batchId}`, e);
      return [];
    }
  },

  addLog: (batchId: string, log: Omit<SopLog, "id" | "loggedAt">) => {
    const logs = storage.getLogs(batchId);
    
    // Check if step already logged, update if so (overwrite)
    const existingIndex = logs.findIndex(
      l => l.sectionId === log.sectionId && l.stepId === log.stepId
    );

    const newLog: SopLog = {
      ...log,
      id: Math.floor(Math.random() * 1000000), // Client-side ID
      loggedAt: new Date(),
    };

    let updatedLogs;
    if (existingIndex !== -1) {
      updatedLogs = [...logs];
      updatedLogs[existingIndex] = newLog;
    } else {
      updatedLogs = [...logs, newLog];
    }

    localStorage.setItem(`${LOGS_KEY_PREFIX}${batchId}`, JSON.stringify(updatedLogs));
    storage.updateBatchTimestamp(batchId);
    return newLog;
  },

  // --- Logic Helpers ---
  
  // Find the next pending step for a specific batch and SOP section (SOPs are independent)
  getNextPendingStepInSection: (batchId: string, sectionId: number) => {
    const logs = storage.getLogs(batchId);
    const section = SOP_SECTIONS.find(s => s.id === sectionId);
    
    if (!section) return null;
    
    for (const step of section.steps) {
      const isCompleted = logs.some(
        l => l.sectionId === sectionId && l.stepId === step.id && l.status === "completed"
      );
      
      if (!isCompleted) {
        // This is the first incomplete step in this section
        // Find previous step info for context (only within same section)
        let prevLog = null;
        if (step.id > 1) {
          prevLog = logs.find(l => l.sectionId === sectionId && l.stepId === step.id - 1);
        }

        return {
          section,
          step,
          prevLog
        };
      }
    }
    return null; // All steps in this section complete
  },

  // Check strict sequence: Is step N unlockable? (WITHIN THE SAME SOP SECTION ONLY)
  // Each SOP section is completely independent with no cross-section dependencies
  isStepUnlockable: (batchId: string, sectionId: number, stepId: number): boolean => {
    // First step of any section is always available (SOPs are independent)
    if (stepId === 1) return true;

    const logs = storage.getLogs(batchId);
    
    // Check if previous step in SAME section is completed
    return logs.some(l => l.sectionId === sectionId && l.stepId === stepId - 1 && l.status === "completed");
  },

  // Clear all logs AFTER a specific point (if a step is unchecked/reset) - WITHIN SAME SOP ONLY
  // Only reset steps within the same SOP section (no cross-section impact)
  resetForwardSteps: (batchId: string, sectionId: number, stepId: number) => {
    let logs = storage.getLogs(batchId);
    
    // Remove the current step
    logs = logs.filter(l => !(l.sectionId === sectionId && l.stepId === stepId));

    // Remove all steps that come AFTER this one ONLY IN THE SAME SECTION
    // Keep all steps from OTHER sections untouched (complete independence)
    logs = logs.filter(l => {
      if (l.sectionId !== sectionId) return true; // Keep logs from other sections
      if (l.stepId > stepId) return false; // Remove forward steps in same section
      return true;
    });

    localStorage.setItem(`${LOGS_KEY_PREFIX}${batchId}`, JSON.stringify(logs));
    storage.updateBatchTimestamp(batchId);
  }
};
