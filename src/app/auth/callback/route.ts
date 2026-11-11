import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/src/lib/supabase/server';
import { OAUTH_INTENT_COOKIE } from '@/src/lib/supabase/oauthIntent';
import { getAccountType } from '@/src/services/accountService';
import { HOME_ROUTE } from '@/src/lib/routes';

// Handles both the Google OAuth redirect and the email-confirmation OTP
// (both arrive here with a PKCE `?code=`).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code'); //this variable is just a receipt that means the user has been autnenticated

  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/?auth_error=cancelled`); //1. Handles case where user cancels on Google's consent screen or if OTP expired.
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=failed`); //2. Prevents users from going through getting logged in without being authenticated clearly
  }

  // 3. Swap the one-time code for a session (writes the sb-* cookies).
  //    Fails if the code was already used or the link was opened in a
  //    different browser than the one that started sign-up.

  // Which Google button was used ("login" or "signup"); missing for email-confirmation links.
  const cookieStore = await cookies();
  const intent = cookieStore.get(OAUTH_INTENT_COOKIE)?.value;
  cookieStore.delete(OAUTH_INTENT_COOKIE);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/?auth_error=failed`);
  }

  // 4. Only DLSU accounts allowed: sign out anyone else immediately.
  const email = (data.user.email ?? '').toLowerCase();
  if (!email.endsWith('@dlsu.edu.ph')) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?auth_error=domain`);
  }

  // 5. Send the user where their account type belongs:
  //    Organization row → /dashboard (in case an org's email is also a Google account).
  //    Student row → /landing.
  //    Neither (only exists in auth.users) → back to "/" with the Complete Your Profile modal open.
  const account = await getAccountType(supabase, data.user.id);

  // "Log in with Google" with no Student/Organization profile → treat it like a wrong
  // email/password: remove the auth user Google just created (if it's brand new),
  // sign out, and show "No account found". Never opens Complete Your Profile.
  if (intent === 'login' && account === 'new') {
    await supabase.rpc('delete_new_oauth_user'); // no-op if the SQL function isn't set up
    await supabase.auth.signOut({ scope: 'local' });
    return NextResponse.redirect(`${origin}/?auth_error=no_account`);
  }

  const destination = account === 'new' ? '/?complete_profile=1' : HOME_ROUTE[account];

  return NextResponse.redirect(`${origin}${destination}`);
}
