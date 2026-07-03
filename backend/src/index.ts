import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbService } from './config/db';
import { registerSchemas } from './models/Schemas';
import { initSocket } from './config/socket';

// Route Imports
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import interestRoutes from './routes/interests';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chats';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';

// Load Env variables
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Initialize express middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Register Mongoose models
registerSchemas();

// Automated collection migration helper from legacy lowercase collections to uppercase
import mongoose from 'mongoose';
const migrateLegacyCollections = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const migrations = [
      { old: 'users', newCol: 'Users' },
      { old: 'listings', newCol: 'Listings' },
      { old: 'interests', newCol: 'InterestRequests' },
      { old: 'chats', newCol: 'Chats' },
      { old: 'messages', newCol: 'Messages' },
      { old: 'compatibilityscores', newCol: 'CompatibilityScores' },
      { old: 'notifications', newCol: 'Notifications' }
    ];

    for (const m of migrations) {
      if (collectionNames.includes(m.old)) {
        const oldCollection = db.collection(m.old);
        const newCollection = db.collection(m.newCol);

        const oldCount = await oldCollection.countDocuments();
        let newCount = 0;
        
        if (collectionNames.includes(m.newCol)) {
          newCount = await newCollection.countDocuments();
        }

        if (oldCount > 0 && newCount === 0) {
          console.log(`📦 Migrating ${oldCount} documents from legacy "${m.old}" to new "${m.newCol}"...`);
          const docs = await oldCollection.find({}).toArray();
          await newCollection.insertMany(docs);
          console.log(`✅ Migrated legacy "${m.old}" successfully!`);

          // Seed separate TenantProfiles collection if migrating users
          if (m.old === 'users') {
            const profileCol = db.collection('TenantProfiles');
            for (const u of docs) {
              if (u.role === 'tenant' && u.preferences) {
                const uIdStr = u._id.toString();
                const exists = await profileCol.findOne({ userId: uIdStr });
                if (!exists) {
                  await profileCol.insertOne({
                    userId: uIdStr,
                    preferredLocation: u.preferences.location || '',
                    budgetMin: 0,
                    budgetMax: u.preferences.budget || 1200,
                    moveInDate: u.preferences.moveInDate || '',
                    roomType: u.preferences.roomType || 'Any',
                    furnished: u.preferences.furnished || 'Any',
                    genderPreference: u.preferences.genderPreference || 'Any',
                    lifestyle: u.preferences.lifestyle || [],
                    createdAt: u.createdAt || new Date(),
                    updatedAt: u.updatedAt || new Date()
                  });
                  console.log(`👤 Extracted TenantProfile for migrated user: ${u.name}`);
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Database migration warning:', err);
  }
};

// Connect to Database (with JSON fallback)
dbService.connect(MONGODB_URI).then(async () => {
  console.log(`📡 Database mode: ${dbService.isFallback() ? 'LOCAL JSON FILE FALLBACK' : 'MONGOOSE MONGODB'}`);
  if (!dbService.isFallback()) {
    await migrateLegacyCollections();
  }
});

// Initialize Socket.io
initSocket(server);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    database: dbService.isFallback() ? 'JSON Fallback' : 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('🏠 RentMate AI API is running...');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Error Handler caught error:', err);
  res.status(500).json({ message: err.message || 'Internal server error occurred' });
});

// Start listening
server.listen(PORT, () => {
  console.log(`🚀 Server running on port http://localhost:${PORT}`);
});
