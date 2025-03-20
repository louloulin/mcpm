"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GitHubIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RetroGrid } from "@/components/ui/retro-grid";
import HeroText from "@/components/hero-text";
import ServerDialog from "@/components/server-dialog";
import allServers from "@/public/servers.json";

const cmdBgColor = (cmd: string) => {
  switch (cmd) {
    case "npx":
      return "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300";
    case "uvx":
      return "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300";
    case "node":
      return "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300";
    case "python":
      return "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  }
};

export default function Home() {
  const [filter, setFilter] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [server, setServer] = useState(null);
  
  const onSearch = useCallback((words: string[]) => {
    setFilter(words);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    if (searchValue.trim()) {
      onSearch(searchValue.toLowerCase().split(/\s+/));
    } else {
      onSearch([]);
    }
  };

  const highlightText = (text: string) => {
    if (!text) return "";
    let result = text;
    filter.forEach((word) => {
      if (!word.trim()) return;
      const regex = new RegExp(word, "gi");
      result = result.replace(
        regex,
        (match) => `<span class="highlight bg-yellow-200 dark:bg-yellow-900">${match}</span>`,
      );
    });
    return result;
  };
  
  const servers = useMemo(() => {
    let filteredServers = allServers;
    if (filter.length > 0) {
      filteredServers = allServers.filter((s: any) => {
        return filter.every((f) => {
          if (!f.trim()) return true;
          return (
            (s.name || s.key).toLowerCase().includes(f.toLowerCase()) ||
            (s.description || "").toLowerCase().includes(f.toLowerCase())
          );
        });
      });
    }
    return filteredServers.sort((a, b) => {
      const nameA = a.name || a.key;
      const nameB = b.name || b.key;
      return nameA.localeCompare(nameB);
    });
  }, [filter]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full border-b">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" width={48} height={48} alt="mcpsvr logo" className="h-12 w-12" />
            <span className="font-bold text-xl hidden sm:inline-block">MCPSvr</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Input
                type="search"
                placeholder="Search servers..."
                className="pr-8"
                onChange={handleSearch}
              />
            </div>
            
            <Button asChild variant="default">
              <a
                href="https://github.com/hex/mcpsvr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <GitHubIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Submit</span>
              </a>
            </Button>
          </div>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="hidden md:block">
            <div className="absolute flex justify-center w-full z-10">
              <div className="container py-12">
                <HeroText />
              </div>
            </div>
            <RetroGrid />
          </div>
          
          <div className="md:hidden container py-12">
            <h1 className="text-4xl font-bold">
              Discover Exceptional MCP Servers
            </h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servers.map((s: any) => (
            <Card 
              key={s.key} 
              className="h-full transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                setServer(s);
                setOpen(true);
              }}
            >
              <CardContent className="p-5">
                <h2 className="text-xl font-medium mb-2">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightText(s.name || s.key),
                    }}
                  />
                </h2>
                <p
                  className="text-sm line-clamp-4 text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(s.description || ""),
                  }}
                />
              </CardContent>
              
              <CardFooter className="flex justify-between items-center px-5 pb-5 pt-0">
                <Badge variant="outline" className={cn(cmdBgColor(s.command))}>
                  {s.command}
                </Badge>
                
                {s.homepage && (
                  <Link
                    href={s.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {new URL(s.homepage).hostname}
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      
      {server && <ServerDialog server={server} open={open} setOpen={setOpen} />}
    </div>
  );
}
