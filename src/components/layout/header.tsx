import { Copy, Settings, LogOut, Building2, Layers, Clock, FileText, Calendar, BarChart2, BarChart as ChartBar, History, Wand2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  session: Session;
}

export function Header({ session }: HeaderProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Copy className="h-8 w-8 text-blue-600" />
            <h1 className="ml-3 text-xl font-semibold text-gray-900">Google Ads Campaign Automation</h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/google-ads-accounts">
            <Button variant="outline" size="sm">
              <Building2 className="mr-2 h-4 w-4" />
              Accounts
            </Button>
          </Link>
          <Link to="/campaigns/copy-modify">
            <Button variant="outline" size="sm">
              <Layers className="mr-2 h-4 w-4" />
              Copy Campaigns
            </Button>
          </Link>
          <Link to="/campaigns/clone-wizard">
            <Button variant="outline" size="sm">
              <Wand2 className="mr-2 h-4 w-4" />
              Clone Wizard
            </Button>
          </Link>
          <Link to="/campaigns/compare">
            <Button variant="outline" size="sm">
              <ChartBar className="mr-2 h-4 w-4" />
              Compare
            </Button>
          </Link>
          <Link to="/tasks">
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Tasks
            </Button>
          </Link>
          <Link to="/tasks/templates">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Link to="/tasks/schedules">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedules
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="outline" size="sm">
              <BarChart2 className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
          <Link to="/operations">
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              Operations
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}