import { useNavigate } from "react-router-dom";
import type { Achievement } from "@/types/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

interface AchievementListProps {
  achievements: Achievement[];
  loading: boolean;
  searchQuery?: string;
}

export function AchievementList({ achievements, loading, searchQuery = "" }: AchievementListProps) {
  const navigate = useNavigate();
  const { tAchievements, tCommon } = useTranslation();

  const handleIssueCredential = (achievementId: string) => {
    navigate(`/achievements/${achievementId}/issue`);
  };

  // Filter achievements based on search query
  const filteredAchievements = achievements.filter(achievement =>
    achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    achievement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (achievement.tags && achievement.tags.some(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredAchievements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? tAchievements('noResults') : tAchievements('noAchievements')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? tAchievements('noResultsDescription', { searchQuery })
              : tAchievements('getStartedDescription')
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/achievements/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {tAchievements('createButton')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map((achievement) => (
          <Card key={achievement.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {achievement.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {achievement.description}
                  </CardDescription>
                </div>
                {achievement.image && (
                  <div className="ml-4 flex-shrink-0">
                    <img 
                      src={typeof achievement.image === 'string' ? achievement.image : achievement.image?.id} 
                      alt={achievement.name}
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {achievement.criteria?.narrative && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">{tAchievements('criteria')}</h4>
                  <p className="text-sm line-clamp-3">{achievement.criteria.narrative}</p>
                </div>
              )}
              
              {achievement.tags && achievement.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {achievement.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {achievement.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{achievement.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Created {
                  (achievement as any).createdAt 
                    ? new Date((achievement as any).createdAt).toLocaleDateString()
                    : 'Unknown date'
                }</span>
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/achievements/${achievement.id}`)}
                className="flex-1"
              >
                {tAchievements('viewDetails')}
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleIssueCredential(achievement.id)}
                className="flex-1"
              >
                {tAchievements('issueCredential')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
