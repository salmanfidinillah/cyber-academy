import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";

// Reusable Loading component
export const LoadingBoundary: React.FC<{ message?: string }> = ({
  message = "Sedang menyiapkan petualangan belajarmu..."
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative w-16 h-16">
        {/* Outer stylized spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#111111] animate-spin" />
        {/* Inner colored circle */}
        <div className="absolute inset-2 bg-pastel-mint neo-border rounded-full flex items-center justify-center">
          <span className="text-xl animate-pulse">🚀</span>
        </div>
      </div>
      <p className="font-heading font-medium text-brand-text text-sm sm:text-base">
        {message}
      </p>
    </div>
  );
};

// Simple React Error Boundary implementation
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <NeoCard bgColor="bg-pastel-red" shadowSize="lg" className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-white neo-border flex items-center justify-center text-red-600 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-brand-text">Aduh, Terjadi Kesalahan!</h2>
            <p className="text-sm font-sans text-brand-text leading-relaxed">
              Platform mengalami gangguan saat memuat komponen ini. Jangan khawatir, progres belajarmu aman!
            </p>
            {this.state.error && (
              <pre className="p-3 bg-[#111111] text-pastel-mint text-left text-[11px] font-mono rounded-lg overflow-x-auto border-2 border-black max-h-[120px]">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2">
              <NeoButton variant="secondary" onClick={this.handleReload} className="w-full">
                Muat Ulang Halaman
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      );
    }

    return this.props.children;
  }
}

