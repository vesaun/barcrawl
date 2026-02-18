import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/src/config/supabase';
import { Platform } from 'react-native';

/**
 * Sign in with Apple using Expo Apple Authentication
 * This uses the native Apple Sign In on iOS
 */
export const signInWithApple = async () => {
  try {
    console.log('[AppleAuth] Starting Apple sign-in flow...');

    // Check if Apple Authentication is available (iOS only)
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device');
    }

    console.log('[AppleAuth] Requesting Apple credentials...');

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('[AppleAuth] Apple credentials received:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
    });

    // Check if we have the required identityToken
    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple');
    }

    console.log('[AppleAuth] Signing in to Supabase with Apple token...');

    // Sign in to Supabase with the Apple token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: credential.nonce, // Optional but recommended for security
    });

    if (error) {
      console.error('[AppleAuth] Supabase sign-in error:', error);
      throw error;
    }

    console.log('[AppleAuth] Sign-in successful:', {
      userId: data.user?.id,
      email: data.user?.email,
    });

    // Store user metadata if this is first time sign in
    // Apple only provides name and email on first sign-in
    if (credential.fullName || credential.email) {
      console.log('[AppleAuth] Updating user metadata...');

      const updates: any = {};

      if (credential.fullName) {
        const firstName = credential.fullName.givenName || '';
        const lastName = credential.fullName.familyName || '';
        updates.full_name = `${firstName} ${lastName}`.trim();
        updates.name = updates.full_name;
      }

      if (credential.email) {
        updates.email = credential.email;
      }

      // Update user metadata in Supabase
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: updates,
        });

        if (updateError) {
          console.error('[AppleAuth] Error updating user metadata:', updateError);
          // Don't throw - sign-in was successful, metadata update is optional
        } else {
          console.log('[AppleAuth] User metadata updated successfully');
        }
      }
    }

    console.log('[AppleAuth] Sign-in flow completed successfully');
    return data;

  } catch (error: any) {
    console.error('[AppleAuth] Apple sign-in error:', error);

    // Handle specific Apple Authentication errors
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'ERR_REQUEST_FAILED') {
      throw new Error('Sign-in request failed. Please try again.');
    } else if (error.code === 'ERR_REQUEST_NOT_HANDLED') {
      throw new Error('Sign-in not handled. Please ensure you are signed in to iCloud.');
    } else if (error.code === 'ERR_REQUEST_NOT_INTERACTIVE') {
      throw new Error('Sign-in requires user interaction');
    } else if (error.code === 'ERR_REQUEST_UNKNOWN') {
      throw new Error('An unknown error occurred during sign-in');
    }

    throw error;
  }
};

/**
 * Check if Apple Authentication is available on this device
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('[AppleAuth] Error checking availability:', error);
    return false;
  }
};