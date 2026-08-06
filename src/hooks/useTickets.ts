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
      await loadTickets();
      return newTicket;
    } catch (e) {
      console.error("Error creating ticket:", e);
      throw e;
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
    if (!id) return null;
    try {
      const direct = await ticketService.getById(id);
      if (direct && (direct.ticket_id || direct.ticket_number)) {
        return direct;
      }
    } catch (e) {
      console.warn("Direct ticket lookup failed, checking local memory:", e);
    }
    const all = await ticketService.getAll();
    return (all || []).find(t => String(t.ticket_id) === String(id) || t.ticket_number === id) || null;
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