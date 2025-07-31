// API endpoint to receive job data from Chrome extension
import Job from '../models/Job';
import connectDB from '../lib/mongodb';

export async function createJobFromExtension(jobData: any, userId: string) {
  try {
    await connectDB(); // Ensure database connection
    
    const newJob = new Job({
      ...jobData,
      userId,
      events: [],
      source: 'extension'
    });

    const savedJob = await newJob.save();
    return { success: true, id: savedJob._id };
  } catch (error) {
    console.error('Error creating job from extension:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}

// CORS handler for Chrome extension
export function enableCORS() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}