// src/services/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { authService } from './authService';
//import { RegisterData, UserProfile, AuthError } from '@/types/auth.types';
import type { RegisterData, UserProfile, AuthError } from '../../types/auth.types'; 


interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (data: RegisterData) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    loadSession();
  }, []);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadSession = async () => {
    try {
      setLoading(true);

      // Siempre cerrar sesión al iniciar la app
      await supabase.auth.signOut();

      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { profile, error } = await authService.getUserProfile(userId);
      
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const signUp = async (data: RegisterData): Promise<{ error: AuthError | null }> => {
    try {
      const { user, profile, error } = await authService.signUp(data);

      if (error) {
        return { error };
      }

      // La sesión se establecerá automáticamente por el listener onAuthStateChange
      return { error: null };
    } catch (error: any) {
      console.error('Error in signUp:', error);
      return { error: { message: error.message || 'Error desconocido' } };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      const { user, error } = await authService.signIn(email, password);

      if (error) {
        return { error };
      }

      // La sesión se establecerá automáticamente por el listener onAuthStateChange
      return { error: null };
    } catch (error: any) {
      console.error('Error in signIn:', error);
      return { error: { message: error.message || 'Error desconocido' } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}