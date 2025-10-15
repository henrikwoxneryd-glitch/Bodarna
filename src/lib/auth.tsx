// ✅ Importer
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js'; // 👈 Korrigerad import (inte @supabase/BoltDatabase-js)
import Bolt_Database, { supabase } from './BoltDatabase'; 
import { Profile } from '../types/database';

// ✅ Typdefinitioner
type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'booth_staff') => Promise<void>;
  signOut: () => Promise<void>;
};

// ✅ Skapa context med default typ
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ----------------------------------------------------
// 🧩 Hjälpfunktion: Hämtar användarens profil
// ----------------------------------------------------
const loadProfile = async (
  userId: string,
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const { data, error } = await Bolt_Database
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>(); // 👈 Starkare typning

    if (error) throw error;
    setProfile(data ?? null);
  } catch (error) {
    console.error('Error loading profile:', error);
    setProfile(null);
  } finally {
    setLoading(false);
  }
};

// ----------------------------------------------------
// 🔐 AuthProvider-komponent
// ----------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 🚀 Initierar session vid start
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id, setProfile, setLoading);
      } else {
        setLoading(false);
      }
    });

    // 👂 Lyssna på ändringar i autentiseringsstatus
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id, setProfile, setLoading);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 🧹 Städa upp vid unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------
  // ✉️ Sign In
  // ----------------------------------------------------
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // ----------------------------------------------------
  // 🆕 Sign Up
  // ----------------------------------------------------
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

    // 👇 Extra skydd: Skapa profil i tabellen om trigger saknas
    const userId = data.user?.id;
    if (userId) {
      const { error: dbError } = await Bolt_Database
        .from('profiles')
        .insert({ id: userId, full_name: fullName, role });

      if (dbError) console.error('Profile creation error:', dbError);
    }
  };

  // ----------------------------------------------------
  // 🚪 Sign Out
  // ----------------------------------------------------
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // ----------------------------------------------------
  // 🌐 Provider returnerar context till appen
  // ----------------------------------------------------
  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ----------------------------------------------------
// 🧠 Hook för att använda AuthContext
// ----------------------------------------------------
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
    });

    return () => subscription.unsubscribe();
  }, []); 

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'booth_staff') => {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) throw authError;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
    });

    return () => subscription.unsubscribe();
  }, []); // En tom dependency-array är bra här

  // ... (signIn, signUp, signOut funktionerna är oförändrade)
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'booth_staff') => {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) throw authError;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []); // Lade till en tom dependency-array för att undvika oändlig loop

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'booth_staff') => {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) throw authError;
    // Profile is automatically created by database trigger
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Logga in
  const signIn = async (email: string, password: string) => {
    const { error } = await BoltDatabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // 🔧 Registrera ny användare
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'booth_staff'
  ) => {
    const { error: authError } = await BoltDatabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) throw authError;
    // Profil skapas automatiskt via trigger
  };

  // 🔧 Logga ut
  const signOut = async () => {
    const { error } = await BoltDatabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔧 Hook för att använda AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await Bolt_Database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'booth_staff') => {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (authError) throw authError;
    // Profile is automatically created by database trigger
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
