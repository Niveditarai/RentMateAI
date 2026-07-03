import mongoose from 'mongoose';

class DBManager {
  private isConnected: boolean = false;

  // Connect to MongoDB Atlas or local instance
  public async connect(mongoUri?: string): Promise<boolean> {
    // Default fallback to local MongoDB if environment variable is not defined
    const uri = mongoUri || 'mongodb://localhost:27017/rentmate';

    try {
      console.log('🔄 Attempting connection to MongoDB Atlas/Instance...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ Connected successfully to MongoDB!');
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ MongoDB Connection Error:', (error as Error).message);
      this.isConnected = false;
      throw new Error(`Database connection failed: ${(error as Error).message}`);
    }
  }

  // Generic collection wrapper to keep controllers fully operational with Mongoose under the hood
  public getCollection(collectionName: string) {
    const modelName = this.mapCollectionToModel(collectionName);

    return {
      find: async (query?: any): Promise<any[]> => {
        const model = mongoose.model(modelName);
        return await model.find(query || {}).lean();
      },

      findOne: async (query: any): Promise<any | null> => {
        const model = mongoose.model(modelName);
        return await model.findOne(query).lean();
      },

      findById: async (id: string): Promise<any | null> => {
        const model = mongoose.model(modelName);
        return await model.findById(id).lean();
      },

      create: async (data: any): Promise<any> => {
        const model = mongoose.model(modelName);
        const doc = new model(data);
        await doc.save();
        return doc.toObject();
      },

      findByIdAndUpdate: async (id: string, update: any, options: { new?: boolean } = { new: true }): Promise<any | null> => {
        const model = mongoose.model(modelName);
        // Normalize update operators to comply with Mongoose
        let actualUpdate = update;
        if (!update.$set && !update.$push && !update.$pull && !update.$unset) {
          actualUpdate = { $set: update };
        }
        return await model.findByIdAndUpdate(id, actualUpdate, options).lean();
      },

      updateOne: async (query: any, update: any): Promise<any> => {
        const model = mongoose.model(modelName);
        let actualUpdate = update;
        if (!update.$set && !update.$push && !update.$pull && !update.$unset) {
          actualUpdate = { $set: update };
        }
        return await model.updateOne(query, actualUpdate);
      },

      findByIdAndDelete: async (id: string): Promise<any | null> => {
        const model = mongoose.model(modelName);
        return await model.findByIdAndDelete(id).lean();
      },

      deleteMany: async (query: any): Promise<{ deletedCount: number }> => {
        const model = mongoose.model(modelName);
        const res = await model.deleteMany(query);
        return { deletedCount: res.deletedCount || 0 };
      }
    };
  }

  // Maps legacy lowercase collection keys to Mongoose registered model names
  private mapCollectionToModel(collection: string): string {
    const mappings: { [key: string]: string } = {
      users: 'Users',
      listings: 'Listings',
      interests: 'InterestRequests',
      tenantProfiles: 'TenantProfiles',
      chats: 'Chats',
      messages: 'Messages',
      compatibilityScores: 'CompatibilityScores',
      notifications: 'Notifications'
    };

    return mappings[collection] || collection;
  }

  public isFallback() {
    // We migrated 100% to MongoDB, fallback JSON db is completely disabled
    return false;
  }
}

export const dbService = new DBManager();
