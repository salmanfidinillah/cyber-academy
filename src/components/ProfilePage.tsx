import React, { useEffect, useState } from "react";
import { User } from "../types";
import { Award, BookOpen, CheckCircle, Clock, Flame, GraduationCap, PenLine, Settings, User as UserIcon } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { fetchMyBadges, fetchMyCertificates } from "../services/achievementService";
import { fetchMyProgress } from "../services/learningStateService";
import { cn } from "../lib/utils";

interface ProfilePageProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onNavigate }) => {
  const [stats, setStats] = useState({
    badges: 0,
    certificates: 0,
    completedLessons: 0,
    completedCourses: 0,
  });

  useEffect(() => {
    let active = true;
    Promise.all([fetchMyBadges(), fetchMyCertificates(), fetchMyProgress()])
      .then(([badges, certs, progress]) => {
        if (!active) return;
        setStats({
          badges: badges.length,
          certificates: certs.filter((certificate) => certificate.status === "active").length,
          completedLessons: progress.filter((item) => item.contentType === "lesson" && item.status === "completed").length,
          completedCourses: progress.filter((item) => item.contentType === "course" && item.status === "completed").length,
        });
      })
      .catch((error) => console.error("Gagal memuat statistik profil:", error));
    return () => {
      active = false;
    };
  }, [currentUser.uid]);

  const provider = currentUser.providerIds?.[0] || "password";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Profil Pengguna</h1>
          <p className="text-gray-600">Lihat ringkasan identitas dan pencapaian Anda.</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <NeoButton 
            variant="secondary" 
            onClick={() => onNavigate("/settings/profile")}
            className="flex-1 md:flex-none justify-center flex items-center gap-2"
          >
            <PenLine className="w-4 h-4" />
            <span>Edit Profil</span>
          </NeoButton>
          <NeoButton 
            variant="primary" 
            onClick={() => onNavigate("/settings")}
            className="flex-1 md:flex-none justify-center flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan</span>
          </NeoButton>
        </div>
      </div>

      <NeoCard className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="w-32 h-32 rounded-2xl neo-border object-cover bg-white"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl neo-border bg-pastel-mint flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-black" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="text-2xl font-bold font-heading">{currentUser.displayName}</h2>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>
            
            {currentUser.bio && (
              <p className="text-gray-800 text-sm max-w-lg mx-auto md:mx-0">{currentUser.bio}</p>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-pastel-blue text-sm font-bold neo-border rounded-full">
                Level {currentUser.currentLevel}
              </span>
              <span className="px-3 py-1 bg-pastel-yellow text-sm font-bold neo-border rounded-full flex items-center">
                <Flame className="w-3 h-3 mr-1" />
                {currentUser.learningStreak} Hari Streak
              </span>
              <span className="px-3 py-1 bg-gray-100 text-xs font-bold neo-border rounded-full text-gray-600 uppercase tracking-wider">
                Login: {provider}
              </span>
            </div>
          </div>
        </div>
      </NeoCard>

      <h3 className="text-xl font-heading font-bold mt-10 mb-4">Statistik Belajar</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeoCard className="p-4 text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-pastel-blue" />
          <p className="text-3xl font-bold">{stats.completedCourses}</p>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Course Selesai</p>
        </NeoCard>
        
        <NeoCard className="p-4 text-center">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-pastel-mint" />
          <p className="text-3xl font-bold">{stats.completedLessons}</p>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Lesson Selesai</p>
        </NeoCard>
        
        <NeoCard className="p-4 text-center">
          <Award className="w-8 h-8 mx-auto mb-2 text-pastel-yellow" />
          <p className="text-3xl font-bold">{stats.badges}</p>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Badge Diperoleh</p>
        </NeoCard>
        
        <NeoCard className="p-4 text-center">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 text-pastel-red" />
          <p className="text-3xl font-bold">{stats.certificates}</p>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Sertifikat</p>
        </NeoCard>
      </div>
      
    </div>
  );
};
