import { supabase } from './supabase';

export interface TopicalMapProject {
  id: string;
  user_id: string;
  project_name: string;
  keyword: string;
  brand: string;
  business_type: string;
  main_product: string;
  target_audience: string;
  additional_info?: string;
  result_text?: string;
  created_at: string;
  updated_at: string;
}

export async function fetchProjects(): Promise<TopicalMapProject[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('topical_maps')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topical maps from Supabase:', error);
    return [];
  }
  return data || [];
}

export async function saveProject(
  payload: Partial<TopicalMapProject>,
  existingId?: string
): Promise<TopicalMapProject | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('User not logged in, cannot save project');
    return null;
  }

  const projectPayload = {
    ...payload,
    user_id: user.id,
    updated_at: new Date().toISOString()
  };

  if (existingId) {
    const { data, error } = await supabase
      .from('topical_maps')
      .update(projectPayload)
      .eq('id', existingId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('topical_maps')
      .insert([projectPayload])
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting project:', error);
      return null;
    }
    return data;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('topical_maps')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  return true;
}
