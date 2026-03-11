import { supabase } from '@/src/config/supabase';
import { Crawl } from '@/types';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Uploads a crawl to Supabase
 */
export const uploadCrawlToSupabase = async (crawl: Crawl): Promise<void> => {
  try {
    console.log('[UploadCrawl] Starting upload for crawl:', crawl.id);

    // Count drink types
    const drinkCounts = crawl.drinks.reduce((acc, drink) => {
      switch (drink.type) {
        case 'shot':
          acc.shots++;
          break;
        case 'beer':
          acc.beers++;
          break;
        case 'cocktail':
          acc.cocktails++;
          break;
        case 'wine':
          acc.wines++;
          break;
        case 'seltzer':
          acc.seltzers++;
          break;
      }
      return acc;
    }, { shots: 0, beers: 0, cocktails: 0, wines: 0, seltzers: 0 });

    // Prepare crawl data for Supabase
    const crawlData = {
      id: crawl.id,
      user_id: crawl.userId,
      title: crawl.title,
      caption: crawl.caption || null,
      start_time: new Date(crawl.startTime).toISOString(),
      end_time: crawl.endTime ? new Date(crawl.endTime).toISOString() : new Date().toISOString(),
      status: 'completed',
      total_drinks: crawl.drinksCount,
      shots: drinkCounts.shots,
      beers: drinkCounts.beers,
      cocktails: drinkCounts.cocktails,
      wines: drinkCounts.wines,
      seltzers: drinkCounts.seltzers,
      total_bars: crawl.barsHit.length,
      total_miles: crawl.milesWalked,
      city: crawl.city || null,
      route_coordinates: crawl.route, // Store as JSONB
      cheers_count: 0,
      comments_count: 0,
      created_at: new Date(crawl.createdAt).toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert crawl into Supabase
    const { error } = await supabase
      .from('crawls')
      .insert(crawlData);

    if (error) {
      console.error('[UploadCrawl] Error uploading crawl:', error);
      throw error;
    }

    console.log('[UploadCrawl] Crawl uploaded successfully:', crawl.id);

    // Upload photos to Supabase Storage
    if (crawl.updates && crawl.updates.length > 0) {
      console.log('[UploadCrawl] Uploading', crawl.updates.length, 'photos...');
      await uploadCrawlPhotos(crawl.id, crawl.userId, crawl.updates);
    }

  } catch (error) {
    console.error('[UploadCrawl] Fatal error uploading crawl:', error);
    throw error;
  }
};

/**
 * Uploads crawl photos to Supabase Storage and stores URLs in a separate table
 */
async function uploadCrawlPhotos(crawlId: string, userId: string, updates: any[]): Promise<void> {
  try {
    for (const update of updates) {
      if (!update.photoUri) continue;

      console.log('[UploadPhoto] Uploading photo:', update.id);

      // 1. Read the photo file as base64
      const base64 = await FileSystem.readAsStringAsync(update.photoUri, {
        encoding: 'base64',
      });

      // 2. Decode base64 to binary string
      const binaryString = atob(base64);

      console.log('[UploadPhoto] Photo binary size:', binaryString.length, 'bytes');

      // 3. Create a unique file path
      const fileExt = 'jpg';
      const filePath = `${userId}/${crawlId}/${update.id}.${fileExt}`;

      // 4. Upload to Supabase Storage (pass the ArrayBuffer directly)
      const byteNumbers = new Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteNumbers[i] = binaryString.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { error: uploadError } = await supabase.storage
        .from('crawl-photos')
        .upload(filePath, byteArray, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[UploadPhoto] Failed to upload photo:', update.id, uploadError);
        continue; // Skip this photo but continue with others
      }

      console.log('[UploadPhoto] Photo uploaded successfully');

      // 4. Store photo metadata in crawl_photos table (store file path, not URL)
      const { error: insertError } = await supabase
        .from('crawl_photos')
        .insert({
          id: update.id,
          crawl_id: crawlId,
          photo_url: filePath, // Store the storage path instead of signed URL
          drink_type: update.drinkType || null,
          latitude: update.location?.latitude || null,
          longitude: update.location?.longitude || null,
          taken_at: new Date(update.timestamp).toISOString(),
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[UploadPhoto] Failed to insert photo metadata:', update.id, insertError);
      }
    }

    console.log('[UploadPhoto] All photos uploaded successfully');
  } catch (error) {
    console.error('[UploadPhoto] Fatal error uploading photos:', error);
    // Don't throw - we don't want to fail the entire crawl upload if photos fail
  }
}

/**
 * Fetches crawls from Supabase for a specific user
 */
export const fetchUserCrawls = async (userId: string): Promise<Crawl[]> => {
  try {
    console.log('[FetchCrawls] Fetching crawls for user:', userId);

    const { data, error } = await supabase
      .from('crawls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FetchCrawls] Error fetching crawls:', error);
      throw error;
    }

    console.log('[FetchCrawls] Found', data?.length || 0, 'crawls');

    // Transform Supabase data back to Crawl type
    const crawls: Crawl[] = await Promise.all((data || []).map(async (row) => {
      let updates: any[] = [];

      try {
        // Fetch photos for this crawl
        const { data: photos } = await supabase
          .from('crawl_photos')
          .select('*')
          .eq('crawl_id', row.id)
          .order('taken_at', { ascending: true });

        // Transform photos to CrawlUpdate format
        updates = await Promise.all((photos || []).map(async (photo) => {
          try {
            // Check if photo_url is already a full URL (old data) or a file path (new data)
            const isFullUrl = photo.photo_url.startsWith('http');

            let photoUri = photo.photo_url;

            if (!isFullUrl) {
              // New format: file path - get public URL (bucket is public)
              const { data: { publicUrl } } = supabase.storage
                .from('crawl-photos')
                .getPublicUrl(photo.photo_url);

              photoUri = publicUrl;
            }
            // Old format: full URL - use as-is

            console.log('[FetchCrawls] Photo loaded:', photoUri.substring(0, 80) + '...');

            return {
              id: photo.id,
              photoUri,
              drinkType: photo.drink_type as any,
              timestamp: new Date(photo.taken_at).getTime(),
              location: photo.latitude && photo.longitude ? {
                latitude: parseFloat(photo.latitude),
                longitude: parseFloat(photo.longitude),
              } : undefined,
            };
          } catch (photoError) {
            console.error('[FetchCrawls] Error loading individual photo:', photoError);
            return null;
          }
        }));

        // Filter out failed photos
        updates = updates.filter(u => u !== null);
      } catch (photosError) {
        console.error('[FetchCrawls] Error fetching photos for crawl:', row.id, photosError);
        updates = []; // If photos fail, just show crawl without photos
      }

      const crawl = {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        caption: row.caption,
        city: row.city,
        startTime: new Date(row.start_time).getTime(),
        endTime: new Date(row.end_time).getTime(),
        route: row.route_coordinates || [],
        updates,
        drinks: [], // Could reconstruct from counts if needed
        barsHit: [], // Could be stored separately if needed
        milesWalked: parseFloat(row.total_miles),
        drinksCount: row.total_drinks,
        createdAt: new Date(row.created_at).getTime(),
      };

      console.log('[FetchCrawls] Crawl returned with', updates.length, 'photos');
      return crawl;
    }));

    return crawls;
  } catch (error) {
    console.error('[FetchCrawls] Fatal error fetching crawls:', error);
    return [];
  }
};

/**
 * Fetches all crawls for the feed (from all users)
 */
export const fetchFeedCrawls = async (): Promise<any[]> => {
  try {
    // Join crawls with users table to get user info
    const { data, error } = await supabase
      .from('crawls')
      .select(`
        *,
        users:user_id (
          id,
          username,
          display_name,
          profile_picture_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[FetchFeed] Error fetching feed:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[FetchFeed] Fatal error fetching feed:', error);
    return [];
  }
};
