import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';
import bcrypt from 'bcryptjs';

// Get current user profile details
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await dbService.getCollection('users').findById(userId!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, otp, ...cleanUser } = user;
    
    // Fetch preferences from separate TenantProfiles table if role is tenant
    let preferences = null;
    if (user.role === 'tenant') {
      const profile = await dbService.getCollection('tenantProfiles').findOne({ userId });
      if (profile) {
        preferences = {
          budget: profile.budgetMax,
          location: profile.preferredLocation,
          moveInDate: profile.moveInDate,
          roomType: profile.roomType,
          lifestyle: profile.lifestyle,
          furnished: profile.furnished,
          genderPreference: profile.genderPreference
        };
      }
    }

    return res.json({
      ...cleanUser,
      preferences
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile details & preferences
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, avatar, preferences } = req.body;

    const updatedFields: any = {};
    if (name) updatedFields.name = name;
    if (avatar) updatedFields.avatar = avatar;

    if (name || avatar) {
      await dbService.getCollection('users').findByIdAndUpdate(userId!, updatedFields);
    }

    let finalPreferences = null;

    if (preferences) {
      // Find or create tenant profile
      const profile = await dbService.getCollection('tenantProfiles').findOne({ userId });
      const profileUpdate = {
        preferredLocation: preferences.location !== undefined ? preferences.location : profile?.preferredLocation,
        budgetMax: preferences.budget !== undefined ? Number(preferences.budget) : profile?.budgetMax,
        moveInDate: preferences.moveInDate !== undefined ? preferences.moveInDate : profile?.moveInDate,
        roomType: preferences.roomType !== undefined ? preferences.roomType : profile?.roomType,
        furnished: preferences.furnished !== undefined ? preferences.furnished : profile?.furnished,
        genderPreference: preferences.genderPreference !== undefined ? preferences.genderPreference : profile?.genderPreference,
        lifestyle: preferences.lifestyle !== undefined ? preferences.lifestyle : profile?.lifestyle || []
      };

      if (profile) {
        await dbService.getCollection('tenantProfiles').updateOne({ userId }, profileUpdate);
      } else {
        await dbService.getCollection('tenantProfiles').create({
          userId,
          ...profileUpdate
        });
      }

      finalPreferences = {
        budget: profileUpdate.budgetMax,
        location: profileUpdate.preferredLocation,
        moveInDate: profileUpdate.moveInDate,
        roomType: profileUpdate.roomType,
        lifestyle: profileUpdate.lifestyle,
        furnished: profileUpdate.furnished,
        genderPreference: profileUpdate.genderPreference
      };

      // Delete compatibility scores cached for this user, as preferences have changed!
      await dbService.getCollection('compatibilityScores').deleteMany({ tenantId: userId! });
    } else {
      // Load current preferences if not updated
      const profile = await dbService.getCollection('tenantProfiles').findOne({ userId });
      if (profile) {
        finalPreferences = {
          budget: profile.budgetMax,
          location: profile.preferredLocation,
          moveInDate: profile.moveInDate,
          roomType: profile.roomType,
          lifestyle: profile.lifestyle,
          furnished: profile.furnished,
          genderPreference: profile.genderPreference
        };
      }
    }

    const updatedUser = await dbService.getCollection('users').findById(userId!);
    const { password, otp, ...cleanUser } = updatedUser;

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        ...cleanUser,
        preferences: finalPreferences
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Error updating profile' });
  }
};

// Change Password
export const updatePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new passwords' });
    }

    const user = await dbService.getCollection('users').findById(userId!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await dbService.getCollection('users').findByIdAndUpdate(userId!, { password: hashedPassword });

    return res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Error updating password' });
  }
};

// Delete account
export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await dbService.getCollection('users').findById(userId!);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await dbService.getCollection('users').findByIdAndDelete(userId!);

    // Clean up owner properties
    if (user.role === 'owner') {
      const myListings = await dbService.getCollection('listings').find({ ownerId: userId });
      for (const listing of myListings) {
        await dbService.getCollection('listings').findByIdAndDelete(listing._id);
        await dbService.getCollection('interests').deleteMany({ listingId: listing._id });
        await dbService.getCollection('compatibilityScores').deleteMany({ listingId: listing._id });
      }
    }

    // Clean up tenant details
    if (user.role === 'tenant') {
      await dbService.getCollection('interests').deleteMany({ tenantId: userId });
      await dbService.getCollection('compatibilityScores').deleteMany({ tenantId: userId });
      await dbService.getCollection('tenantProfiles').deleteMany({ userId });
    }

    await dbService.getCollection('notifications').deleteMany({ userId });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Error deleting account' });
  }
};
