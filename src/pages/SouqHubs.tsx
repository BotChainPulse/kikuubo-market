import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Clock, ShieldCheck, Package, RotateCcw, Store, Search, Navigation } from "lucide-react";

const SERVICES: Record<string, { icon: any; label: string; color: string }> = {
  verification: { icon: ShieldCheck, label: "Verification", color: "bg-blue-100 text-blue-800" },
  pickup: { icon: Package, label: "Pickup", color: "bg-green-100 text-green-800" },
  returns: { icon: RotateCcw, label: "Returns", color: "bg-orange-100 text-orange-800" },
  cash_deposit: { icon: Store, label: "Cash Deposit", color: "bg-purple-100 text-purple-800" },
};

export default function SouqHubs() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const { data: hubs } = trpc.trust.hubs.list.useQuery();

  const filtered = hubs?.filter((hub: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return hub.name.toLowerCase().includes(term) || hub.town.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Souq Hubs</h1>
        <p className="text-muted-foreground">Physical touchpoints for verification, pickup, returns & cash deposits</p>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by town or hub name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="Central">Central</SelectItem>
            <SelectItem value="Western">Western</SelectItem>
            <SelectItem value="Eastern">Eastern</SelectItem>
            <SelectItem value="Northern">Northern</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((hub: any) => (
          <Card key={hub.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{hub.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {hub.town}, {hub.district}
                  </CardDescription>
                </div>
                <Badge className={hub.hubType === "full_service" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                  {hub.hubType.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{hub.address}</div>
              <div className="flex flex-wrap gap-2">
                {(hub.services as string[])?.map((s: string) => {
                  const cfg = SERVICES[s]; if (!cfg) return null; const Icon = cfg.icon;
                  return <Badge key={s} className={`${cfg.color} border-0 text-xs`}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>;
                })}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{hub.phone}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{hub.operatingHours || "Mon-Sat: 8AM-6PM"}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`tel:${hub.phone}`)}>
                  <Phone className="h-3 w-3 mr-1" /> Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
