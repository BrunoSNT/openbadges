import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeCheck } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';

const Dashboard: React.FC = () => {
  const { t } = useI18nContext();
  const navigate = useNavigate();

  const leaderboardData = [
    { rank: 1, user: 'Alice', badges: 42 },
    { rank: 2, user: 'Bob', badges: 36 },
    { rank: 3, user: 'Carol', badges: 29 },
  ];

  return (
    <>

      <div className="prose max-w-prose mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold">{t('dashboard.overview.title')}</h2>
        <p className="mt-4">{t('dashboard.overview.description')}</p>
      </div>
      <section className="mt-12 max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">{t('dashboard.stats.title')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg">{t('dashboard.stats.credentialsIssued')}</h4>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg">{t('dashboard.stats.achievements')}</h4>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg">{t('dashboard.stats.verifications')}</h4>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>
      </section>
      <section className="mt-12 max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-2">{t('dashboard.activity.title')}</h3>
        <p className="text-muted-foreground">{t('dashboard.activity.emptyState.description')}</p>
      </section>

      <Card className="mt-16 overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col space-y-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('dashboard.activity.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.activity.description')}
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 sm:mt-0"
              onClick={() => navigate('/activity')}
            >
              {t('dashboard.activity.viewAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="mb-4 rounded-full bg-muted p-4">
              <BadgeCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium">{t('dashboard.activity.emptyState.title')}</h3>
            <p className="text-sm">
              {t('dashboard.activity.emptyState.description')}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-12 overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>{t('dashboard.leaderboard.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {leaderboardData.length > 0 ? (
            <table className="w-full text-left border-collapse mt-2">
              <thead>
                <tr>
                  <th className="border-b py-2">{t('dashboard.leaderboard.columns.rank')}</th>
                  <th className="border-b py-2">{t('dashboard.leaderboard.columns.user')}</th>
                  <th className="border-b py-2">{t('dashboard.leaderboard.columns.badges')}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((item) => (
                  <tr key={item.rank}>
                    <td className="py-2">{item.rank}</td>
                    <td className="py-2">{item.user}</td>
                    <td className="py-2">{item.badges}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">{t('dashboard.leaderboard.emptyState')}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Dashboard;
