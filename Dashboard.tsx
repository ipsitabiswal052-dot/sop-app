import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePendingSteps } from "@/hooks/use-sop";
import { CardHover } from "@/components/ui/card-hover";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, switchBatch } = useAuth();
  const { data: pendingItems, isLoading } = usePendingSteps(user?.role || "Store");
  const [searchTerm, setSearchTerm] = useState("");
  const [newBatchId, setNewBatchId] = useState("");

  if (!user) return null;

  const filteredItems = pendingItems?.filter(item => 
    item.batchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartNewBatch = () => {
    if (newBatchId.trim()) {
      switchBatch(newBatchId.toUpperCase());
      window.location.href = `/sop/${newBatchId.toUpperCase()}`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Hello, {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            You are logged in as <span className="font-semibold text-foreground">{user.role}</span>. Here's what needs your attention.
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search Batch ID..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 bg-white"
             />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Access to Current Batch */}
        <CardHover className="p-6 col-span-1 md:col-span-2 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-none">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-2">Current Session</h2>
              <div className="font-mono text-3xl font-bold opacity-90 tracking-wider">
                {user.currentBatchId}
              </div>
              <p className="mt-2 text-primary-foreground/80 text-sm">
                Continue working on your current active batch.
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Clock className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-8">
            <Link href={`/sop/${user.currentBatchId}`}>
              <Button variant="secondary" className="w-full sm:w-auto font-semibold text-primary">
                Continue Workflow
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHover>

        {/* Start New Batch */}
        <CardHover className="p-6 bg-card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Start New Batch
          </h2>
          <div className="space-y-4">
            <Input 
               placeholder="Enter New Batch ID" 
               className="font-mono uppercase"
               value={newBatchId}
               onChange={(e) => setNewBatchId(e.target.value)}
            />
            <Button className="w-full" onClick={handleStartNewBatch} disabled={!newBatchId.trim()}>
              Open Batch
            </Button>
          </div>
        </CardHover>
      </div>

      {/* Pending Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold">Steps Pending For You ({filteredItems?.length || 0})</h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <Link key={item.batchId} href={`/sop/${item.batchId}`}>
                <CardHover className="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between cursor-pointer group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg bg-muted/50 px-2 py-0.5 rounded text-foreground">
                        {item.batchId}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.sopTitle}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-primary group-hover:underline decoration-2 underline-offset-2">
                      {item.step.id}. {item.step.name}
                    </h3>
                    
                    {item.prevLog ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Previous step completed by <span className="font-medium text-foreground">{item.prevLog.completedBy}</span> on {item.prevLog.workDate}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-1">
                        This is the first step of the process.
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Open
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHover>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/20">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              There are no pending steps waiting for your role specifically. Check back later or start a new batch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
