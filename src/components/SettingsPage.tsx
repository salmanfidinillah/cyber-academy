import React from "react";
import { User } from "../types";
import { User as UserIcon, Mail, Shield, ChevronRight } from "lucide-react";
import { NeoCard } from "./NeoCard";

interface SettingsPageProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const settingsMenu = [
    {
      title: "Profil",
      description: "Ubah avatar, nama, dan bio Anda.",
      icon: <UserIcon className="w-6 h-6 text-pastel-blue" />,
      route: "/settings/profile",
    },
    {
      title: "Akun",
      description: "Kelola email dan metode masuk Anda.",
      icon: <Mail className="w-6 h-6 text-pastel-yellow" />,
      route: "/settings/account",
    },
    {
      title: "Keamanan",
      description: "Ubah kata sandi dan keamanan lainnya.",
      icon: <Shield className="w-6 h-6 text-pastel-red" />,
      route: "/settings/security",
    }
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola profil, akun, dan preferensi keamanan Anda.</p>
      </div>

      <div className="space-y-4">
        {settingsMenu.map((menu, index) => (
          <button 
            key={index} 
            onClick={() => onNavigate(menu.route)}
            className="w-full text-left focus:outline-none focus:ring-4 focus:ring-pastel-mint rounded-xl"
          >
            <NeoCard className="p-6 flex items-center hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl neo-border flex items-center justify-center bg-white mr-4">
                {menu.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{menu.title}</h3>
                <p className="text-sm text-gray-500">{menu.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </NeoCard>
          </button>
        ))}
      </div>
    </div>
  );
};
