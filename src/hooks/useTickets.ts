import { useEffect, useState } from "react";
import { ticketService } from "../services/ticketService";
import { TicketDTO } from "../api/ticketApi";

export const useTickets = () => {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const userString = localStorage.getItem('user');
      const loggedInUser = userString ? JSON.parse(userString) : null;
      
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
      await loadTickets();
      return newTicket;
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