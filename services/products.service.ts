import { api } from './api';

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  imageSource?: any; // For direct require() image references
  images?: string[];
  category: string;
  condition?: string;
  sellerMessage?: string;
  rating?: number;
  userId?: string;
  sellerName?: string;
  sellerUid?: string;
  rentAvailable?: boolean;
  quantity: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  sellerPhoto?: string;
  sellerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  available?: boolean;
  size?: string | string[];
  location?: string;
  averageRating?: number;
  numReviews?: number;
  // Makeup service fields
  hasMakeupService: boolean;
  makeupPrice?: number;
  makeupDescription?: string;
  makeupDuration?: number | string;
  makeupLocation?: string;
}

export const productsService = {
  async getProducts(): Promise<Product[]> {
    console.log('[productsService.getProducts] Fetching /products');
    try {
      const response = await api.get('/products');
      console.log('[productsService.getProducts] Response:', response);
      return response.data;
    } catch (error) {
      console.error('[productsService.getProducts] Error:', error);
      throw error;
    }
  },

  async getAllProducts(userId?: string, page: number = 1, limit: number = 4): Promise<Product[]> {
    console.log('[productsService.getAllProducts] Fetching /products/all', { userId, page, limit });
    try {
      const response = await api.get('/products/all', { params: { userId, page, limit } });
      console.log('[productsService.getAllProducts] Response:', response);
      return response.data;
    } catch (error) {
      console.error('[productsService.getAllProducts] Error:', error);
      throw error;
    }
  },

  async getProductsByPage(page: number, limit: number, category?: string): Promise<Product[]> {
    console.log('[productsService.getProductsByPage] Fetching /products', { page, limit, category });
    try {
      const response = await api.get('/products', { params: { page, limit, category } });
      console.log('[productsService.getProductsByPage] Response:', response);
      return response.data;
    } catch (error) {
      console.error('[productsService.getProductsByPage] Error:', error);
      throw error;
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    console.log('[productsService.getProductById] Fetching /products/' + id);
    try {
      const response = await api.get(`/products/${id}`);
      console.log('[productsService.getProductById] Response:', response);
      return response.data;
    } catch (error: any) {
      console.error(`[productsService.getProductById] Error:`, error.message || error);
      throw error;
    }
  },

  async getUserProducts() {
    console.log('[productsService.getUserProducts] Fetching /products/my-products');
    try {
      const response = await api.get('/products/my-products');
      console.log('[productsService.getUserProducts] Response:', response);
      return response.data;
    } catch (error) {
      console.error('[productsService.getUserProducts] Error:', error);
      throw error;
    }
  },

  async getMyProducts(userId: string) {
    try {
      const response = await api.get(`/products/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for user ${userId}:`, error);
      throw error;
    }
  },

  async getProductsByCategory(category: string) {
    try {
      const response = await api.get(`/products/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for category ${category}:`, error);
      throw error;
    }
  },

  async createProduct(formData: any): Promise<Product> {
    try {
      // Remove userId and sellerUid from form data if present
      // The backend should assign ownership from the authenticated user
      const { userId, sellerUid, ...cleanFormData } = formData;
      const productData = {
        ...cleanFormData,
        hasMakeupService: cleanFormData.hasMakeupService || false,
        makeupPrice: cleanFormData.makeupPrice,
        makeupDescription: cleanFormData.makeupDescription,
        makeupDuration: cleanFormData.makeupDuration
      };
      console.log('Sending product data to API...', productData);
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await api.get('/products/search', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching products with query "${query}":`, error);
      throw error;
    }
  },
  
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      await api.delete(`/products/${productId}`);
      console.log(`Product ${productId} successfully deleted`);
      return true;
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  },
}; 