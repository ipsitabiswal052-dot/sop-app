import { useState } from "react";
import { SopLog, SOP_SECTIONS } from "@shared/schema";
import { SopStep } from "./SopStep";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SopSectionProps {
  section: typeof SOP_SECTIONS[number];
  logs: SopLog[];
  batchId: string;
  isUnlockable: boolean; // Is the very first step of this section unlockable?
}

export function SopSection({ section, logs, batchId, isUnlockable }: SopSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isUnlockable); // Auto expand active sections
  
  const totalSteps = section.steps.length;
  const completedSteps = section.steps.filter(s => 
    logs.some(l => l.sectionId === section.id && l.stepId === s.id && l.status === "completed")
  ).length;
  
  const progress = (completedSteps / totalSteps) * 100;
  const isComplete = progress === 100;

  return (
    <div className="mb-6 rounded-xl border bg-card shadow-sm overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 md:p-6 transition-colors hover:bg-muted/50",
          isExpanded ? "bg-muted/30" : ""
        )}
      >
        <div className="flex items-center gap-4 text-left">
          <div className={cn(
            "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg border shadow-sm",
            isComplete ? "bg-green-500 border-green-600 text-white" : "bg-white dark:bg-zinc-800 border-border text-foreground"
          )}>
            {isComplete ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : section.id}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg md:text-xl text-foreground">
              {section.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{completedSteps} / {totalSteps} steps</span>
              {isComplete && <span className="text-green-600 font-medium">Completed</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Progress bar only visible on desktop to save space on mobile */}
           <div className="hidden md:block w-32">
             <Progress value={progress} className="h-2" />
           </div>
           {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 md:p-6 bg-muted/5 border-t">
          <div className="space-y-4 max-w-4xl mx-auto">
            {section.steps.map((step, idx) => {
              // Logic for unlockable:
              // Step 1: uses the passed prop 'isUnlockable' (which checks end of prev section)
              // Step N: checks if Step N-1 is complete
              
              let stepUnlockable = false;
              if (step.id === 1) {
                stepUnlockable = isUnlockable;
              } else {
                stepUnlockable = logs.some(l => l.sectionId === section.id && l.stepId === step.id - 1 && l.status === "completed");
              }
              
              return (
                <SopStep
                  key={step.id}
                  sectionId={section.id}
                  step={step}
                  batchId={batchId}
                  log={logs.find(l => l.sectionId === section.id && l.stepId === step.id)}
                  isUnlockable={stepUnlockable}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
