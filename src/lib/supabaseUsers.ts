import { supabase } from '@/src/config/supabase';
import { User } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { fetchUserCrawls } from './supabaseCrawls';

// Callback to update user crawls after background fetch
let onCrawlsLoadedCallback: ((userId: string, crawls: any[]) => void) | null = null;

export const setOnCrawlsLoadedCallback = (callback: (userId: string, crawls: any[]) => void) => {
  onCrawlsLoadedCallback = callback;
};

/**
 * Creates or updates a user profile in the Supabase database
 * Called when a user signs in via OAuth
 */
export const upsertUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('[UpsertUser] Starting for:', supabaseUser.id);

    // 1. Prepare data (Removed stats fields to prevent overwriting progress)
    const userData = {
      id: supabaseUser.id,
      auth_id: supabaseUser.id, // Add auth_id to match RLS policy
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
      display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
      age: supabaseUser.user_metadata?.age || 21,
      email: supabaseUser.email || '',
      phone_number: supabaseUser.user_metadata?.phone || '',
      profile_picture_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      bio: supabaseUser.user_metadata?.description || null,
      updated_at: new Date().toISOString(),
      // REMOVED: total_drinks, total_crawls, etc.
      // Let the database defaults handle these!
    };

    // 2. Perform Upsert (fire without awaiting)
    console.log('[UpsertUser] Firing upsert...');
    void supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .then(() => console.log('[UpsertUser] Background upsert succeeded'))
      .catch((err: any) => console.error('[UpsertUser] Background upsert failed:', err));

    console.log('[UpsertUser] Success (upsert in background)');

    // 3. Return User Object immediately (without waiting for crawls)
    const user: User = {
      id: userData.id,
      username: userData.username,
      name: userData.display_name,
      age: userData.age,
      email: userData.email,
      phone: userData.phone_number || '',
      profilePicture: userData.profile_picture_url,
      description: userData.bio,
      followersCount: 0, // Placeholder until you fetch real data
      friendsCount: 0,   // Placeholder until you fetch real data
      crawls: [], // Load crawls in background
    };

    // 4. Fetch crawls in the background (don't block login)
    fetchUserCrawls(userData.id)
      .then((crawls) => {
        console.log('[UpsertUser] Background crawl fetch complete:', crawls.length, 'crawls');
        // Notify the callback if set (AppContext will update the user state)
        if (onCrawlsLoadedCallback) {
          onCrawlsLoadedCallback(userData.id, crawls);
        }
      })
      .catch((err: any) => console.error('[UpsertUser] Background crawl fetch failed:', err));

    return user;

  } catch (error) {
    console.error('[UpsertUser] Fatal Error:', error);
    return null;
  }
};
/**
 * Fetches a user profile from the Supabase database
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    if (!data) return null;

    // Return user profile immediately without crawls (load them lazily in the background)
    const user: User = {
      id: data.id,
      username: data.username,
      name: data.display_name,
      age: data.age,
      email: data.email,
      phone: data.phone_number || '',
      profilePicture: data.profile_picture_url,
      description: data.bio,
      followersCount: 0,
      friendsCount: 0,
      crawls: [], // Load crawls lazily
    };

    // Fetch crawls in the background (don't block login)
    void fetchUserCrawls(userId)
      .then((crawls) => {
        console.log('[GetUserProfile] Background crawl fetch complete:', crawls.length, 'crawls');
        // Notify the callback if set (AppContext will update the user state)
        if (onCrawlsLoadedCallback) {
          onCrawlsLoadedCallback(userId, crawls);
        }
      })
      .catch((err: any) => console.error('[GetUserProfile] Background crawl fetch failed:', err));

    return user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
};
