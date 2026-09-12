"use client"

import Link from "next/link"
import { ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="shrink-0 text-slate-600 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search analyses"
            placeholder="Search analyses..."
            className="h-10 border-slate-200 bg-slate-50 pl-9 shadow-none focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Button
          render={<Link href="/new-analysis" />}
          className="hidden bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 sm:inline-flex"
        >
          <span className="mr-1">+</span>
          New Analysis
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-full p-1 outline-none ring-indigo-500/30 transition hover:bg-slate-100 focus-visible:ring-4"
            aria-label="Open user menu"
          >
            <Avatar className="size-9 bg-indigo-100 text-indigo-700">
              <AvatarFallback className="bg-indigo-100 font-semibold text-indigo-700">JD</AvatarFallback>
            </Avatar>
            <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}