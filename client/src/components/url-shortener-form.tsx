import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLinkSchema, type InsertLink } from "@shared/schema";
import { Link, Sparkles, Copy, CheckCircle } from "lucide-react";

type FormData = InsertLink;

export default function UrlShortenerForm() {
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(insertLinkSchema),
    defaultValues: {
      originalUrl: "",
      customAlias: "",
      expiration: "",
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/links", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShortenedUrl(data.shortUrl);
      toast({
        title: "Success!",
        description: "Your link has been shortened successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URL",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createLinkMutation.mutate(data);
  };

  const copyToClipboard = async () => {
    if (shortenedUrl) {
      await navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Shorten Your Long URLs</h2>
          <p className="text-slate-600 text-lg">Create short, memorable links that are easy to share</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com/very-long-url-that-needs-shortening"
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Link className="text-slate-400" size={16} />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customAlias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Alias (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                          <span className="text-slate-500 text-sm">sihabshort.com/</span>
                        </div>
                        <Input
                          {...field}
                          placeholder="my-custom-link"
                          className="pl-32"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Never expire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="never">Never expire</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="1w">1 Week</SelectItem>
                        <SelectItem value="1m">1 Month</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg"
                disabled={createLinkMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createLinkMutation.isPending ? (
                  "Shortening..."
                ) : (
                  <>
                    <Sparkles className="mr-2" size={16} />
                    Shorten URL
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {shortenedUrl && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-4">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <h3 className="text-lg font-semibold text-green-800">Success! Your link has been shortened</h3>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">Shortened URL:</p>
                  <p className="text-lg font-mono text-slate-900 break-all">{shortenedUrl}</p>
                </div>
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="ml-4 bg-primary text-white hover:bg-primary/90"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2" size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2" size={16} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
