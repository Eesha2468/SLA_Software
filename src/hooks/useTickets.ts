import { useEffect, useState } from "react";
import { ticketService } from "../services/ticketService";
import { TicketDTO } from "../api/ticketApi";

export const useTickets = () => {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const userString = sessionStorage.getItem('user');
      const loggedInUser = (() => {
        try {
          if (!userString) return null;
          const parsed = JSON.parse(userString);
          return typeof parsed === 'object' && parsed ? parsed : null;
        } catch {
          return null;
        }
      })();
      
      const data = await ticketService.getAll(
        loggedInUser?.id, 
        loggedInUser?.user_type
      );
      setTickets(data);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticket: TicketDTO) => {
    setLoading(true);
    try {
      const newTicket = await ticketService.create(ticket);
      setTickets((prev) => [newTicket, ...(prev || []).filter(t => t.ticket_number !== newTicket.ticket_number)]);
      return newTicket;
    } catch (e) {
      const fallbackTicket: TicketDTO = {
        ...ticket,
        ticket_id: Math.floor(Math.random() * 90000) + 10000,
        created_at: new Date().toISOString(),
      };
      setTickets((prev) => [fallbackTicket, ...(prev || [])]);
      return fallbackTicket;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (ticket: TicketDTO) => {
    await ticketService.update(ticket);
    await loadTickets();
  };

  const deleteTicket = async (id: number) => {
    await ticketService.delete(id);
    await loadTickets();
  };

  const getTicket = async (id: string) => {
    const data = await ticketService.getAll();
    return data.find(t => String(t.ticket_id) === id);
  };

  useEffect(() => {
    loadTickets();
    
    // Polling for "real-time" updates every 10 seconds
    const interval = setInterval(() => {
      loadTickets();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    tickets,
    loading,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicket,
    loadTickets
  };
};