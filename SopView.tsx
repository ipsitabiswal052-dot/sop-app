import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useBatchLogs } from "@/hooks/use-sop";
import { SOP_SECTIONS } from "@shared/schema";
import { storage } from "@/lib/storage";
import { SopSection } from "@/components/SopSection";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook } from 'exceljs';
import { toast } from "@/hooks/use-toast";

export default function SopView() {
  const [, params] = useRoute("/sop/:id");
  const batchId = params?.id || "";
  const { user } = useAuth();
  
  const { data: logs, isLoading } = useBatchLogs(batchId);

  if (!user) {
    // Should be handled by router protection, but safe fallback
    window.location.href = "/";
    return null;
  }

  // Generate Excel Export
  const exportExcel = async () => {
    if (!logs) return;
    
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("SOP Audit Log");
    
    // Add headers
    worksheet.columns = [
      { header: "Batch ID", key: "batchId", width: 15 },
      { header: "SOP Section", key: "sectionId", width: 20 },
      { header: "Step Name", key: "stepName", width: 25 },
      { header: "Required Role", key: "requiredRole", width: 15 },
      { header: "Completed By", key: "completedBy", width: 20 },
      { header: "User Role", key: "userRole", width: 15 },
      { header: "Work Date", key: "workDate", width: 15 },
      { header: "Document", key: "documentName", width: 25 },
      { header: "Timestamp", key: "loggedAt", width: 20 }
    ];
    
    // Add data rows
    logs.forEach(log => {
      worksheet.addRow({
        batchId: log.batchId,
        sectionId: SOP_SECTIONS.find(s => s.id === log.sectionId)?.title || "",
        stepName: log.stepName,
        requiredRole: log.requiredRole,
        completedBy: log.completedBy,
        userRole: log.userRole,
        workDate: log.workDate,
        documentName: log.documentName || "N/A",
        loggedAt: new Date(log.loggedAt!).toLocaleString()
      });
    });
    
    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${batchId}_SOP_Report.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Excel Exported", description: "Report downloaded successfully." });
  };

  // Generate PDF Export
  const exportPDF = () => {
    if (!logs) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`SOP Compliance Report: ${batchId}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = logs.map(log => [
      log.stepName,
      log.requiredRole,
      `${log.completedBy} (${log.userRole})`,
      log.workDate,
      log.documentName || "-"
    ]);

    autoTable(doc, {
      head: [['Step', 'Role', 'Completed By', 'Date', 'Document']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 133, 244] }
    });
    
    doc.save(`${batchId}_SOP_Report.pdf`);
    toast({ title: "PDF Exported", description: "Audit report downloaded successfully." });
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const logsData = logs || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-display font-bold tracking-tight">{batchId}</h1>
             <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800">
               Active
             </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Tracking compliance workflow. Current User: <span className="font-semibold text-foreground">{user.name} ({user.role})</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportExcel()}>
            <FileText className="w-4 h-4 mr-2 text-green-600" />
            Excel Export
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileDown className="w-4 h-4 mr-2 text-red-600" />
            PDF Report
          </Button>
        </div>
      </div>

      {/* SOP Sections - Each SOP is completely independent, no cross-section dependencies */}
      <div className="space-y-4">
        {SOP_SECTIONS.map((section) => {
           // Each SOP section is completely independent - all sections are always unlockable
           // Step locking applies ONLY within the same SOP, not across different SOPs
           const isSectionUnlockable = true;

           return (
              <SopSection 
                key={section.id} 
                section={section} 
                logs={logsData} 
                batchId={batchId}
                isUnlockable={isSectionUnlockable} 
              />
           );
        })}
      </div>
      
      {/* Footer Instructions */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>Ensure all documents are verified before uploading. Logs are immutable after 24 hours.</p>
      </div>
    </div>
  );
}
