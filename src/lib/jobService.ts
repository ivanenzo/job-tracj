import { Job as JobType } from '../types/job';
import { auth } from './firebase';

const API_BASE_URL = 'http://localhost:3001/api/jobs';

export class JobService {
  private static async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  static async createJob(jobData: Partial<JobType>): Promise<JobType> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create job');
    }
    
    return response.json();
  }

  static async getJobsByUser(userId: string): Promise<JobType[]> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(API_BASE_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch jobs');
    }
    
    return response.json();
  }

  static async updateJob(jobId: string, updates: Partial<JobType>): Promise<JobType | null> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update job');
    }
    
    return response.json();
  }

  static async deleteJob(jobId: string): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete job');
    }
    
    return true;
  }

  static async updateJobOrder(jobId: string, newOrder: number, newColumn: string): Promise<JobType | null> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order: newOrder, column: newColumn }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update job order');
    }
    
    return response.json();
  }

}