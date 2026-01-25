import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/config/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;

  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return data.session;
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    const res = await WebBrowser.openAuthSessionAsync(
      data?.url ?? '',
      redirectTo
    );

    if (res.type === 'success') {
      const { url } = res;
      await createSessionFromUrl(url);
    }
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Set up deep link handling for OAuth callbacks
export const setupOAuthListener = (
  onSession: (session: any) => void
) => {
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    try {
      const session = await createSessionFromUrl(url);
      if (session) {
        onSession(session);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
    }
  });

  return () => {
    subscription.remove();
  };
};
