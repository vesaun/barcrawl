import { supabase } from '@/src/config/supabase';
import { User } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
    supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .then(() => console.log('[UpsertUser] Background upsert succeeded'))
      .catch((err) => console.error('[UpsertUser] Background upsert failed:', err));

    console.log('[UpsertUser] Success (upsert in background)');

    // 3. Return User Object
    // Note: This returns 0 for stats locally, but the DB preserves real data.
    // If you need real stats immediately, you'd need to do a .select() fetch here.
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
      crawls: [],
    };

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
      crawls: [],
    };

    return user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
};
