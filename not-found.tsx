import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto text-center border-none shadow-xl">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 justify-center text-destructive">
            <AlertCircle className="h-12 w-12" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">404 Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          
          <Link href="/">
             <Button className="w-full">Return to Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
