import { supabase } from '@/src/config/supabase';
import { Crawl } from '@/types';

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

    // TODO: Upload photos to Supabase Storage if needed
    // For now, photos are stored locally in the updates array

  } catch (error) {
    console.error('[UploadCrawl] Fatal error uploading crawl:', error);
    throw error;
  }
};

/**
 * Fetches crawls from Supabase for a specific user
 */
export const fetchUserCrawls = async (userId: string): Promise<Crawl[]> => {
  try {
    const { data, error } = await supabase
      .from('crawls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FetchCrawls] Error fetching crawls:', error);
      throw error;
    }

    // Transform Supabase data back to Crawl type
    const crawls: Crawl[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      caption: row.caption,
      city: row.city,
      startTime: new Date(row.start_time).getTime(),
      endTime: new Date(row.end_time).getTime(),
      route: row.route_coordinates || [],
      updates: [], // Photos would need to be fetched separately from Storage
      drinks: [], // Could reconstruct from counts if needed
      barsHit: [], // Could be stored separately if needed
      milesWalked: parseFloat(row.total_miles),
      drinksCount: row.total_drinks,
      createdAt: new Date(row.created_at).getTime(),
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
