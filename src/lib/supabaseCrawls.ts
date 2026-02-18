import { supabase } from '@/src/config/supabase';
import { Crawl, CrawlUpdate, DrinkType } from '@/types';

/**
 * Creates a new crawl in the Supabase database
 */
export const createCrawl = async (crawl: Crawl): Promise<{ crawlId: string } | null> => {
  try {
    console.log('[CreateCrawl] Starting for crawl:', crawl.id);

    // Count drinks by type
    const drinkCounts = {
      shots: 0,
      beers: 0,
      cocktails: 0,
      wines: 0,
      seltzers: 0,
    };

    crawl.drinks.forEach((drink) => {
      const type = drink.type.toLowerCase();
      if (type === 'shot') drinkCounts.shots++;
      else if (type === 'beer') drinkCounts.beers++;
      else if (type === 'cocktail') drinkCounts.cocktails++;
      else if (type === 'wine') drinkCounts.wines++;
      else if (type === 'seltzer') drinkCounts.seltzers++;
    });

    // Prepare crawl data for database
    const crawlData = {
      user_id: crawl.userId,
      title: crawl.title || '',
      caption: crawl.caption || null,
      city: crawl.city || null,
      start_time: new Date(crawl.startTime).toISOString(),
      end_time: new Date(crawl.endTime).toISOString(),
      status: 'completed',
      total_drinks: crawl.drinksCount,
      shots: drinkCounts.shots,
      beers: drinkCounts.beers,
      cocktails: drinkCounts.cocktails,
      wines: drinkCounts.wines,
      seltzers: drinkCounts.seltzers,
      total_bars: crawl.barsHit.length,
      total_miles: crawl.milesWalked,
      route_coordinates: crawl.route, // JSONB column
    };

    console.log('[CreateCrawl] Inserting crawl data...');
    const { data: crawlRecord, error: crawlError } = await supabase
      .from('crawls')
      .insert(crawlData)
      .select()
      .single();

    if (crawlError) {
      console.error('[CreateCrawl] Error:', crawlError);
      throw crawlError;
    }

    console.log('[CreateCrawl] Crawl created successfully!', crawlRecord.id);

    // Create post for the crawl
    console.log('[CreateCrawl] Creating post...');
    const { data: postRecord, error: postError } = await supabase
      .from('posts')
      .insert({
        crawl_id: crawlRecord.id,
        user_id: crawl.userId,
      })
      .select()
      .single();

    if (postError) {
      console.error('[CreateCrawl] Error creating post:', postError);
      throw postError;
    }

    console.log('[CreateCrawl] Post created successfully!', postRecord.id);

    // Upload pictures if there are any updates
    if (crawl.updates && crawl.updates.length > 0) {
      console.log('[CreateCrawl] Uploading pictures...');
      await uploadCrawlPictures(crawlRecord.id, crawl.userId, crawl.updates);
    }

    return { crawlId: crawlRecord.id };
  } catch (error) {
    console.error('[CreateCrawl] Failed:', error);
    return null;
  }
};

/**
 * Uploads crawl pictures to Supabase storage and creates picture records
 */
export const uploadCrawlPictures = async (
  crawlId: string,
  userId: string,
  updates: CrawlUpdate[]
): Promise<boolean> => {
  try {
    console.log('[UploadPictures] Uploading', updates.length, 'pictures for crawl:', crawlId);

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      // Upload image to Supabase Storage
      const fileName = `${crawlId}/${update.id}.jpg`;
      const filePath = update.photoUri;

      // Read file as blob (for React Native, we need to fetch it)
      const response = await fetch(filePath);
      const blob = await response.blob();

      console.log('[UploadPictures] Uploading file:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('crawl-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('[UploadPictures] Upload error:', uploadError);
        // Continue with next image even if one fails
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crawl-photos')
        .getPublicUrl(fileName);

      // Create picture record in database
      const pictureData = {
        crawl_id: crawlId,
        user_id: userId,
        image_url: publicUrl,
        latitude: update.location?.latitude || null,
        longitude: update.location?.longitude || null,
        drink_type: update.drinkType || null,
        included_in_post: true,
        carousel_order: i,
        taken_at: new Date(update.timestamp).toISOString(),
      };

      const { error: pictureError } = await supabase
        .from('pictures')
        .insert(pictureData);

      if (pictureError) {
        console.error('[UploadPictures] Picture record error:', pictureError);
        // Continue with next image
        continue;
      }

      console.log('[UploadPictures] Picture uploaded successfully:', fileName);
    }

    console.log('[UploadPictures] All pictures processed');
    return true;
  } catch (error) {
    console.error('[UploadPictures] Failed:', error);
    return false;
  }
};

/**
 * Fetches recent crawls from the feed
 */
export const getFeedPosts = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        crawl:crawls(*),
        user:users(*),
        pictures:pictures(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[GetFeedPosts] Error:', error);
      throw error;
    }

    console.log('[GetFeedPosts] Fetched', data?.length || 0, 'posts');
    return data;
  } catch (error) {
    console.error('[GetFeedPosts] Failed:', error);
    return [];
  }
};

/**
 * Test function to verify Supabase connection and insert a simple crawl
 */
export const testCreateCrawl = async (userId: string) => {
  try {
    console.log('[TestCreateCrawl] Testing crawl creation for user:', userId);

    const testCrawl: Crawl = {
      id: `test_crawl_${Date.now()}`,
      userId: userId,
      title: 'Test Crawl',
      caption: 'This is a test crawl from the app',
      city: 'Test City',
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      route: [
        { latitude: 40.7128, longitude: -74.0060, timestamp: Date.now() - 3600000 },
        { latitude: 40.7138, longitude: -74.0070, timestamp: Date.now() },
      ],
      updates: [],
      drinks: [
        { type: 'beer' as DrinkType, timestamp: Date.now() - 1800000 },
        { type: 'shot' as DrinkType, timestamp: Date.now() - 900000 },
      ],
      barsHit: [],
      milesWalked: 0.5,
      drinksCount: 2,
      createdAt: Date.now(),
    };

    const result = await createCrawl(testCrawl);

    if (result) {
      console.log('[TestCreateCrawl] Success! Crawl ID:', result.crawlId);
      return result;
    } else {
      console.error('[TestCreateCrawl] Failed to create crawl');
      return null;
    }
  } catch (error) {
    console.error('[TestCreateCrawl] Error:', error);
    return null;
  }
};
