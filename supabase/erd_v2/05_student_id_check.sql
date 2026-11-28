-- Lets the "Complete your profile" form check whether a DLSU ID number is already registered.
-- RLS hides other students' rows, so this runs as security definer and only returns true/false.
-- Applied to the live project as migration student_is_dlsu_id_taken.
create or replace function public.is_dlsu_id_taken(p_dlsu_id_no text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public."Student"
    where dlsu_id_no = btrim(p_dlsu_id_no)
      and student_id <> (select auth.uid())
  );
$$;

revoke all on function public.is_dlsu_id_taken(text) from public, anon;
grant execute on function public.is_dlsu_id_taken(text) to authenticated;

-- One Student per DLSU ID number. Existing duplicate test accounts were moved to placeholder IDs
-- 00000001–00000003 first. Applied to the live project as migration student_dlsu_id_no_unique.
-- The modal maps the resulting 23505 error (message contains "dlsu_id_no") to the ID field.
alter table public."Student" add constraint student_dlsu_id_no_key unique (dlsu_id_no);
