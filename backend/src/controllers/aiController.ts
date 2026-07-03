import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rule-Based Fallback Calculation
const calculateRuleBasedMatch = (tenant: any, listing: any) => {
  const breakdown = {
    budget: 100,
    location: 50,
    moveIn: 80,
    roomType: 100,
    gender: 100
  };

  // 1. Budget Match
  const rent = Number(listing.rent);
  const budget = Number(tenant.preferences?.budget || 1200);
  if (rent <= budget) {
    breakdown.budget = 100;
  } else {
    // Deduct score based on how much it exceeds budget
    const over = rent - budget;
    breakdown.budget = Math.max(20, Math.round(100 - (over / budget) * 100));
  }

  // 2. Location Match
  const tenantLoc = (tenant.preferences?.location || '').toLowerCase().trim();
  const listingLoc = (listing.location || '').toLowerCase().trim();
  if (!tenantLoc) {
    breakdown.location = 90; // Default if no preference
  } else if (listingLoc.includes(tenantLoc) || tenantLoc.includes(listingLoc)) {
    breakdown.location = 100;
  } else {
    breakdown.location = 40;
  }

  // 3. Room Type Match
  const tenantRoom = tenant.preferences?.roomType || 'Any';
  const listingRoom = listing.roomType || '';
  if (tenantRoom === 'Any' || tenantRoom.toLowerCase() === listingRoom.toLowerCase()) {
    breakdown.roomType = 100;
  } else {
    breakdown.roomType = 30;
  }

  // 4. Gender Match
  const listingGender = (listing.genderPreference || 'Any').toLowerCase();
  // Assume tenant's profile might have gender, default to Any
  const tenantGender = (tenant.gender || 'Any').toLowerCase();
  if (listingGender === 'any' || tenantGender === 'any' || listingGender === tenantGender) {
    breakdown.gender = 100;
  } else {
    breakdown.gender = 0;
  }

  // Calculate Average Score
  const score = Math.round(
    (breakdown.budget + breakdown.location + breakdown.moveIn + breakdown.roomType + breakdown.gender) / 5
  );

  let explanation = '';
  if (score >= 85) {
    explanation = `Excellent Match! The rent ($${rent}/mo) fits comfortably within your $${budget} budget. The room in ${listing.location} aligns perfectly with your location preferences, and the room type (${listingRoom}) matches what you want.`;
  } else if (score >= 60) {
    explanation = `Good Match. The budget is a reasonable fit ($${rent} vs preference $${budget}). There is a slight mismatch in either room type or location, but it remains a strong candidate.`;
  } else {
    explanation = `Moderate/Low Match. The listing rent ($${rent}/mo) is above your preferred budget of $${budget}, or there is a misalignment in location (${listing.location}) and room configurations.`;
  }

  return {
    score,
    breakdown,
    explanation
  };
};

// Compute Compatibility
export const computeCompatibility = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { listingId } = req.body;
    const tenantId = req.user?.id;

    if (!listingId) {
      return res.status(400).json({ message: 'Listing ID is required.' });
    }

    const tenant = await dbService.getCollection('users').findById(tenantId!);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    const profile = await dbService.getCollection('tenantProfiles').findOne({ userId: tenantId });
    const tenantWithPrefs = {
      ...tenant,
      gender: tenant.gender || 'Any',
      preferences: profile ? {
        budget: profile.budgetMax,
        location: profile.preferredLocation,
        moveInDate: profile.moveInDate,
        roomType: profile.roomType,
        lifestyle: profile.lifestyle,
        furnished: profile.furnished,
        genderPreference: profile.genderPreference
      } : {
        budget: 1200,
        location: '',
        moveInDate: '',
        roomType: 'Any',
        lifestyle: [],
        furnished: 'Any',
        genderPreference: 'Any'
      }
    };

    const listing = await dbService.getCollection('listings').findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Check if score is already computed and stored in DB
    const existingScore = await dbService.getCollection('compatibilityScores').findOne({ tenantId, listingId });
    if (existingScore) {
      return res.json(existingScore);
    }

    // Try AI Compatibility calculations
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        console.log('🤖 Invoking Gemini AI Compatibility Engine...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
          You are RentMate AI's matching specialist.
          Compare the Tenant's profile with the Room Listing.

          Tenant Preferences:
          - Budget: $${tenantWithPrefs.preferences?.budget || 1200}/month
          - Preferred Location: ${tenantWithPrefs.preferences?.location || 'Any'}
          - Preferred Room Type: ${tenantWithPrefs.preferences?.roomType || 'Any'}
          - Preferred Furnished Status: ${tenantWithPrefs.preferences?.furnished || 'Any'}
          - Lifestyle Hobbies: ${tenantWithPrefs.preferences?.lifestyle?.join(', ') || 'Not specified'}

          Room Listing Details:
          - Rent: $${listing.rent}/month
          - Location: ${listing.location}
          - Room Type: ${listing.roomType}
          - Furnished Status: ${listing.furnishedStatus}
          - Amenities: ${listing.amenities?.join(', ') || 'None'}
          - Gender Preference: ${listing.genderPreference}

          Output a JSON object ONLY. Do not wrap in markdown \`\`\`json blocks.
          The JSON must contain these exact keys:
          {
            "score": <number between 0 and 100>,
            "explanation": "<friendly, clear, premium conversational explanation of why they match, referencing details>",
            "breakdown": {
              "budget": <0-100 matching score>,
              "location": <0-100 matching score>,
              "moveIn": <0-100 matching score>,
              "roomType": <0-100 matching score>,
              "gender": <0-100 matching score>
            }
          }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        // Clean up markdown wrapping if Gemini includes it anyway
        let cleanJsonStr = responseText;
        if (cleanJsonStr.startsWith('```json')) {
          cleanJsonStr = cleanJsonStr.substring(7);
        }
        if (cleanJsonStr.endsWith('```')) {
          cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
        }
        cleanJsonStr = cleanJsonStr.trim();

        const matchResult = JSON.parse(cleanJsonStr);

        // Store score in DB
        const savedScore = await dbService.getCollection('compatibilityScores').create({
          tenantId,
          listingId,
          score: Number(matchResult.score),
          explanation: matchResult.explanation,
          breakdown: matchResult.breakdown
        });

        console.log(`🤖 Gemini successfully computed score: ${matchResult.score}%`);
        return res.json(savedScore);

      } catch (aiError) {
        console.error('⚠️ Gemini API matching failed, triggering fallback engine:', (aiError as Error).message);
      }
    }

    // Fallback: Rule-Based Match
    console.log('⚙️ Executing Rule-Based Fallback Matching Engine...');
    const fallbackResult = calculateRuleBasedMatch(tenantWithPrefs, listing);

    const savedScore = await dbService.getCollection('compatibilityScores').create({
      tenantId,
      listingId,
      score: fallbackResult.score,
      explanation: fallbackResult.explanation,
      breakdown: fallbackResult.breakdown
    });

    return res.json(savedScore);
  } catch (error) {
    console.error('General compatibility error:', error);
    return res.status(500).json({ message: 'Error calculating match compatibility' });
  }
};
