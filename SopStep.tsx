import { useState } from "react";
import { format } from "date-fns";
import { Check, Upload, Calendar, AlertCircle, X, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogStep, useResetStep } from "@/hooks/use-sop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SopLog } from "@shared/schema";

interface SopStepProps {
  sectionId: number;
  step: { id: number; name: string; role: string; docRequired: boolean };
  log: SopLog | undefined;
  batchId: string;
  isUnlockable: boolean;
}

export function SopStep({ sectionId, step, log, batchId, isUnlockable }: SopStepProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  
  const createLog = useLogStep();
  const resetLog = useResetStep();
  
  const isCompleted = !!log;
  const canModify = user?.role === "Admin" || user?.role === step.role;
  const isActive = isUnlockable && !isCompleted;
  const isDisabled = !isUnlockable && !isCompleted;

  const handleComplete = async () => {
    if (!user) return;
    
    // Simulate File Upload
    const fileName = file ? file.name : (step.docRequired ? "document_missing.pdf" : undefined);
    
    await createLog.mutateAsync({
      batchId,
      sectionId,
      stepId: step.id,
      stepName: step.name,
      requiredRole: step.role,
      completedBy: user.name,
      userRole: user.role,
      workDate: date,
      documentName: fileName
    });
    setOpen(false);
  };

  const handleReset = async () => {
    if (confirm("Warning: Resetting this step will also reset ALL following steps. Continue?")) {
      await resetLog.mutateAsync({
        batchId,
        sectionId,
        stepId: step.id
      });
    }
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-300",
      isCompleted ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/10" : 
      isActive ? "border-l-primary shadow-md ring-1 ring-primary/20 scale-[1.01]" : 
      "border-l-muted-foreground/30 opacity-70 bg-muted/20"
    )}>
      <CardHeader className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                isCompleted ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                isActive ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              )}>
                Step {step.id}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Required Role: {step.role}
              </span>
            </div>
            <CardTitle className="text-base md:text-lg font-bold leading-tight">
              {step.name}
            </CardTitle>
          </div>
          
          <div className="flex-shrink-0">
            {isCompleted ? (
               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white shadow-sm">
                 <Check className="w-5 h-5" />
               </div>
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                isActive ? "border-primary text-primary bg-primary/5" : "border-muted-foreground/30 text-muted-foreground/30"
              )}>
                <span className="text-xs font-bold">{step.id}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {(isCompleted || isActive) && (
        <CardContent className="px-5 pb-4 pt-0">
          {isCompleted ? (
            <div className="bg-background/80 rounded-lg p-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">By:</span> {log?.completedBy} ({log?.userRole})
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="font-medium text-foreground">Work Date:</span> {log?.workDate}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-1 md:col-span-2">
                <Clock className="w-3 h-3" />
                <span className="font-medium text-foreground">Logged:</span> {log?.loggedAt ? format(new Date(log.loggedAt), "PP p") : "-"}
              </div>
              {log?.documentName && (
                <div className="flex items-center gap-2 text-primary col-span-1 md:col-span-2">
                  <Upload className="w-3 h-3" />
                  <span className="font-medium truncate">{log.documentName}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {canModify ? (
                <span className="text-primary font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Action Required
                </span>
              ) : (
                <span className="text-orange-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Pending {step.role} Action
                </span>
              )}
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="px-5 py-3 bg-muted/5 border-t flex justify-end gap-2">
        {isCompleted ? (
          canModify && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <X className="w-4 h-4 mr-2" />
              Reset Step
            </Button>
          )
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={!canModify || isDisabled}
                variant={canModify ? "default" : "secondary"}
                size="sm"
                className={cn(!canModify && "opacity-50 cursor-not-allowed")}
              >
                {canModify ? "Complete Step" : `Waiting for ${step.role}`}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Step {step.id}</DialogTitle>
                <DialogDescription>
                  {step.name}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className="text-right">User</Label>
                  <Input id="user" value={user?.name} disabled className="col-span-3 bg-muted" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Work Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="col-span-3" 
                  />
                </div>
                {step.docRequired && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="file" className="text-right">Document</Label>
                    <div className="col-span-3">
                       <Input 
                          id="file" 
                          type="file" 
                          onChange={(e) => setFile(e.target.files?.[0] || null)} 
                        />
                        <p className="text-xs text-muted-foreground mt-1">* Mandatory upload</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mt-2">
                   <div className="w-4 h-4 border border-primary rounded-sm flex items-center justify-center bg-primary text-primary-foreground">
                      <Check className="w-3 h-3" />
                   </div>
                   <span className="text-sm font-medium">I confirm this step is complete</span>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleComplete} 
                  disabled={!date || (step.docRequired && !file)}
                >
                  Confirm Completion
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
