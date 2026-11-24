import { supabase } from '../supabase';

export const authService = {
  // Sign Up with email and password
  signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: firstName && lastName ? `${firstName} ${lastName}` : email,
        }
      }
    });

    if (error) throw error;
    return data;
  },

  // Sign In with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Reset Password for Email
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'mydailyexpensenew://auth/reset-password',
    });
    if (error) throw error;
  },

  // Update User Profile
  updateProfile: async (updates: { firstName?: string; lastName?: string; email?: string }) => {
    const { firstName, lastName, email } = updates;
    const updateData: any = { data: {} };

    if (firstName) updateData.data.first_name = firstName;
    if (lastName) updateData.data.last_name = lastName;

    // Update full_name if first or last name is provided
    if (firstName || lastName) {
      // We need current user metadata to construct full name if only one part is updated
      const { data: { user } } = await supabase.auth.getUser();
      const currentFirst = user?.user_metadata?.first_name || '';
      const currentLast = user?.user_metadata?.last_name || '';

      const newFirst = firstName || currentFirst;
      const newLast = lastName || currentLast;

      updateData.data.full_name = `${newFirst} ${newLast}`.trim();
    }

    if (email) {
      updateData.email = email;
    }

    const { data, error } = await supabase.auth.updateUser(updateData, {
      emailRedirectTo: 'mydailyexpensenew://'
    });

    if (error) throw error;
    return data;
  },

  // Sign Out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get Current User
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get Current Session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
