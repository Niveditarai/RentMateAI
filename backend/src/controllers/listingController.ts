import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';

// Create Listing (Owner Only)
export const createListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title, description, rent, location, images,
      roomType, furnishedStatus, amenities, moveInDate, genderPreference
    } = req.body;

    const ownerId = req.user?.id;
    const ownerName = req.user?.name || 'Landlord';

    if (!title || !description || !rent || !location || !roomType || !furnishedStatus || !moveInDate || !genderPreference) {
      return res.status(400).json({ message: 'Missing required listing fields.' });
    }

    // Load user avatar
    const owner = await dbService.getCollection('users').findById(ownerId!);
    const ownerAvatar = owner?.avatar || '';

    // Mocks Cloudinary: If images are provided as Base64, keep them or use default room images
    let listingsImages = images || [];
    if (listingsImages.length === 0) {
      listingsImages = [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'
      ];
    }

    const newListing = await dbService.getCollection('listings').create({
      title,
      description,
      rent: Number(rent),
      location,
      images: listingsImages,
      roomType,
      furnishedStatus,
      amenities: Array.isArray(amenities) ? amenities : [],
      moveInDate,
      genderPreference,
      isFilled: false,
      ownerId,
      ownerName,
      ownerAvatar
    });

    return res.status(201).json({
      message: 'Listing created successfully!',
      listing: newListing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return res.status(500).json({ message: 'Error creating listing' });
  }
};

// Get all listings with filters (Tenants see open listings, Owners see their own listings)
export const getListings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      budget, location, roomType, furnishedStatus, genderPreference, sortBy, ownerId, moveInDate
    } = req.query;

    const query: any = {};

    // Filter by specific Owner if requested (e.g. for owner dashboard)
    if (ownerId) {
      query.ownerId = ownerId.toString();
    } else {
      // Hidden Filled Listings: Tenants only see open listings!
      query.isFilled = false;
    }

    // Fetch listings
    let listings = await dbService.getCollection('listings').find(query);

    // Filter manually for robust JSON-DB + MongoDB compliance
    if (budget) {
      listings = listings.filter(l => l.rent <= Number(budget));
    }
    if (location) {
      const locLower = location.toString().toLowerCase();
      listings = listings.filter(l => l.location.toLowerCase().includes(locLower));
    }
    if (roomType && roomType !== 'Any') {
      listings = listings.filter(l => l.roomType === roomType);
    }
    if (furnishedStatus && furnishedStatus !== 'Any') {
      listings = listings.filter(l => l.furnishedStatus === furnishedStatus);
    }
    if (genderPreference && genderPreference !== 'Any') {
      listings = listings.filter(l => l.genderPreference === genderPreference);
    }
    if (moveInDate) {
      const filterTime = new Date(moveInDate.toString()).getTime();
      if (!isNaN(filterTime)) {
        listings = listings.filter(l => {
          const listingTime = new Date(l.moveInDate).getTime();
          // Room is available if listing availability date is before or on tenant move-in date
          return isNaN(listingTime) || listingTime <= filterTime;
        });
      }
    }

    // Sorting
    if (sortBy === 'newest') {
      listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'rent_low_high') {
      listings.sort((a, b) => a.rent - b.rent);
    } else if (sortBy === 'rent_high_low') {
      listings.sort((a, b) => b.rent - a.rent);
    }

    return res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return res.status(500).json({ message: 'Error fetching listings' });
  }
};

// Get Listing by ID
export const getListingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const listing = await dbService.getCollection('listings').findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    return res.json(listing);
  } catch (error) {
    console.error('Error fetching listing detail:', error);
    return res.status(500).json({ message: 'Error fetching listing detail' });
  }
};

// Update Listing (Owner Only)
export const updateListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const ownerId = req.user?.id;

    const listing = await dbService.getCollection('listings').findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.ownerId !== ownerId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const {
      title, description, rent, location, images,
      roomType, furnishedStatus, amenities, moveInDate, genderPreference
    } = req.body;

    const updatedFields: any = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (rent) updatedFields.rent = Number(rent);
    if (location) updatedFields.location = location;
    if (images) updatedFields.images = images;
    if (roomType) updatedFields.roomType = roomType;
    if (furnishedStatus) updatedFields.furnishedStatus = furnishedStatus;
    if (amenities) updatedFields.amenities = amenities;
    if (moveInDate) updatedFields.moveInDate = moveInDate;
    if (genderPreference) updatedFields.genderPreference = genderPreference;

    const updatedListing = await dbService.getCollection('listings').findByIdAndUpdate(listingId, updatedFields);

    return res.json({
      message: 'Listing updated successfully!',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return res.status(500).json({ message: 'Error updating listing' });
  }
};

// Delete Listing
export const deleteListing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const ownerId = req.user?.id;

    const listing = await dbService.getCollection('listings').findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.ownerId !== ownerId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await dbService.getCollection('listings').findByIdAndDelete(listingId);

    // Clean up associated interests and compatibility scores
    await dbService.getCollection('interests').deleteMany({ listingId });
    await dbService.getCollection('compatibilityScores').deleteMany({ listingId });

    return res.json({ message: 'Listing and related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return res.status(500).json({ message: 'Error deleting listing' });
  }
};

// Toggle Filled Status
export const toggleListingFilled = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const ownerId = req.user?.id;
    const { isFilled } = req.body;

    const listing = await dbService.getCollection('listings').findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.ownerId !== ownerId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedListing = await dbService.getCollection('listings').findByIdAndUpdate(listingId, {
      isFilled: isFilled === undefined ? !listing.isFilled : isFilled
    });

    // Create system notification for all interested tenants
    const interests = await dbService.getCollection('interests').find({ listingId });
    for (const interest of interests) {
      await dbService.getCollection('notifications').create({
        userId: interest.tenantId,
        title: 'Listing Filled Status Update',
        message: `The room listing "${listing.title}" you expressed interest in has been marked as ${updatedListing.isFilled ? 'FILLED' : 'OPEN'}.`,
        type: 'listing_filled',
        read: false,
        metaData: { listingId: listing._id }
      });
    }

    return res.json({
      message: `Listing marked as ${updatedListing.isFilled ? 'filled' : 'open'}.`,
      listing: updatedListing
    });
  } catch (error) {
    console.error('Error toggling filled status:', error);
    return res.status(500).json({ message: 'Error updating filled status' });
  }
};
