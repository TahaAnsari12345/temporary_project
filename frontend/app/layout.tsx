import type { Metadata } from "next";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "SocialSense",
  description: "AI-powered social media intelligence",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>
            <Toaster>
              <DashboardLayout>{children}</DashboardLayout>
            </Toaster>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
