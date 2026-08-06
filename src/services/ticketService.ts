import { fetchTickets, fetchTicketById, createTicketInDb, updateTicketInDb, deleteTicketInDb, TicketDTO } from "../api/ticketApi";

export const ticketService = {
  create: async (ticket: TicketDTO) => {
    return await createTicketInDb(ticket);
  },

  getAll: async (user_id?: number, user_type?: string) => {
    return await fetchTickets(user_id, user_type);
  },

  getById: async (ticket_id: string | number) => {
    return await fetchTicketById(ticket_id);
  },

  update: async (ticket: TicketDTO) => {
    return await updateTicketInDb(ticket);
  },

  delete: async (id: number) => {
    return await deleteTicketInDb(id);
  }
};