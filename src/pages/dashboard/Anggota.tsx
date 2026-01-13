import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { MemberForm } from "@/components/forms/MemberForm";
import { DeleteDialog } from "@/components/forms/DeleteDialog";
import { Search, Phone, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Anggota() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { isAdminOrPengurus } = useUserRole();
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("full_name");
    if (error) console.error("Error fetching members:", error);
    else setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleDelete = async (id: string) => {
    // Note: RLS doesn't allow delete on profiles, but we can set status to tidak_aktif
    const { error } = await supabase.from("profiles").update({ status: "tidak_aktif" }).eq("id", id);
    if (error) {
      toast({ title: "Gagal", description: "Gagal menonaktifkan anggota.", variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Anggota telah dinonaktifkan." });
      fetchMembers();
    }
  };

  const filteredMembers = members.filter((member) =>
    member.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aktif": return "bg-emerald-100 text-emerald-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "tidak_aktif": return "bg-red-100 text-red-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aktif": return "Aktif";
      case "pending": return "Pending";
      case "tidak_aktif": return "Tidak Aktif";
      default: return status;
    }
  };

  return (
    <>
      <Helmet><title>Data Anggota - Salim | Komunitas Pengajian</title></Helmet>
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Data Anggota</h1>
                <p className="text-sm text-muted-foreground">{members.length} anggota terdaftar</p>
              </div>
              {isAdminOrPengurus && <MemberForm onSuccess={fetchMembers} />}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari anggota..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">{search ? "Anggota Tidak Ditemukan" : "Belum Ada Anggota"}</h3>
                <p className="text-muted-foreground">{search ? `Tidak ada anggota dengan nama "${search}"` : "Tambahkan anggota pertama komunitas Anda."}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{getInitials(member.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate">{member.full_name}</h3>
                          <Badge variant="secondary" className={`text-xs flex-shrink-0 ${getStatusColor(member.status ?? "pending")}`}>
                            {getStatusLabel(member.status ?? "pending")}
                          </Badge>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{member.phone}</span>
                          </div>
                        )}
                        {member.address && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{member.address}</span>
                          </div>
                        )}
                        {isAdminOrPengurus && (
                          <div className="flex items-center gap-1 pt-2">
                            <MemberForm
                              member={member}
                              onSuccess={fetchMembers}
                              trigger={
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </Button>
                              }
                            />
                            {member.status !== "tidak_aktif" && (
                              <DeleteDialog
                                title="Nonaktifkan Anggota?"
                                description={`Anggota "${member.full_name}" akan dinonaktifkan. Anda dapat mengaktifkannya kembali nanti.`}
                                onDelete={() => handleDelete(member.id)}
                                trigger={
                                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Nonaktifkan
                                  </Button>
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}