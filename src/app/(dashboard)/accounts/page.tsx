import { YouTubeChannelCard } from "@/components/modules/accounts/youtube-channel-card";
import { DriveAccountCard } from "@/components/modules/accounts/drive-account-card";

export default function AccountsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Connected Accounts</h2>
        <p className="text-xs text-zinc-400">
          Manage Google OAuth, YouTube channel publishing, and Google Drive temporary media staging (Section 5.1 & 7)
        </p>
      </div>

      <YouTubeChannelCard />

      <DriveAccountCard />
    </div>
  );
}
