import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AnalyticsModalProps {
  linkId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsModal({ linkId, isOpen, onClose }: AnalyticsModalProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/links", linkId, "analytics"],
    enabled: !!linkId && isOpen,
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatus = (link: any) => {
    if (!link?.isActive) return { text: "Inactive", variant: "secondary" as const };
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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Analytics</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : analytics && analytics.link ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-slate-900 mb-3">Link Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600">Original URL:</span>
                    <span className="text-slate-900 font-mono max-w-xs truncate text-right" title={analytics.link.originalUrl}>
                      {analytics.link.originalUrl}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Short URL:</span>
                    <span className="text-primary font-mono">
                      {window.location.host}/{analytics.link.customAlias || analytics.link.shortCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Created:</span>
                    <span className="text-slate-900">{formatDate(analytics.link.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Status:</span>
                    <Badge variant={getStatus(analytics.link).variant}>
                      {getStatus(analytics.link).text}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalClicks}</div>
                  <div className="text-sm text-blue-600">Total Clicks</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{analytics.recentClicks}</div>
                  <div className="text-sm text-green-600">Last 24h</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center bg-purple-50">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.floor((analytics.totalClicks / Math.max(1, Math.floor((new Date().getTime() - new Date(analytics.link.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1)))}
                  </div>
                  <div className="text-sm text-purple-600">Avg/Day</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center bg-orange-50">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.clicks.length > 0 ? new Set(analytics.clicks.map((c: any) => c.ipAddress).filter(Boolean)).size : 0}
                  </div>
                  <div className="text-sm text-orange-600">Unique IPs</div>
                </CardContent>
              </Card>
            </div>

            {analytics.clicks.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Recent Clicks - Detailed Device Information</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {analytics.clicks.slice(0, 10).map((click: any, index: number) => (
                      <div key={click.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-medium text-slate-700">Click #{analytics.clicks.length - index}</span>
                          <span className="text-sm text-slate-500">{formatDate(click.clickedAt)}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-2">
                            <h5 className="font-semibold text-slate-700 mb-2">Device Information</h5>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Device Type:</span>
                              <span className="text-slate-900 font-medium">{click.deviceType || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Device Model:</span>
                              <span className="text-slate-900 font-medium">{click.deviceModel || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Operating System:</span>
                              <span className="text-slate-900 font-medium">{click.operatingSystem || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Platform:</span>
                              <span className="text-slate-900">{click.platform || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Browser:</span>
                              <span className="text-slate-900 font-medium">{click.browser || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Browser Version:</span>
                              <span className="text-slate-900">{click.browserVersion || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Touch Support:</span>
                              <span className="text-slate-900">{click.touchSupport ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-slate-700 mb-2">Screen & Hardware</h5>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Screen Resolution:</span>
                              <span className="text-slate-900">{click.screenResolution || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Viewport Size:</span>
                              <span className="text-slate-900">{click.viewportSize || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Pixel Ratio:</span>
                              <span className="text-slate-900">{click.devicePixelRatio || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Color Depth:</span>
                              <span className="text-slate-900">{click.colorDepth || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">CPU Cores:</span>
                              <span className="text-slate-900">{click.cpuCores || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Device Memory:</span>
                              <span className="text-slate-900">{click.deviceMemory ? click.deviceMemory + 'GB' : 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Orientation:</span>
                              <span className="text-slate-900">{click.orientation || 'Unknown'}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-semibold text-slate-700 mb-2">Location & Network</h5>
                            <div className="flex justify-between">
                              <span className="text-slate-600">IP Address:</span>
                              <span className="text-slate-900 font-mono text-xs">{click.ipAddress || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Country:</span>
                              <span className="text-slate-900">{click.country || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">City:</span>
                              <span className="text-slate-900">{click.city || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Region:</span>
                              <span className="text-slate-900">{click.region || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">ISP:</span>
                              <span className="text-slate-900">{click.isp || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Connection Type:</span>
                              <span className="text-slate-900">{click.connectionType || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Network Speed:</span>
                              <span className="text-slate-900">{click.networkSpeed || 'Unknown'}</span>
                            </div>
                            {click.latitude && click.longitude && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">GPS Location:</span>
                                <span className="text-slate-900 font-mono text-xs">
                                  {parseFloat(click.latitude).toFixed(4)}, {parseFloat(click.longitude).toFixed(4)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-600">Language:</span>
                              <span className="text-slate-900">{click.language || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Timezone:</span>
                              <span className="text-slate-900">{click.timezone || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {(click.batteryLevel || click.isCharging || click.cookiesEnabled || click.javaScriptEnabled || click.doNotTrack || click.sessionId) && (
                          <div className="mt-4 pt-3 border-t border-slate-200">
                            <h5 className="font-semibold text-slate-700 mb-2">Additional Information</h5>
                            <div className="flex flex-wrap gap-2">
                              {click.batteryLevel && click.batteryLevel !== 'unknown' && (
                                <Badge variant="outline" className="text-xs">Battery: {click.batteryLevel}</Badge>
                              )}
                              {click.isCharging && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Charging</Badge>
                              )}
                              {click.cookiesEnabled && (
                                <Badge variant="outline" className="text-xs">Cookies Enabled</Badge>
                              )}
                              {click.javaScriptEnabled && (
                                <Badge variant="outline" className="text-xs">JavaScript Enabled</Badge>
                              )}
                              {click.doNotTrack && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Do Not Track</Badge>
                              )}
                              {click.sessionId && (
                                <Badge variant="outline" className="text-xs font-mono">Session: {click.sessionId.slice(-8)}</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {click.referrer && (
                          <div className="mt-3 pt-2 border-t border-slate-200">
                            <div className="flex justify-between items-start">
                              <span className="text-slate-600 text-sm">Referrer:</span>
                              <span className="text-slate-900 text-xs font-mono max-w-xs truncate text-right" title={click.referrer}>
                                {click.referrer}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No analytics data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
