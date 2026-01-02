import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storage } from "@/lib/storage";
import { SopLog, UserRole } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import emailjs from 'emailjs-com';

// ============================================
// HOOKS FOR SOP DATA (USING LOCALSTORAGE)
// ============================================

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => storage.getBatches(),
  });
}

export function useBatchLogs(batchId: string) {
  return useQuery({
    queryKey: ['logs', batchId],
    queryFn: async () => storage.getLogs(batchId),
    enabled: !!batchId,
  });
}

// Hook to find pending steps for dashboard
export function usePendingSteps(userRole: UserRole | "Admin") {
  const { data: batches } = useBatches();
  
  return useQuery({
    queryKey: ['pendingSteps', userRole, batches?.length], // Re-run if batches change
    queryFn: async () => {
      if (!batches) return [];
      
      const actionable = [];
      
      for (const batch of batches) {
        const next = storage.getNextPendingStep(batch.id);
        if (next) {
          // Admin sees all, otherwise match role
          if (userRole === "Admin" || next.step.role === userRole) {
            actionable.push({
              batchId: batch.id,
              sopTitle: next.section.title,
              step: next.step,
              prevLog: next.prevLog
            });
          }
        }
      }
      return actionable;
    },
    enabled: !!batches,
  });
}

export function useLogStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      batchId, 
      sectionId, 
      stepId, 
      stepName, 
      requiredRole, 
      completedBy, 
      userRole, 
      workDate, 
      documentName 
    }: Omit<SopLog, "id" | "loggedAt" | "status"> & { batchId: string }) => {
      
      // 1. Save to local storage
      const newLog = storage.addLog(batchId, {
        batchId,
        sectionId,
        stepId,
        stepName,
        requiredRole,
        completedBy,
        userRole,
        workDate,
        documentName,
        status: "completed"
      });

      // 2. Determine Next Step for Email Notification
      const nextStepInfo = storage.getNextPendingStep(batchId);
      
      // 3. Send Email Notification (Simulated/Client-side)
      if (nextStepInfo) {
        // In a real app, you'd put your service ID, template ID, and user ID here
        // emailjs.send('service_id', 'template_id', { ...variables })
        console.log(`[EMAIL SIMULATION] To: ${nextStepInfo.step.role} Team`);
        console.log(`Subject: SOP Action Required – ${nextStepInfo.step.name}`);
        console.log(`Body: Step "${stepName}" completed by ${completedBy}. Please proceed.`);
      }

      return newLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['logs', variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ['batches'] }); 
      queryClient.invalidateQueries({ queryKey: ['pendingSteps'] });
      
      toast({
        title: "Step Completed",
        description: "Progress saved locally. Notification sent.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: "Failed to save step progress.",
        variant: "destructive",
      });
    }
  });
}

export function useResetStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, sectionId, stepId }: { batchId: string, sectionId: number, stepId: number }) => {
      storage.resetForwardSteps(batchId, sectionId, stepId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['logs', vars.batchId] });
      queryClient.invalidateQueries({ queryKey: ['pendingSteps'] });
      
      toast({
        title: "Step Reset",
        description: "This step and all following steps have been reset.",
      });
    }
  });
}
