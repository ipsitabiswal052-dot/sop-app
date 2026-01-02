import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ROLES, UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import { z } from "zod";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role || !batchId.trim()) {
      setError("All fields are required.");
      return;
    }
    
    login(name, role as UserRole, batchId.toUpperCase());
    setLocation(`/sop/${batchId.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl shadow-primary/25 mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">SOP Manager</h1>
          <p className="text-muted-foreground mt-2">Sign in to track batch progress</p>
        </div>

        <Card className="border shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Enter your details to access the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch">Product / Batch ID</Label>
                <Input 
                  id="batch" 
                  placeholder="e.g. BATCH-2024-001" 
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="bg-muted/30 font-mono uppercase"
                />
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20">
                Access System
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          Internal System • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
