

import { api } from './api';

export interface Rating {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingInput {
  productId: string;
  rating: number;
  comment?: string;
}

export const ratingsService = {
  async createRating(ratingData: {
    productId: string;
    rating: number;
    comment?: string;
  }): Promise<Rating> {
    try {
      const response = await api.post('/ratings', ratingData);
      return response.data;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  },

  async getProductRatings(productId: string): Promise<Rating[]> {
    try {
      const response = await api.get(`/ratings/${productId}`);
      return response.data;
    } catch (error) {
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },

  async getProductAverageRating(productId: string): Promise<number> {
    try {
      const ratings = await this.getProductRatings(productId);
      if (ratings.length === 0) {
        return 0;
      }
      const total = ratings.reduce((acc, item) => acc + item.rating, 0);
      return total / ratings.length;
    } catch (error) {
      console.error(`Error calculating average rating for product ${productId}:`, error);
      return 0;
    }
  },

  async updateRating(id: string, ratingData: Partial<RatingInput>) {
    try {
      const response = await api.put(`/ratings/${id}`, ratingData);
      return response.data;
    } catch (error) {
      console.error(`Error updating rating ${id}:`, error);
      throw error;
    }
  },

  async deleteRating(id: string) {
    try {
      await api.delete(`/ratings/${id}`);
    } catch (error) {
      console.error(`Error deleting rating ${id}:`, error);
      throw error;
    }
  }
}; 