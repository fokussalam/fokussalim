import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Search, UserPlus, Phone, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Anggota() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { isAdminOrPengurus } = useUserRole();

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (error) {
        console.error("Error fetching members:", error);
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter((member) =>
    member.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aktif":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "tidak_aktif":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Helmet>
        <title>Data Anggota - Salim | Komunitas Pengajian</title>
      </Helmet>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Data Anggota</h1>
              <p className="text-muted-foreground">
                Kelola data anggota komunitas
              </p>
            </div>
            {isAdminOrPengurus && (
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Anggota
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari anggota..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data anggota.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anggota</TableHead>
                        <TableHead className="hidden md:table-cell">Telepon</TableHead>
                        <TableHead className="hidden lg:table-cell">Alamat</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {getInitials(member.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.full_name}</p>
                                <p className="text-sm text-muted-foreground md:hidden">
                                  {member.phone || "-"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {member.phone || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate max-w-xs">
                                {member.address || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getStatusColor(member.status ?? "pending")}
                            >
                              {member.status === "aktif"
                                ? "Aktif"
                                : member.status === "pending"
                                ? "Pending"
                                : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
