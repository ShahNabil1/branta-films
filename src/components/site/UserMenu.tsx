import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName, useAuth, useSignOut } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";

export function UserAvatar({ size = "size-9" }: { size?: string }) {
  const { profile, user } = useAuth();
  const name = displayName(profile, user);
  return (
    <Avatar className={size}>
      {profile?.avatar_url ? <AvatarImage src={mediaUrl(profile.avatar_url) ?? undefined} alt="" /> : null}
      <AvatarFallback className="bg-accent text-sm font-medium text-accent-foreground">
        {name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserMenu() {
  const { profile, user, isStaff } = useAuth();
  const signOut = useSignOut();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="rounded-full" aria-label="Account menu">
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{displayName(profile, user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">
            <LayoutDashboard /> My dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/profile">
            <UserRound /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/security">
            <Shield /> Sign-in & security
          </Link>
        </DropdownMenuItem>
        {isStaff ? (
          <DropdownMenuItem disabled>
            <Shield /> Admin panel (coming next)
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
