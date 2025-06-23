import { api } from './api';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Rating {
  rating: number;
  comment?: string;
}

export interface Booking {
  bookingId?: string;
  id: string;
  customerName: string;
  serviceName: string;
  productId?: string;
  date: string;
  time: string;
  status: BookingStatus;
  price: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  uid: string;        // ID of the customer who made the booking
  ownerUid: string;   // ID of the seller who owns the product
  ownerUsername: string;  // Username of the seller
  sellerLocation?: string;
  productImage?: string;
  eventTimePeriod?: string;
  eventType?: string;
  fittingTime?: string;
  fittingTimePeriod?: string;
  eventLocation?: string;
  rating?: Rating;
  rejectionMessage?: string;
  includeMakeupService?: boolean;
  makeupPrice?: number;
  makeupDuration?: number;
}

export const bookingService = {
  async getSellerBookings(page: number, limit: number, status?: BookingStatus, searchQuery?: string): Promise<Booking[]> {
    try {
      const params = { page, limit, status: status || undefined, q: searchQuery || undefined };
      const response = await api.get('/bookings/seller', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching seller bookings:', error);
      throw error;
    }
  },

  async getMyBookings(page: number, limit: number, status?: BookingStatus, searchQuery?: string): Promise<Booking[]> {
    try {
      const params = { page, limit, status: status || undefined, q: searchQuery || undefined };
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      throw error;
    }
  },

  async getBookingById(id: string): Promise<Booking> {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking ${id}:`, error);
      throw error;
    }
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus, message?: string): Promise<void> {
    try {
      const payload = { status, message };
      await api.put(`/bookings/${bookingId}/status`, payload);
      console.log(`Booking ${bookingId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  async createBooking(bookingData: any): Promise<Booking> {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async cancelBooking(id: string): Promise<void> {
    try {
      await api.post(`/bookings/${id}/cancel`, {});
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  async submitRating(id: string, ratingData: Rating): Promise<Booking> {
    try {
      const response = await api.post(`/bookings/${id}/rate`, ratingData);
      return response.data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }
}; 