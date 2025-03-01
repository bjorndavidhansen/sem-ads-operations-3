import { useState } from 'react';
import { ReportBuilder } from '../../components/reporting/report-builder';
import { ReportList } from '../../components/reporting/report-list';
import { Button } from '../../components/ui/button';
import { Plus, List } from 'lucide-react';

export function ReportsPage() {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBuilder(!showBuilder)}
            >
              {showBuilder ? (
                <>
                  <List className="h-4 w-4 mr-2" />
                  View Saved Reports
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </>
              )}
            </Button>
          </div>
        </div>

        {showBuilder ? (
          <ReportBuilder onClose={() => setShowBuilder(false)} />
        ) : (
          <ReportList onCreateNew={() => setShowBuilder(true)} />
        )}
      </div>
    </div>
  );
}