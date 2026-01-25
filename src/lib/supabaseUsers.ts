import { supabase } from '@/src/config/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';

/**
 * Creates or updates a user profile in the Supabase database
 * Called when a user signs in via OAuth
 */
export const upsertUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    // Extract user data from Supabase auth user
    const userData = {
      id: supabaseUser.id,
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
      age: supabaseUser.user_metadata?.age || 21,
      email: supabaseUser.email || '',
      phone: supabaseUser.user_metadata?.phone || '',
      profile_picture: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      description: supabaseUser.user_metadata?.description,
      updated_at: new Date().toISOString(),
    };

    // Upsert user profile to database
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }

    // Convert database format to app format
    const user: User = {
      id: data.id,
      username: data.username,
      name: data.name,
      age: data.age,
      email: data.email,
      phone: data.phone,
      profilePicture: data.profile_picture,
      description: data.description,
      followersCount: 0, // TODO: Implement followers count from database
      friendsCount: 0, // TODO: Implement friends count from database
      crawls: [], // TODO: Load user's crawls from database
    };

    return user;
  } catch (error) {
    console.error('Failed to upsert user profile:', error);
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
      name: data.name,
      age: data.age,
      email: data.email,
      phone: data.phone,
      profilePicture: data.profile_picture,
      description: data.description,
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
