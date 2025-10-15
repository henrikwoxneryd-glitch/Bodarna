import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/BoltDatabase-js';
import { Bolt_Database, supabase } from './BoltDatabase'; // Lade till 'supabase' import. Kontrollera att din './BoltDatabase' fil exporterar 'supabase'
import { Profile } from '../types/database';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'booth_staff') => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LoadProfile-funktionen flyttas ut för att underlätta läsbarhet och hantering av scope
// Men jag behåller den inuti AuthProvider som du hade den, men ser till att den definieras
// innan den används i useEffect.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // LoadProfile-funktionen flyttad uppåt för att vara tillgänglig i useEffect
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await Bolt_Database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as Profile); // Lade till type assertion här då data kan vara null
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Om detta var felet på rad 49,42 (att det förväntades ett kommatecken)
        // så var det pga att jag inte hade 'supabase' importerat
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Felet på rad 57,7 ("try expected") är sannolikt pga att en asynkron funktion
          // inuti onAuthStateChange inte kan anropa en synkron funktion som returnerar
          // en Promise utan 'await' framför. Jag har ändrat 'loadProfile' till 'await loadProfile'
          // inne i denna async IIFE för att vara säkrare.
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
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
