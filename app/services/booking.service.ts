import { api } from './api';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  _id: string; // Always present: MongoDB ObjectId
  id?: string; // May be present if backend adds a virtual
  bookingId?: string;
  customerName: string;
  serviceName: string;
  productId: string;
  date: string;
  time: string;
  price: number;
  ownerUid: string;
  ownerUsername: string;
  sellerLocation?: string;
  productImage?: string;
  eventTimePeriod?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const bookingService = {
  async getSellerBookings(page = 1, limit = 100, status?: BookingStatus, search?: string): Promise<Booking[]> {
    const params: any = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get('/bookings/seller', { params });
    return response.data;
  },

  async getMyBookings(page = 1, limit = 100, status?: BookingStatus, search?: string): Promise<Booking[]> {
    const params: any = { page, limit };
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  async createBooking(payload: Partial<Booking>) {
    const response = await api.post('/bookings', payload);
    return response.data;
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus, message?: string) {
    const response = await api.patch(`/bookings/${bookingId}/status`, { status, message });
    return response.data;
  },

  async getBookingById(id: string): Promise<Booking> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
};
