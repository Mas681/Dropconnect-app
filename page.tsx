'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Mail, LogOut, User, Search, Star, MessageCircle, Home, Menu, X } from 'lucide-react';

// Supabase Setup
const SUPABASE_URL = 'https://pctjbjkkjwgfbttlaqpz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GwIahEwoG-08NRw9vh89hQ_itBNlLZK';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function DropConnect() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [dropshippers, setDropshippers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // LOGIN / REGISTER
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('dropshipper');
  const [companyName, setCompanyName] = useState('');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      setUser(data.session.user);
      loadUserProfile(data.session.user.id);
      setView('dashboard');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: authData.user.id,
              email,
              user_type: userType,
              company_name: companyName,
              niche,
              location,
              rating: 0,
              reviews: 0,
              verified: false,
            },
          ]);

        if (profileError) throw profileError;

        alert('✅ Registrierung erfolgreich! Bitte bestätige deine Email!');
        setEmail('');
        setPassword('');
        setCompanyName('');
        setNiche('');
        setLocation('');
      }
    } catch (error) {
      alert('❌ Fehler: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      loadUserProfile(data.user.id);
      setView('dashboard');
      setEmail('');
      setPassword('');
    } catch (error) {
      alert('❌ Login fehlgeschlagen: ' + error.message);
    }
    setLoading(false);
  };

  const loadUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setUserProfile(data);
      if (data.user_type === 'dropshipper') {
        loadSuppliers();
      } else {
        loadDropshippers();
      }
    }
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'supplier');

    setSuppliers(data || []);
  };

  const loadDropshippers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'dropshipper');

    setDropshippers(data || []);
  };

  const handleContact = async (recipientId) => {
    if (!userProfile) return;

    const messageText = prompt('Nachricht an den Kontakt:');
    if (!messageText) return;

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: userProfile.user_id,
        recipient_id: recipientId,
        message: messageText,
        created_at: new Date(),
      },
    ]);

    if (!error) {
      alert('✅ Nachricht gesendet!');
    } else {
      alert('❌ Fehler beim Senden: ' + error.message);
    }
  };

  const handleRating = async (profileId, rating) => {
    const review = prompt('Bewertung hinzufügen (optional):');

    const { error } = await supabase.from('ratings').insert([
      {
        rater_id: userProfile.user_id,
        rated_profile_id: profileId,
        rating,
        review: review || null,
        created_at: new Date(),
      },
    ]);

    if (!error) {
      alert('✅ Bewertung hinzugefügt!');
      loadUserProfile(userProfile.user_id);
    } else {
      alert('❌ Fehler: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setView('login');
  };

  const ProfileCard = ({ profile }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{profile.company_name}</h3>
          <p className="text-sm text-gray-600">{profile.niche || 'Keine Nische angegeben'}</p>
          <p className="text-sm text-gray-500">{profile.location}</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
          <Star size={16} className="text-yellow-500" />
          <span className="font-semibold text-gray-700">
            {profile.rating ? profile.rating.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {profile.verified && (
        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-3">
          ✓ Verifiziert
        </span>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleContact(profile.user_id)}
          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          Kontakt
        </button>
        <button
          onClick={() => handleRating(profile.user_id, 5)}
          className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded hover:bg-yellow-600 transition flex items-center justify-center gap-2"
        >
          <Star size={18} />
          Bewerten
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">DropConnect</h1>

          {user && (
            <>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>

              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => setView('dashboard')}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <Home size={20} />
                  Dashboard
                </button>
                <button
                  onClick={() => setView('profile')}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <User size={20} />
                  Profil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && user && (
          <div className="md:hidden bg-gray-50 border-t p-4 flex flex-col gap-3">
            <button
              onClick={() => {
                setView('dashboard');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 w-full"
            >
              <Home size={20} />
              Dashboard
            </button>
            <button
              onClick={() => {
                setView('profile');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 w-full"
            >
              <User size={20} />
              Profil
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {email && password ? 'Login' : 'Registrieren'}
              </h2>

              <div className="mb-6 flex gap-4">
                <button
                  onClick={() => {
                    setEmail('');
                    setPassword('');
                  }}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Registrieren
                </button>
                <button
                  onClick={() => setEmail('test@test.com')}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                >
                  Login
                </button>
              </div>

              <form onSubmit={email === 'test@test.com' ? handleLogin : handleSignUp} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                {!password && (
                  <>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dropshipper">Ich bin Dropshipper</option>
                      <option value="supplier">Ich bin Lieferant</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Unternehmensname"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="text"
                      placeholder="Nische (z.B. Tech, Fashion, Home)"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      placeholder="Standort (Land/Stadt)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                >
                  {loading ? '⏳ Lädt...' : email === 'test@test.com' ? 'Login' : 'Registrieren'}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-4 text-center">
                💡 Test: Email "test@test.com" mit beliebigem Passwort
              </p>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && userProfile && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">
              {userProfile.user_type === 'dropshipper'
                ? '🔍 Verfügbare Lieferanten'
                : '📦 Verfügbare Dropshipper'}
            </h2>

            {suppliers.length === 0 && dropshippers.length === 0 ? (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
                ⚠️ Noch keine {userProfile.user_type === 'dropshipper' ? 'Lieferanten' : 'Dropshipper'} registriert
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(userProfile.user_type === 'dropshipper' ? suppliers : dropshippers).map(
                  (profile) => (
                    <ProfileCard key={profile.user_id} profile={profile} />
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && userProfile && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Mein Profil</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-600">{userProfile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unternehmensname
                  </label>
                  <p className="text-gray-600">{userProfile.company_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Niche
                  </label>
                  <p className="text-gray-600">{userProfile.niche || '—'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Standort
                  </label>
                  <p className="text-gray-600">{userProfile.location || '—'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Typ
                  </label>
                  <p className="text-gray-600">
                    {userProfile.user_type === 'dropshipper' ? '📦 Dropshipper' : '🏭 Lieferant'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bewertung
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-yellow-500">
                      {userProfile.rating ? userProfile.rating.toFixed(1) : '—'}
                    </span>
                    <span className="text-gray-600">({userProfile.reviews} Bewertungen)</span>
                  </div>
                </div>

                <div className="pt-6">
                  {userProfile.verified ? (
                    <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded">
                      ✓ Profil verifiziert
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded">
                      ⏳ Verifizierung ausstehend
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white text-center py-8 mt-16">
        <p>© 2024 DropConnect - Verbinde Dropshipper mit Lieferanten</p>
      </footer>
    </div>
  );
}
