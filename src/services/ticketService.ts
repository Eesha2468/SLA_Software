import { fetchTickets, createTicketInDb, updateTicketInDb, deleteTicketInDb, TicketDTO } from "../api/ticketApi";

export const ticketService = {
  create: async (ticket: TicketDTO) => {
    return await createTicketInDb(ticket);
  },

  getAll: async (user_id?: number, user_type?: string) => {
    return await fetchTickets(user_id, user_type);
  },

  update: async (ticket: TicketDTO) => {
    return await updateTicketInDb(ticket);
  },

  delete: async (id: number) => {
    return await deleteTicketInDb(id);
  }
};