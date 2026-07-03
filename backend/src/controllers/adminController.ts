import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';

// Get Admin Platform Stats
export const getAdminStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await dbService.getCollection('users').find();
    const listings = await dbService.getCollection('listings').find();
    const interests = await dbService.getCollection('interests').find();

    const tenantCount = users.filter(u => u.role === 'tenant').length;
    const ownerCount = users.filter(u => u.role === 'owner').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    const filledListingsCount = listings.filter(l => l.isFilled).length;
    const openListingsCount = listings.filter(l => !l.isFilled).length;

    // Build dynamic mock charts for activity feed (monthly signups & applications)
    const monthlyRegistrations = [
      { name: 'Jan', value: 12 },
      { name: 'Feb', value: 19 },
      { name: 'Mar', value: 32 },
      { name: 'Apr', value: 48 },
      { name: 'May', value: 65 },
      { name: 'Jun', value: tenantCount + ownerCount } // current count
    ];

    const monthlyApplications = [
      { name: 'Jan', value: 8 },
      { name: 'Feb', value: 14 },
      { name: 'Mar', value: 25 },
      { name: 'Apr', value: 37 },
      { name: 'May', value: 50 },
      { name: 'Jun', value: interests.length }
    ];

    return res.json({
      counts: {
        totalUsers: users.length,
        tenants: tenantCount,
        owners: ownerCount,
        admins: adminCount,
        totalListings: listings.length,
        openListings: openListingsCount,
        filledListings: filledListingsCount,
        totalInterests: interests.length
      },
      charts: {
        registrations: monthlyRegistrations,
        applications: monthlyApplications
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ message: 'Error fetching stats' });
  }
};

// Get all users
export const getAdminUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await dbService.getCollection('users').find();
    // Exclude passwords
    const cleanUsers = users.map(u => {
      const { password, otp, ...clean } = u;
      return clean;
    });
    return res.json(cleanUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

// Delete user
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;

    if (userId === req.user?.id) {
      return res.status(400).json({ message: 'You cannot delete yourself, admin!' });
    }

    const user = await dbService.getCollection('users').findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await dbService.getCollection('users').findByIdAndDelete(userId);

    // Clean up listings if user is owner
    if (user.role === 'owner') {
      const myListings = await dbService.getCollection('listings').find({ ownerId: userId });
      for (const listing of myListings) {
        await dbService.getCollection('listings').findByIdAndDelete(listing._id);
        await dbService.getCollection('interests').deleteMany({ listingId: listing._id });
        await dbService.getCollection('compatibilityScores').deleteMany({ listingId: listing._id });
      }
    }

    // Clean up interests if user is tenant
    if (user.role === 'tenant') {
      await dbService.getCollection('interests').deleteMany({ tenantId: userId });
      await dbService.getCollection('compatibilityScores').deleteMany({ tenantId: userId });
      await dbService.getCollection('tenantProfiles').deleteMany({ userId });
    }

    // Clean up notification messages
    await dbService.getCollection('notifications').deleteMany({ userId });

    return res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};
