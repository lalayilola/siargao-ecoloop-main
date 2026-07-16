import { useEffect, useState } from "react";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Leaf, Award, TrendingUp, Zap, Recycle, Heart, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: typeof Award;
  color: string;
  requirement: number;
  iconColor: string;
}

const BADGE_TYPES: BadgeData[] = [
  {
    id: "waste-warrior",
    name: "Waste Warrior",
    description: "Submit 10 food waste reports",
    icon: Recycle,
    color: "bg-amber-100",
    requirement: 10,
    iconColor: "text-amber-600",
  },
  {
    id: "eco-enthusiast",
    name: "Eco Enthusiast",
    description: "Earn 500 eco points",
    icon: Heart,
    color: "bg-red-100",
    requirement: 500,
    iconColor: "text-red-600",
  },
  {
    id: "sustainability-scholar",
    name: "Sustainability Scholar",
    description: "Create 5 community posts",
    icon: BookOpen,
    color: "bg-blue-100",
    requirement: 5,
    iconColor: "text-blue-600",
  },
];

const POINT_SYSTEM = {
  waste_report_submitted: 25,
  waste_collection_scheduled: 10,
  produce_listed: 20,
  produce_sold: 30,
  community_post: 10,
  post_liked: 1,
  post_commented: 5,
};

export function EcoPointsView() {
  const { user, profile } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsBreakdown, setPointsBreakdown] = useState<Record<string, number>>({});
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadEcoPoints = async () => {
      try {
        // For now, calculate points based on activities
        // In a full implementation, this would be stored in a database
        let points = 0;

        // Get waste reports
        const { data: wasteReports } = await supabase
          .from("waste_reports")
          .select("*")
          .eq("user_id", user.id);

        points += (wasteReports?.length || 0) * POINT_SYSTEM.waste_report_submitted;

        // Get listings (for farmers)
        if (profile?.primary_role === "farmer") {
          const { data: listings } = await supabase
            .from("marketplace_listings")
            .select("*")
            .eq("user_id", user.id);

          points += (listings?.length || 0) * POINT_SYSTEM.produce_listed;
        }

        // Get posts
        const { data: posts } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id);

        points += (posts?.length || 0) * POINT_SYSTEM.community_post;

        setTotalPoints(points);

        // Calculate breakdown
        const breakdown: Record<string, number> = {
          "Waste Reports": (wasteReports?.length || 0) * POINT_SYSTEM.waste_report_submitted,
          "Community Posts": (posts?.length || 0) * POINT_SYSTEM.community_post,
        };

        if (profile?.primary_role === "farmer") {
          const { data: listings } = await supabase
            .from("marketplace_listings")
            .select("*")
            .eq("user_id", user.id);
          breakdown["Produce Listings"] = (listings?.length || 0) * POINT_SYSTEM.produce_listed;
        }

        setPointsBreakdown(breakdown);

        // Unlock badges based on points and activities
        const badges = [];
        if ((wasteReports?.length || 0) >= 10) badges.push(BADGE_TYPES[0]);
        if (points >= 500) badges.push(BADGE_TYPES[1]);
        if ((posts?.length || 0) >= 5) badges.push(BADGE_TYPES[2]);

        setUnlockedBadges(badges);
        setLoading(false);
      } catch (error) {
        console.error("Error loading eco points:", error);
        setLoading(false);
      }
    };

    void loadEcoPoints();
  }, [user, profile]);

  return (
    <>
      <PageHero
        eyebrow="Eco Points"
        title="Earn Rewards for Sustainable Actions"
        sub="Track your eco points and unlock badges as you contribute to the circular economy."
      />
      <Container className="py-12">
        {/* Total Points */}
        <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/10 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 mb-2">Total Eco Points</p>
              <h2 className="text-5xl font-display font-bold text-primary">{totalPoints}</h2>
            </div>
            <div className="text-right">
              <Zap className="h-20 w-20 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Keep it up!</p>
            </div>
          </div>
        </Card>

        {/* Points Breakdown */}
        {Object.keys(pointsBreakdown).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Points Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(pointsBreakdown).map(([category, points]) => (
                <Card key={category} className="p-4 border-2 border-primary/20">
                  <p className="text-sm text-slate-600 mb-2">{category}</p>
                  <p className="text-2xl font-bold text-primary">{points}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Badges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BADGE_TYPES.map((badge) => {
              const isUnlocked = unlockedBadges.some((b) => b.id === badge.id);
              return (
                <Card
                  key={badge.id}
                  className={`p-6 border-2 text-center transition-all ${
                    isUnlocked
                      ? `${badge.color} border-current`
                      : "border-slate-200 bg-slate-50 opacity-50"
                  }`}
                >
                  <badge.icon className={`h-12 w-12 mx-auto mb-3 ${isUnlocked ? badge.iconColor : "text-slate-400"}`} />
                  <h4 className={`font-semibold mb-1 ${isUnlocked ? "text-slate-900" : "text-slate-600"}`}>
                    {badge.name}
                  </h4>
                  <p className={`text-xs ${isUnlocked ? "text-slate-700" : "text-slate-500"}`}>
                    {badge.description}
                  </p>
                  {!isUnlocked && (
                    <p className="text-xs text-slate-500 mt-2">({badge.requirement} required)</p>
                  )}
                  {isUnlocked && <p className="text-xs font-semibold text-primary mt-2">✓ Unlocked</p>}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <Card className="p-6 border-2 border-secondary/30 bg-secondary/10 mt-8">
          <h3 className="font-semibold text-slate-900 mb-3">💡 How to Earn More Points</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Submit food waste reports: +{POINT_SYSTEM.waste_report_submitted} points each</li>
            <li>• Create community posts: +{POINT_SYSTEM.community_post} points each</li>
            {profile?.primary_role === "farmer" && (
              <li>• List produce: +{POINT_SYSTEM.produce_listed} points each</li>
            )}
          </ul>
        </Card>
      </Container>
    </>
  );
}
