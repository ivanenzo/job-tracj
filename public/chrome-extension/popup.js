// JobTracker CRM Extension Popup Script
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpSfRN2QKnijZZeaEJD73w5x2FJdXV450",
  authDomain: "tracker-job-c8374.firebaseapp.com",
  projectId: "tracker-job-c8374",
  storageBucket: "tracker-job-c8374.firebasestorage.app",
  messagingSenderId: "160455990557",
  appId: "1:160455990557:web:327a9d7db67b96227455f4",
  measurementId: "G-NCDS33LE08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_BASE = 'http://localhost:3001'; // Change to your deployed URL

class JobTrackerPopup {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.checkAuthStatus();
  }

  initializeElements() {
    this.loginForm = document.getElementById('loginForm');
    this.jobForm = document.getElementById('jobForm');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.loginBtn = document.getElementById('loginBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.statusDiv = document.getElementById('status');
    
    this.companyInput = document.getElementById('company');
    this.positionInput = document.getElementById('position');
    this.locationInput = document.getElementById('location');
    this.salaryInput = document.getElementById('salary');
    this.notesInput = document.getElementById('notes');
  }

  attachEventListeners() {
    this.loginBtn.addEventListener('click', () => this.handleLogin());
    this.logoutBtn.addEventListener('click', () => this.handleLogout());
    this.saveBtn.addEventListener('click', () => this.saveJobToCRM());
    
    // Enter key login
    this.passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  async checkAuthStatus() {
    try {
      // Check if user is already authenticated with Firebase
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User is signed in, get the ID token
          const token = await user.getIdToken();
          await chrome.storage.local.set({
            authToken: token,
            userEmail: user.email,
            userId: user.uid
          });
          this.showJobForm();
          await this.extractJobData();
        } else {
          // User is signed out
          await chrome.storage.local.remove(['authToken', 'userEmail', 'userId']);
          this.showLoginForm();
        }
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.showLoginForm();
    }
  }

  showLoginForm() {
    this.loginForm.style.display = 'block';
    this.jobForm.style.display = 'none';
  }

  showJobForm() {
    this.loginForm.style.display = 'none';
    this.jobForm.style.display = 'block';
  }

  showStatus(message, type = 'success') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    this.statusDiv.style.display = 'block';
    
    setTimeout(() => {
      this.statusDiv.style.display = 'none';
    }, 3000);
  }

  async handleLogin() {
    const email = this.emailInput.value;
    const password = this.passwordInput.value;

    if (!email || !password) {
      this.showStatus('Please enter email and password', 'error');
      return;
    }

    this.loginBtn.disabled = true;
    this.loginBtn.textContent = 'Signing in...';

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      
      // Store authentication data
      await chrome.storage.local.set({
        authToken: token,
        userEmail: user.email,
        userId: user.uid
      });

      this.showJobForm();
      this.showStatus('Successfully signed in!');
      await this.extractJobData();
      
    } catch (error) {
      console.error('Login error:', error);
      this.showStatus('Login failed: ' + error.message, 'error');
    } finally {
      this.loginBtn.disabled = false;
      this.loginBtn.textContent = 'Sign In';
    }
  }

  async handleLogout() {
    try {
      await auth.signOut();
      await chrome.storage.local.remove(['authToken', 'userEmail', 'userId']);
      this.showLoginForm();
      this.clearForm();
    } catch (error) {
      console.error('Logout error:', error);
      this.showStatus('Logout failed', 'error');
    }
  }

  clearForm() {
    this.companyInput.value = '';
    this.positionInput.value = '';
    this.locationInput.value = '';
    this.salaryInput.value = '';
    this.notesInput.value = '';
  }

  async extractJobData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Basic job data extraction from common job sites
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Try to extract job information from the page
          const getTextContent = (selectors) => {
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) return element.textContent.trim();
            }
            return '';
          };

          // Common selectors for job sites
          const company = getTextContent([
            '[data-testid="inlineHeader-companyName"]', // LinkedIn
            '.jobsearch-InlineCompanyRating a', // Indeed
            '.employer-name', // Glassdoor
            '.company-name',
            '.employer',
            '[class*="company"]',
            'h1 + div', // Generic fallback
          ]);

          const position = getTextContent([
            '[data-testid="job-title"]', // LinkedIn
            '.jobsearch-JobInfoHeader-title', // Indeed
            '.job-title',
            'h1',
            '[class*="title"]',
            '[class*="position"]'
          ]);

          const location = getTextContent([
            '[data-testid="job-location"]', // LinkedIn
            '.jobsearch-JobInfoHeader-subtitle div', // Indeed
            '.location',
            '[class*="location"]'
          ]);

          const salary = getTextContent([
            '[data-testid="salary-range"]', // LinkedIn
            '.jobsearch-JobMetadataHeader-item', // Indeed
            '.salary',
            '[class*="salary"]',
            '[class*="compensation"]'
          ]);

          return {
            company: company || '',
            position: position || '',
            location: location || '',
            salary: salary || '',
            url: window.location.href
          };
        }
      });

      if (results && results[0] && results[0].result) {
        const jobData = results[0].result;
        this.companyInput.value = jobData.company;
        this.positionInput.value = jobData.position;
        this.locationInput.value = jobData.location;
        this.salaryInput.value = jobData.salary;
      }
    } catch (error) {
      console.error('Error extracting job data:', error);
    }
  }

  async saveJobToCRM() {
    const company = this.companyInput.value;
    const position = this.positionInput.value;

    if (!company || !position) {
      this.showStatus('Company and position are required', 'error');
      return;
    }

    this.saveBtn.disabled = true;
    this.saveBtn.textContent = 'Saving...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.storage.local.get(['authToken', 'userId']);

      if (!result.authToken || !result.userId) {
        this.showStatus('Please sign in first', 'error');
        this.showLoginForm();
        return;
      }

      const jobData = {
        company: company,
        position: position,
        location: this.locationInput.value,
        salary: this.salaryInput.value,
        notes: this.notesInput.value,
        fromUrl: tab.url,
        source: 'extension',
        appliedDate: new Date().toISOString(),
        status: 'applied',
        userId: result.userId
      };

      // Send to MongoDB API
      const response = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.authToken}`
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        const savedJob = await response.json();
        this.showStatus('Job saved to CRM successfully!');
        this.clearForm();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save job');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      this.showStatus('Failed to save job to CRM: ' + error.message, 'error');
    } finally {
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = 'Save to CRM';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new JobTrackerPopup();
});