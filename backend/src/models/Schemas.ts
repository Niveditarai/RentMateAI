import mongoose from 'mongoose';

// 1. User Schema (Credentials & Meta)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['tenant', 'owner', 'admin'], default: 'tenant', index: true },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: '' },
  otpExpires: { type: Date }
}, { collection: 'Users', timestamps: true });

// 2. Tenant Profile Schema (Separated for Relational Design)
const TenantProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  preferredLocation: { type: String, default: '', index: true },
  budgetMin: { type: Number, default: 0 },
  budgetMax: { type: Number, default: 1200, index: true },
  moveInDate: { type: String, default: '' },
  roomType: { type: String, default: 'Any' },
  furnished: { type: String, default: 'Any' },
  genderPreference: { type: String, default: 'Any' },
  lifestyle: { type: [String], default: [] }
}, { collection: 'TenantProfiles', timestamps: true });

// 3. Listing Schema
const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  rent: { type: Number, required: true, index: true },
  location: { type: String, required: true, index: true },
  images: { type: [String], default: [] },
  roomType: { type: String, required: true },
  furnishedStatus: { type: String, required: true },
  amenities: { type: [String], default: [] },
  moveInDate: { type: String, required: true },
  genderPreference: { type: String, required: true },
  isFilled: { type: Boolean, default: false, index: true },
  ownerId: { type: String, required: true, index: true },
  ownerName: { type: String, required: true },
  ownerAvatar: { type: String, default: '' }
}, { collection: 'Listings', timestamps: true });

// 4. Interest Request Schema (Application Pipeline)
const InterestRequestSchema = new mongoose.Schema({
  listingId: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  tenantName: { type: String, required: true },
  tenantAvatar: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  message: { type: String, default: '' }
}, { collection: 'InterestRequests', timestamps: true });

// Ensure unique compound index to prevent duplicate application requests
InterestRequestSchema.index({ tenantId: 1, listingId: 1 }, { unique: true });

// 5. Chat Schema
const ChatSchema = new mongoose.Schema({
  participants: { type: [String], required: true, index: true },
  participantDetails: [{
    id: String,
    name: String,
    avatar: String,
    role: String
  }]
}, { collection: 'Chats', timestamps: true });

// 6. Message Schema
const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  text: { type: String, required: true },
  readBy: { type: [String], default: [] }
}, { collection: 'Messages', timestamps: true });

// 7. Compatibility Score Schema (Rank Cache)
const CompatibilityScoreSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  listingId: { type: String, required: true, index: true },
  score: { type: Number, required: true, index: true },
  explanation: { type: String, required: true },
  breakdown: {
    budget: Number,
    location: Number,
    moveIn: Number,
    roomType: Number,
    gender: Number
  }
}, { collection: 'CompatibilityScores', timestamps: true });

// Ensure unique compound index to cache matches uniquely per listing
CompatibilityScoreSchema.index({ tenantId: 1, listingId: 1 }, { unique: true });

// 8. Notification Schema
const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  metaData: { type: Map, of: String }
}, { collection: 'Notifications', timestamps: true });

// Register models if not already registered
export const registerSchemas = () => {
  const models = [
    { name: 'Users', schema: UserSchema },
    { name: 'TenantProfiles', schema: TenantProfileSchema },
    { name: 'Listings', schema: ListingSchema },
    { name: 'InterestRequests', schema: InterestRequestSchema },
    { name: 'Chats', schema: ChatSchema },
    { name: 'Messages', schema: MessageSchema },
    { name: 'CompatibilityScores', schema: CompatibilityScoreSchema },
    { name: 'Notifications', schema: NotificationSchema }
  ];

  models.forEach(m => {
    if (!mongoose.models[m.name]) {
      mongoose.model(m.name, m.schema);
    }
  });
};
