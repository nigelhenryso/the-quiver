import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { STUDENT_TABLE } from '@/src/lib/supabase/tables';

// Handles both the Google OAuth redirect and the email-confirmation link
// (both arrive here with a PKCE `?code=`).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // User cancelled on Google's consent screen, or the link expired.
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/?auth_error=cancelled`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/?auth_error=failed`);
  }

  const email = (data.user.email ?? '').toLowerCase();
  if (!email.endsWith('@dlsu.edu.ph')) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?auth_error=domain`);
  }

  const { data: student } = await supabase
    .from(STUDENT_TABLE)
    .select('student_id')
    .eq('student_id', data.user.id)
    .maybeSingle();

  return NextResponse.redirect(
    `${origin}${student ? '/landing' : '/?complete_profile=1'}`
  );
}
