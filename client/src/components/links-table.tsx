import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AnalyticsModal from "./analytics-modal";
import { Search, Download, BarChart3, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import type { LinkWithStats } from "@shared/schema";

export default function LinksTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery<LinkWithStats[]>({
    queryKey: ["/api/links"],
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/links/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    },
  });

  const filteredLinks = links.filter(link =>
    link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.customAlias && link.customAlias.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyToClipboard = async (shortUrl: string) => {
    await navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  const getStatus = (link: LinkWithStats) => {
    if (!link.isActive) return { text: "Inactive", variant: "secondary" as const };
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return { text: "Expired", variant: "destructive" as const };
    }
    if (link.expiresAt) {
      const hoursLeft = Math.floor(
        (new Date(link.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60)
      );
      if (hoursLeft < 24) {
        return { text: `Expires in ${hoursLeft}h`, variant: "secondary" as const };
      }
    }
    return { text: "Active", variant: "default" as const };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Your Links</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Input
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="text-slate-400" size={16} />
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2" size={16} />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Original URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Short URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm ? "No links found matching your search." : "No links created yet. Create your first short link above!"}
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => {
                  const status = getStatus(link);
                  const shortUrl = `${window.location.origin}/${link.shortCode}`;
                  
                  return (
                    <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 max-w-xs truncate" title={link.originalUrl}>
                          {link.originalUrl}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-primary">
                            {window.location.host}/{link.customAlias || link.shortCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(shortUrl)}
                            className="p-1 h-6 w-6"
                          >
                            <Copy size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(shortUrl, '_blank')}
                            className="p-1 h-6 w-6"
                          >
                            <ExternalLink size={12} />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{link.clickCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500">{formatDate(link.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLinkId(link.id)}
                            className="p-1 h-8 w-8 text-primary hover:text-primary/80"
                          >
                            <BarChart3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8 text-slate-400 hover:text-slate-600"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLinkMutation.mutate(link.id)}
                            disabled={deleteLinkMutation.isPending}
                            className="p-1 h-8 w-8 text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnalyticsModal 
        linkId={selectedLinkId} 
        isOpen={selectedLinkId !== null}
        onClose={() => setSelectedLinkId(null)}
      />
    </>
  );
}
