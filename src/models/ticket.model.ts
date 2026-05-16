export interface TicketAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }
  
  export interface TicketHistory {
    id: string;
    action: string;
    message: string;
    createdBy: string;
    timestamp: string;
  }
  
  export interface Ticket {
    id: string;
    ticketNumber: string;
  
    title: string;
    faultLevel: string;
    serviceProvider: string;
    equipment: string;
    location: string;
    reportedBy: string;
  
    status: "Open" | "Assigned" | "In Progress" | "Resolved" | "Dropped";
  
    description: string;
    stepsPerformed?: string;
  
    createdAt: string;
  
    assignedTo?: string;
  
    attachments: TicketAttachment[];
    history: TicketHistory[];
  }