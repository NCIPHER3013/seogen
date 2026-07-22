import { supabase } from './supabase';

export type ArticleStatus = 'Draft' | 'Generating' | 'Completed' | 'Published';

export interface Article {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  seo_score: number;
  created_at: string;
  updated_at: string;
}

export async function fetchUserArticles(): Promise<Article[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles from Supabase:', error);
    return [];
  }
  return data || [];
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching article from Supabase:', error);
    return null;
  }
  return data;
}

export async function saveArticle(title: string, content: string, status: ArticleStatus = 'Completed', existingId?: string): Promise<Article | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('User not logged in, cannot save article to Supabase');
    return null;
  }

  const payload = {
    user_id: user.id,
    title,
    content,
    status,
    updated_at: new Date().toISOString()
  };

  if (existingId) {
    const { data, error } = await supabase
      .from('articles')
      .update(payload)
      .eq('id', existingId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating article:', error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('articles')
      .insert([payload])
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting article:', error);
      return null;
    }
    return data;
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting article:', error);
    return false;
  }
  return true;
}
