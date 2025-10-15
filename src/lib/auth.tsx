import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { Bolt_Database, supabase } from './BoltDatabase'; 
import { Profile } from '../types/database';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'booth_staff'
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadProfile = async (
  userId: string,
  setProfile: (p: Profile | null) => void,
  setLoading: (l: boolean) => void
) => {
  try {
    const { data, error } = await Bolt_Database
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>();

    if (error) throw error;
    setProfile(data ?? null);
  } catch (error) {
    console.error('Error loading profile:', error);
    setProfile(null);
  } finally {
    setLoading(false);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id, setProfile, setLoading);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          loadProfile(session.user.id, setProfile, setLoading);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'booth_staff'
  ) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (authError) throw authError;

    const userId = data.user?.id;
    if (userId) {
      const { error: dbError } = await Bolt_Database
        .from('profiles')
        .insert({ id: userId, full_name: fullName, role });

      if (dbError) console.error('Profile creation error:', dbError);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
}
