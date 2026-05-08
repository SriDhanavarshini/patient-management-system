import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingIn = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          if (!isLoggingIn.current) {
            fetchUserRole(session.user.id);
          }
        } else {
          setAdmin(null);
          setDoctor(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId) {
    try {
      // maybeSingle() returns null if no row — never throws 406
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (adminData) {
        setAdmin(adminData);
        setDoctor(null);
        setLoading(false);
        return;
      }

      const { data: doctorData } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (doctorData) {
        setDoctor(doctorData);
        setAdmin(null);
        setLoading(false);
        return;
      }

      // Neither admin nor doctor
      await supabase.auth.signOut();
      setLoading(false);

    } catch (err) {
      console.error("fetchUserRole error:", err.message);
      setAdmin(null);
      setDoctor(null);
      setLoading(false);
    }
  }

  async function registerAdmin({ email, password, name, phone }) {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Signup succeeded but no user was returned.");
      const { error: insertError } = await supabase.from("admins").insert({
        id: user.id,
        email: user.email,
        name,
        phone,
        role: "admin",
      });
      if (insertError) {
        await supabase.auth.signOut();
        throw insertError;
      }
      return { error: null };
    } catch (err) {
      console.error("registerAdmin error:", err.message);
      return { error: err };
    }
  }

  async function login({ email, password }) {
    isLoggingIn.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const userId = data.user.id;

      // maybeSingle() — no row = null, not an error
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (adminData) {
        setAdmin(adminData);
        setDoctor(null);
        return { error: null, role: 'admin' };
      }

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (doctorData) {
        setDoctor(doctorData);
        setAdmin(null);
        return { error: null, role: 'doctor' };
      }

      await supabase.auth.signOut();
      throw new Error('No account found. Please contact your administrator.');

    } catch (err) {
      console.error('login error:', err.message);
      return { error: err, role: null };
    } finally {
      isLoggingIn.current = false;
      setLoading(false);
    }
  }

  async function createDoctor(doctorData, password) {
    try {
      const { data: { session: adminSession } } = await supabase.auth.getSession()
      if (!adminSession) throw new Error('Admin session lost. Please log in again.')
      const adminAccessToken  = adminSession.access_token
      const adminRefreshToken = adminSession.refresh_token

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: doctorData.email,
        password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Doctor auth user not created.')
      const doctorUserId = authData.user.id

      await supabase.auth.setSession({
        access_token:  adminAccessToken,
        refresh_token: adminRefreshToken,
      })

      const { data: insertData, error: insertError } = await supabase
        .from('doctors')
        .insert({
          user_id:          doctorUserId,
          name:             doctorData.name,
          email:            doctorData.email,
          phone:            doctorData.phone            || null,
          specialization:   doctorData.specialization   || null,
          gender:           doctorData.gender           || null,
          date_of_birth:    doctorData.date_of_birth    || null,
          qualification:    doctorData.qualification    || null,
          experience_years: doctorData.experience_years ? parseInt(doctorData.experience_years) : null,
          license_number:   doctorData.license_number   || null,
          address:          doctorData.address          || null,
          city:             doctorData.city             || null,
          state:            doctorData.state            || null,
          pincode:          doctorData.pincode          || null,
          shift_start:      doctorData.shift_start      || null,
          shift_end:        doctorData.shift_end        || null,
        })
        .select()

      if (insertError) {
        console.error('createDoctor insertError:', insertError)
        throw insertError
      }

      console.log('Doctor created successfully:', insertData)
      return { error: null }

    } catch (err) {
      console.error('createDoctor error:', err.message)
      return { error: err }
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdmin(null);
    setDoctor(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{
      admin,
      doctor,
      session,
      loading,
      isAuthenticated: !!session,
      registerAdmin,
      login,
      logout,
      createDoctor,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}