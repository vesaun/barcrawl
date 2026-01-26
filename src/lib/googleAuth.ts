import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/config/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

const createSessionFromUrl = async (url: string) => {
  console.log('[OAuth] Processing callback URL:', url);

  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    console.error('[OAuth] Error code in callback:', errorCode);
    throw new Error(errorCode);
  }

  console.log('[OAuth] URL params received:', params);

  // Check if we have an authorization code (PKCE flow) or tokens (implicit flow)
  const code = params.code;
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (code) {
    // PKCE flow: exchange authorization code for session
    console.log('[OAuth] Using PKCE flow - exchanging code for session...');

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[OAuth] Error exchanging code for session:', error);
      throw error;
    }

    console.log('[OAuth] Session created successfully via PKCE:', {
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
    });

    return data.session;
  } else if (accessToken) {
    // Implicit flow: set session directly with tokens
    console.log('[OAuth] Using implicit flow - setting session with tokens...');

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('[OAuth] Error setting session:', error);
      throw error;
    }

    console.log('[OAuth] Session created successfully via implicit flow:', {
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
    });

    return data.session;
  } else {
    console.error('[OAuth] No authorization code or access token found in callback URL');
    console.log('[OAuth] Available params:', Object.keys(params));
    throw new Error('No authorization code or access token found in callback URL');
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('[OAuth] Starting Google sign-in flow...');
    console.log('[OAuth] Redirect URI:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('[OAuth] Error initiating OAuth:', error);
      throw error;
    }

    console.log('[OAuth] Opening browser for authentication...');
    console.log('[OAuth] Auth URL:', data?.url);

    const res = await WebBrowser.openAuthSessionAsync(
      data?.url ?? '',
      redirectTo
    );

    console.log('[OAuth] Browser session result:', res.type);

    if (res.type === 'success') {
      const { url } = res;
      console.log('[OAuth] Success! Processing callback...');
      await createSessionFromUrl(url);
      console.log('[OAuth] Sign-in completed successfully');
    } else if (res.type === 'cancel') {
      console.log('[OAuth] User cancelled the sign-in');
      throw new Error('Sign-in was cancelled');
    } else {
      console.log('[OAuth] Unexpected result type:', res.type);
      throw new Error('Sign-in failed with unexpected result');
    }
  } catch (error: any) {
    console.error('[OAuth] Google sign-in error:', error);
    console.error('[OAuth] Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Set up deep link handling for OAuth callbacks
export const setupOAuthListener = (
  onSession: (session: any) => void
) => {
  console.log('[OAuth] Setting up deep link listener...');

  const subscription = Linking.addEventListener('url', async ({ url }) => {
    console.log('[OAuth] Deep link received:', url);

    try {
      const session = await createSessionFromUrl(url);
      if (session) {
        console.log('[OAuth] Session created from deep link, notifying app...');
        onSession(session);
      } else {
        console.log('[OAuth] No session created from deep link');
      }
    } catch (error) {
      console.error('[OAuth] OAuth callback error:', error);
    }
  });

  return () => {
    console.log('[OAuth] Removing deep link listener');
    subscription.remove();
  };
};
