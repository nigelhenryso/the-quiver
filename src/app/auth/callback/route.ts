import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { STUDENT_TABLE } from '@/src/lib/supabase/tables';

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

  // 5. If user exists in Student table, means that user is authenticated and has a profile → /landing. 
  //    Only exists in auth.users (no student profile yet) → back to "/" with the Complete Your Profile modal open.

  const { data: student } = await supabase  
    .from(STUDENT_TABLE)
    .select('student_id')
    .eq('student_id', data.user.id)
    .maybeSingle();

  return NextResponse.redirect(
    `${origin}${student ? '/landing' : '/?complete_profile=1'}` 
  );
}
