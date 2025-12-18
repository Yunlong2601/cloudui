import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  HardDrive, 
  Activity, 
  Settings, 
  ArrowLeft,
  FileText,
  UserCheck,
  UserX
} from "lucide-react";

interface User {
  id: string;
  username: string;
  role: "user" | "admin";
  firstName: string;
  lastName: string;
  email: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (!response.ok) {
          navigate("/login");
          return;
        }
        
        const userData = await response.json();
        
        if (userData.role !== "admin") {
          navigate("/");
          return;
        }
        
        setUser(userData);
      } catch (error) {
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const stats = [
    { label: "Total Users", value: "2", icon: Users, color: "text-blue-600" },
    { label: "Active Sessions", value: "1", icon: Activity, color: "text-green-600" },
    { label: "Storage Used", value: "180.9 MB", icon: HardDrive, color: "text-purple-600" },
    { label: "Total Files", value: "10", icon: FileText, color: "text-orange-600" },
  ];

  const users = [
    { id: "user-1", username: "user", role: "user", firstName: "Regular", lastName: "User", email: "user@cloudvault.demo", status: "active" },
    { id: "admin-1", username: "admin", role: "admin", firstName: "Admin", lastName: "User", email: "admin@cloudvault.demo", status: "active" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Logged in as:</span>
              <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-slate-100 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>
              View and manage all registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Username</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <span className="font-medium text-slate-900">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.username}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === "admin" 
                            ? "bg-red-100 text-red-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {u.status === "active" ? (
                            <>
                              <UserCheck className="w-4 h-4 text-green-600" />
                              <span className="text-green-600 text-sm">Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-400 text-sm">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings (prototype)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-1">Storage Limit</h4>
                <p className="text-sm text-slate-500">15 GB per user</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-1">Max File Size</h4>
                <p className="text-sm text-slate-500">100 MB per file</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-1">Session Timeout</h4>
                <p className="text-sm text-slate-500">24 hours</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-1">Email Notifications</h4>
                <p className="text-sm text-slate-500">Not configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
