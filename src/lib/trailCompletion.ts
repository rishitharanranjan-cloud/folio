/**
 * Trail auto-completion checker.
 * Called after every log insert — checks whether any joined trail just had
 * its final stop logged and, if so, stamps completed_at.
 * Returns the completed trail title, or null if nothing completed.
 */
import { supabase } from './supabase';

export async function checkTrailCompletion(
  userId: string,
  newTitle: string,
): Promise<{ id: string; title: string } | null> {
  // 1. Get all trails this user has joined but not yet completed
  const { data: userTrails } = await supabase
    .from('user_trails')
    .select('trail_id')
    .eq('user_id', userId)
    .is('completed_at', null);

  if (!userTrails?.length) return null;

  for (const ut of userTrails) {
    // 2. Fetch stops for this trail
    const { data: stops } = await supabase
      .from('trail_stops')
      .select('title')
      .eq('trail_id', ut.trail_id);

    if (!stops?.length) continue;

    const stopTitles = stops.map((s: any) => s.title.toLowerCase());

    // 3. Only proceed if the new log matches one of this trail's stops
    if (!stopTitles.includes(newTitle.toLowerCase())) continue;

    // 4. Check how many stops the user has now logged
    const { data: userLogs } = await supabase
      .from('logs')
      .select('title')
      .eq('user_id', userId);

    const loggedSet = new Set((userLogs ?? []).map((l: any) => l.title.toLowerCase()));
    const allLogged = stopTitles.every((t: string) => loggedSet.has(t));

    if (!allLogged) continue;

    // 5. All stops logged — mark trail complete
    const now = new Date().toISOString();
    await supabase
      .from('user_trails')
      .update({ completed_at: now })
      .eq('trail_id', ut.trail_id)
      .eq('user_id', userId);

    // 6. Fetch trail title for the celebration
    const { data: trail } = await supabase
      .from('trails')
      .select('id, title')
      .eq('id', ut.trail_id)
      .maybeSingle();

    if (trail) return { id: trail.id, title: trail.title };
  }

  return null;
}
