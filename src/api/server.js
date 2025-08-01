import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { auth } from '../lib/firebase.js';

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sajidhussain9430:Sajid943031@cluster0.s8oiuzg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'chrome-extension://*'],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Job Schema
const JobEventSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  date: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['applied', 'interview', 'email', 'call', 'offer', 'rejection', 'other'],
    required: true 
  },
  notes: { type: String }
});

const JobSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  appliedDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['applied', 'interview', 'offer', 'rejected', 'pending'],
    default: 'applied'
  },
  source: { 
    type: String, 
    enum: ['extension', 'manual'],
    default: 'manual'
  },
  fromUrl: { type: String },
  salary: { type: String },
  location: { type: String },
  notes: { type: String },
  events: [JobEventSchema],
  userId: { type: String, required: true },
  order: { type: Number, default: 0 },
  column: { type: String, default: 'applied' }
}, {
  timestamps: true
});

const Job = mongoose.model('Job', JobSchema);

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes

// Get all jobs for a user
app.get('/api/jobs', verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    const formattedJobs = jobs.map(job => ({
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
    }));
    res.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Create a new job
app.post('/api/jobs', verifyToken, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      userId: req.user.uid,
      events: req.body.events || []
    };

    const job = new Job(jobData);
    const savedJob = await job.save();

    const formattedJob = {
      id: savedJob._id.toString(),
      company: savedJob.company,
      position: savedJob.position,
      appliedDate: savedJob.appliedDate,
      status: savedJob.status,
      source: savedJob.source,
      fromUrl: savedJob.fromUrl,
      salary: savedJob.salary,
      location: savedJob.location,
      notes: savedJob.notes,
      events: savedJob.events || [],
      userId: savedJob.userId,
      createdAt: savedJob.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: savedJob.updatedAt?.toISOString() || new Date().toISOString(),
      order: savedJob.order || 0,
      column: savedJob.column || savedJob.status
    };

    res.status(201).json(formattedJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Update a job
app.put('/api/jobs/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: id, userId: req.user.uid },
      updates,
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const formattedJob = {
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

    res.json(formattedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// Delete a job
app.delete('/api/jobs/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findOneAndDelete({ _id: id, userId: req.user.uid });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;