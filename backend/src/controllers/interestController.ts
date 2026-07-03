import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';
import { emailService } from '../services/emailService';

// Express Interest (Tenant Only)
export const createInterest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { listingId, message } = req.body;
    const tenantId = req.user?.id;
    const tenantName = req.user?.name || 'Tenant';

    if (!listingId) {
      return res.status(400).json({ message: 'Listing ID is required.' });
    }

    // Check if listing exists
    const listing = await dbService.getCollection('listings').findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listing.ownerId === tenantId) {
      return res.status(400).json({ message: 'You cannot express interest in your own listing!' });
    }

    // Check if interest already exists (prevent duplicate applications)
    const existing = await dbService.getCollection('interests').findOne({ listingId, tenantId });
    if (existing) {
      return res.status(400).json({ message: 'You have already expressed interest in this listing.' });
    }

    const tenantUser = await dbService.getCollection('users').findById(tenantId!);
    const tenantAvatar = tenantUser?.avatar || '';
    const tenantEmail = tenantUser?.email || '';

    const newInterest = await dbService.getCollection('interests').create({
      listingId,
      tenantId,
      tenantName,
      tenantAvatar,
      status: 'pending',
      message: message || "Hey! I'm interested in renting this room."
    });

    // Notify the owner via in-app alert
    await dbService.getCollection('notifications').create({
      userId: listing.ownerId,
      title: 'New Interested Tenant',
      message: `${tenantName} has expressed interest in your room: "${listing.title}".`,
      type: 'interest_request',
      read: false,
      metaData: {
        listingId,
        interestId: newInterest._id,
        tenantId
      }
    });

    // Check compatibility score to determine if real email trigger is required (> 80%)
    const cachedScore = await dbService.getCollection('compatibilityScores').findOne({ tenantId, listingId });
    let score = cachedScore ? cachedScore.score : 75;

    if (!cachedScore) {
      // Calculate a fast fallback score
      const profile = await dbService.getCollection('tenantProfiles').findOne({ userId: tenantId });
      const rent = Number(listing.rent);
      const budget = Number(profile?.budgetMax || 1200);
      const budgetMatch = rent <= budget ? 100 : Math.max(20, Math.round(100 - ((rent - budget) / budget) * 100));
      const tenantLoc = (profile?.preferredLocation || '').toLowerCase().trim();
      const listingLoc = listing.location.toLowerCase().trim();
      const locationMatch = !tenantLoc || listingLoc.includes(tenantLoc) || tenantLoc.includes(listingLoc) ? 100 : 40;
      score = Math.round((budgetMatch + locationMatch) / 2);
    }

    // Fetch owner email details to trigger alert
    const owner = await dbService.getCollection('users').findById(listing.ownerId);
    if (owner && owner.email && score > 80) {
      console.log(`🔥 High compatibility matching detected (${score}%). Dispatching email alert to owner: ${owner.email}`);
      await emailService.sendHighCompatibilityEmail(
        owner.email,
        owner.name,
        tenantName,
        listing.title,
        score,
        message || "Hey! I'm interested in renting this room."
      );
    }

    return res.status(201).json({
      message: 'Interest request submitted successfully!',
      interest: newInterest
    });
  } catch (error) {
    console.error('Error expressing interest:', error);
    return res.status(500).json({ message: 'Error expressing interest' });
  }
};

// Get interests for user
export const getInterests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let interests = [];

    if (role === 'tenant') {
      interests = await dbService.getCollection('interests').find({ tenantId: userId });
      for (const inst of interests) {
        inst.listing = await dbService.getCollection('listings').findById(inst.listingId);
      }
    } else if (role === 'owner') {
      const myListings = await dbService.getCollection('listings').find({ ownerId: userId });
      const myListingIds = myListings.map(l => l._id);

      interests = await dbService.getCollection('interests').find();
      interests = interests.filter(inst => myListingIds.includes(inst.listingId));

      for (const inst of interests) {
        inst.listing = myListings.find(l => l._id === inst.listingId);
      }
    } else if (role === 'admin') {
      interests = await dbService.getCollection('interests').find();
      for (const inst of interests) {
        inst.listing = await dbService.getCollection('listings').findById(inst.listingId);
      }
    }

    return res.json(interests);
  } catch (error) {
    console.error('Error fetching interests:', error);
    return res.status(500).json({ message: 'Error fetching interests' });
  }
};

// Accept / Reject Interest Request (Owner Only)
export const updateInterestStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const interestId = req.params.id;
    const { status } = req.body; // 'accepted' | 'rejected'
    const ownerId = req.user?.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be accepted or rejected.' });
    }

    const interest = await dbService.getCollection('interests').findById(interestId);
    if (!interest) {
      return res.status(404).json({ message: 'Interest request not found.' });
    }

    const listing = await dbService.getCollection('listings').findById(interest.listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Related listing not found.' });
    }

    if (listing.ownerId !== ownerId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to manage this request' });
    }

    // Update status in Mongoose
    const updatedInterest = await dbService.getCollection('interests').findByIdAndUpdate(interestId, { status });

    // Fetch tenant details to trigger status emails
    const tenantUser = await dbService.getCollection('users').findById(interest.tenantId);
    const ownerUser = await dbService.getCollection('users').findById(ownerId!);

    if (tenantUser && tenantUser.email) {
      if (status === 'accepted') {
        console.log(`✉️ Dispatching acceptance email to tenant: ${tenantUser.email}`);
        await emailService.sendAcceptanceEmail(
          tenantUser.email,
          tenantUser.name,
          listing.title,
          ownerUser?.name || 'Owner'
        );
      } else {
        console.log(`✉️ Dispatching decline email to tenant: ${tenantUser.email}`);
        await emailService.sendDeclineEmail(
          tenantUser.email,
          tenantUser.name,
          listing.title,
          ownerUser?.name || 'Owner'
        );
      }
    }

    // Notify the tenant in-app
    await dbService.getCollection('notifications').create({
      userId: interest.tenantId,
      title: `Application ${status === 'accepted' ? 'Accepted!' : 'Declined'}`,
      message: `The owner of "${listing.title}" has ${status} your interest request.`,
      type: 'interest_update',
      read: false,
      metaData: {
        listingId: listing._id,
        interestId,
        status
      }
    });

    // If accepted, automatically initialize/open a chat room
    let chat = null;
    if (status === 'accepted') {
      const owner = await dbService.getCollection('users').findById(ownerId!);
      const tenant = await dbService.getCollection('users').findById(interest.tenantId);

      // Check if chat already exists
      const chats = await dbService.getCollection('chats').find();
      const existingChat = chats.find(c =>
        c.participants.includes(ownerId) && c.participants.includes(interest.tenantId)
      );

      if (existingChat) {
        chat = existingChat;
      } else {
        // Create new chat room
        chat = await dbService.getCollection('chats').create({
          participants: [ownerId!, interest.tenantId],
          participantDetails: [
            { id: ownerId, name: owner?.name || 'Owner', avatar: owner?.avatar || '', role: 'owner' },
            { id: interest.tenantId, name: tenant?.name || 'Tenant', avatar: tenant?.avatar || '', role: 'tenant' }
          ]
        });

        // Seed an automated welcome message
        await dbService.getCollection('messages').create({
          chatId: chat._id,
          senderId: ownerId!,
          text: `Hi ${tenant?.name}! I have accepted your interest request for "${listing.title}". Let's chat here to discuss details!`,
          readBy: [ownerId!]
        });
      }
    }

    return res.json({
      message: `Interest request marked as ${status}.`,
      interest: updatedInterest,
      chat
    });
  } catch (error) {
    console.error('Error updating interest status:', error);
    return res.status(500).json({ message: 'Error updating interest status' });
  }
};
