import { Job as JobType } from '../types/job';

const API_BASE_URL = '/api/jobs';

export class JobService {
  static async createJob(jobData: Partial<JobType>): Promise<JobType> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch(`${API_BASE_URL}?userId=${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch jobs');
    }
    
    return response.json();
  }

  static async updateJob(jobId: string, updates: Partial<JobType>): Promise<JobType | null> {
    const response = await fetch(`${API_BASE_URL}/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch(`${API_BASE_URL}/${jobId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete job');
    }
    
    return true;
  }

  static async updateJobOrder(jobId: string, newOrder: number, newColumn: string): Promise<JobType | null> {
    const response = await fetch(`${API_BASE_URL}/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order: newOrder, column: newColumn }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update job order');
    }
    
    return response.json();
  }

  private static formatJob(job: any): JobType {
    return {
      id: job._id.toString(),
      company: job.company,
      position: job.position,
      appliedDate: job.appliedDate,
      status: job.status,
      source: job.source,
      fromUrl: job.fromUrl,
      salary: job.salary,
      location: job.location,
      notes: job.notes,
      events: job.events || [],
      userId: job.userId,
      createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: job.updatedAt?.toISOString() || new Date().toISOString(),
      order: job.order || 0,
      column: job.column || job.status
    };
  }
}